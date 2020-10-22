const indexer = require('../../indexer')

const orderLockCodeHash = '0xeef5d7b6f61dc21be89763907e6966f8b776f33e0bf718c2c718dea90f577dbf'
class Controller {
  async getOrders(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args, 
      public_key_hash,
    } = req.query
    try {
      const orderCells = await indexer.collectCells({
        type: {
          code_hash: type_code_hash,
          hash_type: type_hash_type,
          args: type_args,
        },
        lock: {
          code_hash: orderLockCodeHash,
          hash_type: 'data',
          args: public_key_hash,
        }
      })
      const formattedOrderCells = orderCells.map(orderCell => {
        const parsedOrderData = parseOrderData(orderCell.data);
        return {
          sudt_amount: parsedOrderData.sUDTAmount.toString(),
          order_amount: parsedOrderData.orderAmount.toString(),
          price: parsedOrderData.price.toString(),
          is_bid: parsedOrderData.isBid,
          raw_data: orderCell
        }
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
    } = req.query

    const orderCells = await indexer.collectCells({
      type: {
        code_hash: type_code_hash,
        hash_type: type_hash_type,
        args: type_args,
      },
      lock: {
        code_hash: orderLockCodeHash,
        hash_type: 'data',
        args: '0x',
      },
      argsLen: 'any',
    })

    if (!orderCells.length) {
      return res.status(404).send()
    }

    const formattedOrderCells = formatOrderCells(orderCells);

    const cell = formattedOrderCells
      .filter(cell => is_bid !== cell.isBid)
      .sort((a, b) => {
        if (is_bid) {
          return a.price - b.price
        }
        else {
          return b.price - a.price
        }
      })[0]

    res.status(200).json({price: cell.price})
  }
}

const formatOrderCells = (orderCells) => {
  const formattedOrderCells = orderCells.map(orderCell => {
    const parsedOrderData = parseOrderData(orderCell.data);
    return {
      sUDTAmount: parsedOrderData.sUDTAmount.toString(),
      orderAmount: parsedOrderData.orderAmount.toString(),
      price: parsedOrderData.price.toString(),
      isBid: parsedOrderData.isBid,
      rawData: orderCell
    }
  });
  return formattedOrderCells
}

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
