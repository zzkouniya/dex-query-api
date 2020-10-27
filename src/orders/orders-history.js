const indexer = require('../indexer');
const formatter = require('../commons/formatter');

class OrdersHistoryService {
  constructor(orderLock, sudtType) {
    this.orderLock = orderLock;
    this.sudtType = sudtType;

    this.txsByInputOutPoint = new Map();
    this.usedInputOutPoints = new Set();
  }

  async calculateOrdersHistory() {
    const txsWithStatus = await indexer.collectTransactions({
      type: this.sudtType,
      lock: this.orderLock,
    });

    for (const txWithStatus of txsWithStatus) {
      const { transaction } = txWithStatus;
      const { inputs } = transaction;

      for (const input of inputs) {
        const { tx_hash, index } = input.previous_output;
        const inputOutPoint = this.formatInputOutPoint(tx_hash, parseInt(index, 16));
        if (!this.txsByInputOutPoint.has(inputOutPoint)) {
          this.txsByInputOutPoint.set(inputOutPoint, transaction);
        }
      }
    }

    const ordersHistory = [];
    for (const txWithStatus of txsWithStatus) {
      const { transaction } = txWithStatus;
      const { hash, outputs, outputs_data } = transaction;

      const groupedOrderCells = this.groupOrderCells(outputs, this.orderLock, this.sudtType);
      for (let groupedIndex = 0; groupedIndex < groupedOrderCells.length; groupedIndex++) {
        const groupedOrderCell = groupedOrderCells[groupedIndex];
        const [originalIndex, output] = groupedOrderCell;

        if (!this.isOrderCell(output, this.orderLock, this.sudtType)) {
          continue;
        }

        const inputOutPoint = this.formatInputOutPoint(hash, originalIndex);
        if (this.usedInputOutPoints.has(inputOutPoint)) {
          continue;
        }

        const data = outputs_data[originalIndex];
        output.data = data;
        output.outpoint = {
          txHash: hash,
          index: originalIndex,
        };
        const lastOrderCell = this.getLastOrderCell(hash, originalIndex, groupedOrderCell);
        ordersHistory.push({
          firstOrderCell: output,
          lastOrderCell,
        });
      }
    }

    for (const orderHistory of ordersHistory) {
      const { firstOrderCell, lastOrderCell } = orderHistory;
      const firstOrderCellData = formatter.parseOrderData(firstOrderCell.data);
      const lastOrderCellData = formatter.parseOrderData(lastOrderCell.data);

      const tradedAmount = firstOrderCellData.orderAmount - lastOrderCellData.orderAmount;
      const turnoverRate = Number((tradedAmount * 100n) / firstOrderCellData.orderAmount) / 100;

      let paidAmount;
      if (firstOrderCellData.isBid) {
        paidAmount = BigInt(firstOrderCell.capacity) - BigInt(lastOrderCell.capacity);
      } else {
        paidAmount = firstOrderCellData.sUDTAmount - lastOrderCellData.sUDTAmount;
      }

      orderHistory.paidAmount = paidAmount;
      orderHistory.tradedAmount = tradedAmount;
      orderHistory.turnoverRate = turnoverRate;
      orderHistory.orderAmount = firstOrderCellData.orderAmount;
      orderHistory.isBid = firstOrderCellData.isBid;
      orderHistory.price = firstOrderCellData.price;

      const outpoint = orderHistory.lastOrderCell.outpoint;
      const inputOutPoint = this.formatInputOutPoint(outpoint.txHash, outpoint.index);
      const isLive = !!this.txsByInputOutPoint.get(inputOutPoint);

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

      orderHistory.claimable = claimable;
      orderHistory.status = status;
    }

    return ordersHistory;
  }

  groupOrderCells(cells, orderLock, sudtType) {
    const groupedCells = [];
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (this.isOrderCell(cell, orderLock, sudtType)) {
        groupedCells.push([i, cell]);
      }
    }
    return groupedCells;
  }

  isOrderCell(cell, orderLock, sudtType) {
    const { lock, type } = cell;

    if (
      !this.equalsScript(lock, orderLock)
      || !this.equalsScript(type, sudtType)
    ) {
      return false;
    }
    return true;
  }

  equalsScript(script1, script2) {
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
  }

  getLastOrderCell(hash, index, groupedOrderCell) {
    const inputOutPoint = this.formatInputOutPoint(hash, index);
    const nextTransaction = this.txsByInputOutPoint.get(inputOutPoint);

    if (!this.usedInputOutPoints.has(inputOutPoint)) {
      this.usedInputOutPoints.add(inputOutPoint);
    }

    const [groupedIndex, currentOutput] = groupedOrderCell;

    if (!nextTransaction) {
      return currentOutput;
    }

    const nextGroupedOrderCells = this.groupOrderCells(nextTransaction.outputs, this.orderLock, this.sudtType);

    const nextTxHash = nextTransaction.hash;
    const nextGroupedOrderCell = nextGroupedOrderCells[groupedIndex];

    if (!nextGroupedOrderCell) {
      return currentOutput;
    }

    const [nextOriginalIndex, nextOutput] = nextGroupedOrderCell;
    const { lock, type } = nextOutput;
    if (
      !this.equalsScript(lock, this.orderLock)
      || !this.equalsScript(type, this.sudtType)
    ) {
      return currentOutput;
    }

    nextOutput.data = nextTransaction.outputs_data[nextOriginalIndex];

    nextOutput.outpoint = {
      txHash: nextTxHash,
      index: nextOriginalIndex,
    };

    return this.getLastOrderCell(nextTxHash, nextOriginalIndex, nextGroupedOrderCell);
  }

  formatInputOutPoint(txHash, index) {
    return (`${txHash}0x${index.toString(16)}`);
  }
}

module.exports = OrdersHistoryService;
