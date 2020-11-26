import { Script } from "@ckb-lumos/base";
import BigNumber from 'bignumber.js';

import {
  CkbUtils,
} from "../../component";
import { IndexerService } from '../indexer/indexer_service';


export default class OrdersHistoryCalculate {

  private orderLock;
  private sudtType;
  private indexer: IndexerService;

  private txsByInputOutPoint;
  private usedInputOutPoints;
  private orderCellsInputOutPoints;

  constructor(
    indexer: IndexerService,
    orderLock: Script,
    sudtType: Script
  ) {
    this.orderLock = orderLock;
    this.sudtType = sudtType;
    this.indexer = indexer;

    this.txsByInputOutPoint = new Map();
    this.usedInputOutPoints = new Set();
    this.orderCellsInputOutPoints = new Set();
  }

  async calculateOrdersHistory() {
    const txsWithStatus = await this.indexer.collectTransactions({
      type: this.sudtType,
      lock: this.orderLock,
    });

    for (let i = 0; i < txsWithStatus.length; i++) {
      const txWithStatus = txsWithStatus[i];
      const { transaction } = txWithStatus;
      const { hash, inputs, outputs } = transaction;

      for (const input of inputs) {
        const { tx_hash, index } = input.previous_output;
        const inputOutPoint = this.formatInputOutPoint(
          tx_hash,
          parseInt(index, 16)
        );
        if (!this.txsByInputOutPoint.has(inputOutPoint)) {
          this.txsByInputOutPoint.set(inputOutPoint, transaction);
        }
      }
      for (let j = 0; j < outputs.length; j++) {
        const output = outputs[j];
        if (this.isOrderCell(output, this.orderLock, this.sudtType)) {
          const inputOutPoint = this.formatInputOutPoint(hash, j);
          this.orderCellsInputOutPoints.add(inputOutPoint);
        }
      }
    }

    const ordersHistory = [];
    for (const txWithStatus of txsWithStatus) {
      const { transaction } = txWithStatus;
      const { hash, outputs, outputs_data } = transaction;

      const groupedOrderCells = this.groupOrderCells(
        outputs,
        this.orderLock,
        this.sudtType
      );
      for (
        let groupedIndex = 0;
        groupedIndex < groupedOrderCells.length;
        groupedIndex++
      ) {
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
        const lastOrderCell = this.getLastOrderCell(
          hash,
          originalIndex,
          groupedOrderCell
        );
        ordersHistory.push({
          firstOrderCell: output,
          lastOrderCell,
          block_hash: txWithStatus.tx_status.block_hash
        });
      }
    }

    for (const orderHistory of ordersHistory) {
      const { firstOrderCell, lastOrderCell } = orderHistory;
      const firstOrderCellData = CkbUtils.parseOrderData(firstOrderCell.data);
      const lastOrderCellData = CkbUtils.parseOrderData(lastOrderCell.data);

      const tradedAmount =
        firstOrderCellData.orderAmount - lastOrderCellData.orderAmount;
      let turnoverRate;
      try {
        turnoverRate = Number((tradedAmount * 100n) / firstOrderCellData.orderAmount) / 100;
      } catch (error) {
        console.error("zero order amount for the  first order cell");
        turnoverRate = 0;
      }

      let paidAmount;
      if (firstOrderCellData.isBid) {
        paidAmount =
          BigInt(firstOrderCell.capacity) - BigInt(lastOrderCell.capacity);
      } else {
        paidAmount =
          firstOrderCellData.sUDTAmount - lastOrderCellData.sUDTAmount;
      }
      
      let average_price = BigInt(0)
      if(tradedAmount !== average_price) {
        const big_number_average_price = new BigNumber(tradedAmount.toString())
          .div(new BigNumber(paidAmount.toString()))
          .multipliedBy(new BigNumber(10000000000));

        average_price = BigInt(parseInt(big_number_average_price.toFixed(0)));
      }   
      orderHistory.average_price = average_price;
      orderHistory.paidAmount = paidAmount;
      orderHistory.tradedAmount = tradedAmount;
      orderHistory.turnoverRate = turnoverRate;
      orderHistory.orderAmount = firstOrderCellData.orderAmount;
      orderHistory.isBid = firstOrderCellData.isBid;
      orderHistory.price = firstOrderCellData.price;

      const outpoint = orderHistory.lastOrderCell.outpoint;
      const inputOutPoint = this.formatInputOutPoint(
        outpoint.txHash,
        outpoint.index
      );
      const isLive = !this.txsByInputOutPoint.get(inputOutPoint);

      let status;
      if (orderHistory.turnoverRate === 1) {
        status = "completed";
        if (!isLive) {
          status = "claimed";
        }
      } else {
        status = "opening";
        if (!isLive) {
          status = "aborted";
        }
      }

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
      !this.equalsScript(lock, orderLock) ||
      !this.equalsScript(type, sudtType)
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
      script1.args !== script2.args ||
      script1.code_hash !== script2.code_hash ||
      script1.hash_type !== script2.hash_type
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

    const [, currentOutput] = groupedOrderCell;

    if (!nextTransaction) {
      return currentOutput;
    }

    const inputOutpointList = [];
    for (let i = 0; i < nextTransaction.inputs.length; i++) {
      const input = nextTransaction.inputs[i];
      const { previous_output } = input;
      const outpointStr = this.formatInputOutPoint(
        previous_output.tx_hash,
        BigInt(previous_output.index)
      );
      if (this.orderCellsInputOutPoints.has(outpointStr)) {
        inputOutpointList.push(outpointStr);
      }
    }

    const nextGroupedOrderCellIndex = inputOutpointList.indexOf(inputOutPoint);

    const nextGroupedOrderCells = this.groupOrderCells(
      nextTransaction.outputs,
      this.orderLock,
      this.sudtType
    );
    const nextGroupedOrderCell =
      nextGroupedOrderCells[nextGroupedOrderCellIndex];
    const nextTxHash = nextTransaction.hash;

    currentOutput.nextTxHash = nextTxHash;

    if (!nextGroupedOrderCell) {
      return currentOutput;
    }

    const [nextOriginalIndex, nextOutput] = nextGroupedOrderCell;
    if (!this.isOrderCell(nextOutput, this.orderLock, this.sudtType)) {
      return currentOutput;
    }

    nextOutput.data = nextTransaction.outputs_data[nextOriginalIndex];

    nextOutput.outpoint = {
      txHash: nextTxHash,
      index: nextOriginalIndex,
    };

    return this.getLastOrderCell(
      nextTxHash,
      nextOriginalIndex,
      nextGroupedOrderCell
    );
  }

  formatInputOutPoint(txHash, index) {
    return `${txHash}0x${index.toString(16)}`;
  }
}
