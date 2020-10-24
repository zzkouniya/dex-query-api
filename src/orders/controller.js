const config = require('../config');
const indexer = require('../indexer');

class Controller {
  async getOrders(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      public_key_hash,
    } = req.query;
    try {
      const orderCells = await indexer.collectCells({
        type: {
          code_hash: type_code_hash,
          hash_type: type_hash_type,
          args: type_args,
        },
        lock: {
          code_hash: config.contracts.orderLock.codeHash,
          hash_type: config.contracts.orderLock.hashType,
          args: public_key_hash,
        },
      });
      const formattedOrderCells = orderCells.map((orderCell) => {
        const parsedOrderData = parseOrderData(orderCell.data);
        return {
          sudt_amount: parsedOrderData.sUDTAmount.toString(),
          order_amount: parsedOrderData.orderAmount.toString(),
          price: parsedOrderData.price.toString(),
          is_bid: parsedOrderData.isBid,
          raw_data: orderCell,
        };
      });
      res.status(200).json(formattedOrderCells);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }

  async getBestPrice(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      is_bid,
    } = req.query;

    const orderCells = await indexer.collectCells({
      type: {
        code_hash: type_code_hash,
        hash_type: type_hash_type,
        args: type_args,
      },
      lock: {
        code_hash: config.contracts.orderLock.codeHash,
        hash_type: config.contracts.orderLock.hashType,
        args: '0x',
      },
      argsLen: 'any',
    });

    if (!orderCells.length) {
      return res.status(404).send();
    }

    try {
      const formattedOrderCells = formatOrderCells(orderCells);

      const orderCell = formattedOrderCells
        .filter((cell) => is_bid !== cell.isBid)
        .sort((a, b) => {
          if (is_bid) {
            return a.price - b.price;
          }

          return b.price - a.price;
        })[0];

      res.status(200).json({ price: orderCell.price });
    } catch (error) {
      res.status(500).send();
    }
  }

  async getOrderHistory(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      public_key_hash,
    } = req.query;

    const sudtType = {
      code_hash: type_code_hash,
      hash_type: type_hash_type,
      args: type_args,
    };

    const orderLock = {
      code_hash: config.contracts.orderLock.codeHash,
      hash_type: config.contracts.orderLock.hashType,
      args: public_key_hash,
    };

    const txsByInputOutPoint = new Map();
    const usedInputOutPoints = new Set();

    try {
      const txsWithStatus = await indexer.collectTransactions({
        type: sudtType,
        lock: orderLock,
      });

      for (const txWithStatus of txsWithStatus) {
        const { transaction } = txWithStatus;
        const { inputs } = transaction;

        for (const input of inputs) {
          const { tx_hash, index } = input.previous_output;
          const inputOutPoint = formatInputOutPoint(tx_hash, parseInt(index, 16));
          if (!txsByInputOutPoint.has(inputOutPoint)) {
            txsByInputOutPoint.set(inputOutPoint, transaction);
          }
        }
      }

      const ordersHistory = [];
      for (const txWithStatus of txsWithStatus) {
        const { transaction } = txWithStatus;
        const { hash, outputs, outputs_data } = transaction;

        const groupedOrderCells = groupOrderCells(outputs, orderLock, sudtType);
        for (let groupedIndex = 0; groupedIndex < groupedOrderCells.length; groupedIndex++) {
          const groupedOrderCell = groupedOrderCells[groupedIndex];
          const [originalIndex, output] = groupedOrderCell;

          if (!isOrderCell(output, orderLock, sudtType)) {
            continue;
          }

          const inputOutPoint = formatInputOutPoint(hash, originalIndex);
          if (usedInputOutPoints.has(inputOutPoint)) {
            continue;
          }

          const data = outputs_data[originalIndex];
          output.data = data;
          output.outpoint = {
            txHash: hash,
            index: originalIndex,
          };
          const lastOrderCell = getLastOrderCell(hash, originalIndex, groupedOrderCell, txsByInputOutPoint, usedInputOutPoints, orderLock, sudtType);
          ordersHistory.push({
            firstOrderCell: output,
            lastOrderCell,
          });
        }
      }

      for (const orderHistory of ordersHistory) {
        const { firstOrderCell, lastOrderCell } = orderHistory;
        const firstOrderCellData = parseOrderData(firstOrderCell.data);
        const lastOrderCellData = parseOrderData(lastOrderCell.data);

        const tradedAmount = firstOrderCellData.orderAmount - lastOrderCellData.orderAmount;
        const turnoverRate = Number((tradedAmount * 100n) / firstOrderCellData.orderAmount) / 100;

        orderHistory.tradedAmount = tradedAmount;
        orderHistory.turnoverRate = turnoverRate;
        orderHistory.orderAmount = firstOrderCellData.orderAmount;
        orderHistory.isBid = firstOrderCellData.isBid;
      }

      const formattedOrdersHistory = ordersHistory.map((orderHistory) => {
        const outpoint = orderHistory.lastOrderCell.outpoint;
        const inputOutPoint = formatInputOutPoint(outpoint.txHash, outpoint.index);
        const isLive = !!txsByInputOutPoint.get(inputOutPoint);

        let status;
        let claimable = false;
        if (orderHistory.turnoverRate === 1) {
          status = 'completed';
          if (!isLive) {
            claimable = true;
          }
        } else {
          status = 'open';
          if (isLive) {
            status = 'aborted';
          }
        }

        const formattedOrderHistory = {
          is_bid: orderHistory.isBid,
          order_amount: orderHistory.orderAmount.toString(),
          traded_amount: orderHistory.tradedAmount.toString(),
          turnover_rate: orderHistory.turnoverRate.toString(),
          claimable,
          status,
          last_order_cell_outpoint: {
            tx_hash: outpoint.txHash,
            index: `0x${outpoint.index.toString(16)}`,
          },
        };
        return formattedOrderHistory;
      });
      res.status(200).json(formattedOrdersHistory);
    } catch (error) {
      console.error(error);
      res.status(500).send();
    }
  }
}

const groupOrderCells = (cells, orderLock, sudtType) => {
  const groupedCells = [];
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (isOrderCell(cell, orderLock, sudtType)) {
      groupedCells.push([i, cell]);
    }
  }
  return groupedCells;
};

const isOrderCell = (cell, orderLock, sudtType) => {
  const { lock, type } = cell;

  if (
    !equalsScript(lock, orderLock)
    || !equalsScript(type, sudtType)
  ) {
    return false;
  }
  return true;
};

const equalsScript = (script1, script2) => {
  if (!script1 && script2) {
    return false;
  }

  if (script1 && !script2) {
    return false;
  }

  if (
    script1.args !== script2.args
    || script1.code_hash !== script2.code_hash
    || script1.hash_type !== script2.hash_type
  ) {
    return false;
  }
  return true;
};

const getLastOrderCell = (hash, index, groupedOrderCell, txsByInputOutPoint, usedInputOutPoints, orderLock, sudtType) => {
  const inputOutPoint = formatInputOutPoint(hash, index);
  const nextTransaction = txsByInputOutPoint.get(inputOutPoint);

  if (!usedInputOutPoints.has(inputOutPoint)) {
    usedInputOutPoints.add(inputOutPoint);
  }

  const [groupedIndex, currentOutput] = groupedOrderCell;

  if (!nextTransaction) {
    return currentOutput;
  }

  const nextGroupedOrderCells = groupOrderCells(nextTransaction.outputs, orderLock, sudtType);

  const nextTxHash = nextTransaction.hash;
  // const nextOutput = nextTransaction.outputs[index];
  const nextGroupedOrderCell = nextGroupedOrderCells[groupedIndex];

  if (!nextGroupedOrderCell) {
    return currentOutput;
  }

  const [nextOriginalIndex, nextOutput] = nextGroupedOrderCell;
  const { lock, type } = nextOutput;
  if (
    !equalsScript(lock, orderLock)
    || !equalsScript(type, sudtType)
  ) {
    return currentOutput;
  }

  nextOutput.data = nextTransaction.outputs_data[nextOriginalIndex];

  nextOutput.outpoint = {
    txHash: nextTxHash,
    index: nextOriginalIndex,
  };

  return getLastOrderCell(nextTxHash, nextOriginalIndex, nextGroupedOrderCell, txsByInputOutPoint, usedInputOutPoints, orderLock, sudtType);
};

const formatInputOutPoint = (txHash, index) => (`${txHash}0x${index.toString(16)}`);

const formatOrderCells = (orderCells) => {
  const formattedOrderCells = orderCells.map((orderCell) => {
    const parsedOrderData = parseOrderData(orderCell.data);
    return {
      sUDTAmount: parsedOrderData.sUDTAmount.toString(),
      orderAmount: parsedOrderData.orderAmount.toString(),
      price: parsedOrderData.price.toString(),
      isBid: parsedOrderData.isBid,
      rawData: orderCell,
    };
  });
  return formattedOrderCells;
};

const parseOrderData = (hex) => {
  const sUDTAmount = parseAmountFromLeHex(hex.slice(0, 34));
  const orderAmount = parseAmountFromLeHex(hex.slice(34, 66));

  let price;
  try {
    const priceBuf = Buffer.from(hex.slice(66, 82), 'hex');
    price = priceBuf.readBigInt64LE();
  } catch (error) {
    price = null;
  }

  const isBid = hex.slice(82, 84) === '00';

  return {
    sUDTAmount,
    orderAmount,
    price,
    isBid,
  };
};

const parseAmountFromLeHex = (leHex) => {
  try {
    return readBigUInt128LE(leHex.startsWith('0x') ? leHex.slice(0, 34) : `0x${leHex.slice(0, 32)}`);
  } catch (error) {
    return BigInt(0);
  }
};

const readBigUInt128LE = (leHex) => {
  if (leHex.length !== 34 || !leHex.startsWith('0x')) {
    throw new Error('leHex format error');
  }
  const buf = Buffer.from(leHex.slice(2), 'hex');
  return (buf.readBigUInt64LE(8) << BigInt(64)) + buf.readBigUInt64LE(0);
};

module.exports = new Controller();
