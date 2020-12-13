import { Script, Output, TransactionWithStatus } from "@ckb-lumos/base";
import BigNumber from "bignumber.js";
import { CkbUtils, DexOrderData } from "../../component";

export class DexOrderChain {
  constructor(
      private _cell: Output,
      private _data: string,
      private _tx: TransactionWithStatus,
      private _index: number,
      private _nextOrderCell: DexOrderChain,
      private _live: boolean = false
  ) {}

  getOrderData(): DexOrderData {
    return CkbUtils.parseOrderData(this._data);
  }

  getTurnoverRate(): BigNumber{
    try {
      const turnoverRate = new BigNumber(this.getTradedAmount().toString()).multipliedBy(100).div(this.getTopOrder().getOrderData().orderAmount.toString()).div(100);
      return turnoverRate;
    } catch (error) {
      console.error(error);
      return new BigNumber(0);
    }
  }

  getLiveCell(): DexOrderChain{
    const cell = this.getLastOrder();
    if(cell.live) {
      return cell;
    }

    return null;

  }

  getTradedAmount(): bigint {
    const firstOrderAmount = this.getTopOrder().getOrderData().orderAmount;
    const lastOrderAmount = this.getLastOrder().getOrderData().orderAmount;
    return firstOrderAmount - lastOrderAmount;
  }

  getPaidAmount(): bigint {
    const firstCell = this.getTopOrder();
    const lastCell = this.getLastOrder();
    if(this.isBid()) {
      return BigInt(firstCell.cell.capacity) - BigInt(lastCell.cell.capacity);
    } else {
      return firstCell.getOrderData().sUDTAmount - lastCell.getOrderData().sUDTAmount;
    }
  }

  getTopOrder(): DexOrderChain {
    return this;
  }

  getLastOrder(): DexOrderChain {
    const orders = this.getOrders();
    return orders[orders.length - 1];
  }

  isBid(): boolean {
    return this.getOrderData().isBid;
  }
  
  equals(orderCell: DexOrderChain): boolean {
    return this.equalScript(this._cell.lock, orderCell._cell.lock) && this.equalScript(this._cell.type, orderCell._cell.type);
  }
  
  getOrders(): DexOrderChain[] {
    const txs = [];
    txs.push(this);
  
    let cell = this._nextOrderCell;  
    while(cell != null) {
      txs.push(cell);
      cell = cell.nextOrderCell;
    }
    return txs;
  }
  
  get cell(): Output {
    return this._cell;
  }

  get data(): string {
    return this._data;
  }
  
  get tx(): TransactionWithStatus {
    return this._tx;
  }
  
  get index(): number {
    return this._index;
  }
  
  get nextOrderCell(): DexOrderChain {
    return this._nextOrderCell;
  }
  
  set nextOrderCell(nextOrderCell: DexOrderChain) {
    this._nextOrderCell = nextOrderCell;
  }

  get live(): boolean {
    return this._live;
  }
  
  set live(live: boolean) {
    this._live = live;
  }
  
  private equalScript(script1: Script, script2: Script): boolean {
    if (!script1 && script2) {
      return false;
    }
  
    if(script1 && !script2) {
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
}