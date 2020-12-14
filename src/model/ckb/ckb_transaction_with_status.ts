import { CkbUtils } from "../../component";
import CkbCellModel from './ckb_cell';
import CkbCellScriptModel from "./ckb_cell_script";
import CkbTransactionModel from "./ckb_transaction";
import CkbTransactionStatusModel from "./ckb_transaction_status";

export interface CkbTransactionWithStatusModel {
  transaction: CkbTransactionModel;
  txStatus: CkbTransactionStatusModel;
}

export default class CkbTransactionWithStatusModelWrapper {
  ckbTransactionWithStatus: CkbTransactionWithStatusModel;
  constructor(ckbTransactionWithStatus: CkbTransactionWithStatusModel) {
    this.ckbTransactionWithStatus = ckbTransactionWithStatus;
  }

  getSudtAmountByScript(
    inputTransactions: Array<CkbTransactionWithStatusModelWrapper>,
    lock: CkbCellScriptModel,
    type: CkbCellScriptModel
  ): bigint {

    let outputAmount = BigInt(0);
    for (let i = 0; i < this.ckbTransactionWithStatus.transaction.outputs.length; i++) {
      const cell = this.ckbTransactionWithStatus.transaction.outputs[i];
      if(!this.isSameTypeScript(lock, cell.lock) || !this.isSameTypeScript(type, cell.type)) {
        continue;
      }

      const amount = CkbUtils.parseAmountFromLeHex(this.ckbTransactionWithStatus.transaction.outputsData[i]);  

      outputAmount += amount;
    }

    const groupByInnputTransaction = this.groupByInnputTransaction(inputTransactions);

    let inputAmount = BigInt(0);
    for (let i = 0; i < this.ckbTransactionWithStatus.transaction.inputs.length; i++) {
      const inputTx = groupByInnputTransaction.get(this.ckbTransactionWithStatus.transaction.inputs[i].previousOutput.txHash);
      const index = parseInt(this.ckbTransactionWithStatus.transaction.inputs[i].previousOutput.index, 16);
      const cell = inputTx.ckbTransactionWithStatus.transaction.outputs[index];

      if(!this.isSameTypeScript(lock, cell.lock) || !this.isSameTypeScript(type, cell.type)) {
        continue;
      }

      const data = inputTx.ckbTransactionWithStatus.transaction.outputsData[index];

      const amount = CkbUtils.parseAmountFromLeHex(data);
      inputAmount += amount;
    }    

    return outputAmount - inputAmount;
  }

  getCkbAmountByScript(
    inputTransactions: Array<CkbTransactionWithStatusModelWrapper>,
    lock: CkbCellScriptModel
  ): bigint {
    const outputAmount = this.ckbTransactionWithStatus.transaction.outputs.filter(cell => this.isSameTypeScript(lock, cell.lock)).reduce(
      (total, cell) => total + BigInt(cell.capacity),
      BigInt(0)
    );

    const groupByInnputTransaction = this.groupByInnputTransaction(inputTransactions);

    const inputCells = this.ckbTransactionWithStatus.transaction.inputs.map(
      (input) => {
        const inputTx = groupByInnputTransaction.get(input.previousOutput.txHash);
        const index = parseInt(input.previousOutput.index, 16);
        return inputTx.ckbTransactionWithStatus.transaction.outputs[index];
      }
    );

    const inputAmount = inputCells.filter(cell => this.isSameTypeScript(lock, cell.lock))
      .reduce(
        (total, cell) => total + BigInt(cell.capacity),
        BigInt(0)
      );
 
    return outputAmount - inputAmount;
  }

  public getFee(
    inputTransactions: Array<CkbTransactionWithStatusModelWrapper>
  ): bigint {
    const outputAmount = this.ckbTransactionWithStatus.transaction.outputs.reduce(
      (total, cell) => total + BigInt(cell.capacity),
      BigInt(0)
    );

    const groupByInnputTransaction = this.groupByInnputTransaction(inputTransactions);

    const inputCells = this.ckbTransactionWithStatus.transaction.inputs.map(
      (input) => {
        const inputTx = groupByInnputTransaction.get(input.previousOutput.txHash);
        const index = parseInt(input.previousOutput.index, 16);
        return inputTx.ckbTransactionWithStatus.transaction.outputs[index];
      }
    );

    const inputAmount = inputCells.reduce(
      (total, cell) => total + BigInt(cell.capacity),
      BigInt(0)
    );

    return inputAmount - outputAmount;
  }


  getToAddress(inputTransactions: Array<CkbTransactionWithStatusModelWrapper>): string {

    const inputAddr = this.getAllInputAddress(inputTransactions);    
    const outputAddr = this.getAllOutputAddress();

    if(outputAddr.length === 1) {
      return outputAddr[0];
    }

    if(inputAddr.length === 1) {
      return outputAddr.find(x => x != inputAddr[0]);
    }

  }

  getFromAddress(inputTransactions: Array<CkbTransactionWithStatusModelWrapper>): string {

    const inputAddr = this.getAllInputAddress(inputTransactions);    
    const outputAddr = this.getAllOutputAddress();

    if(inputAddr.length === 1) {
      return inputAddr[0];
    }

    if(outputAddr.length === 1) {
      return inputAddr.find(x => x != outputAddr[0]);
    }


  }



  private groupByInnputTransaction(
    inputTransactions: Array<CkbTransactionWithStatusModelWrapper>
  ): Map<string, CkbTransactionWithStatusModelWrapper> {
    const groupByInnputTransaction: Map<
      string,
      CkbTransactionWithStatusModelWrapper
    > = new Map<string, CkbTransactionWithStatusModelWrapper>();

    for (const tx of inputTransactions) {
      groupByInnputTransaction.set(
        tx.ckbTransactionWithStatus.transaction.hash,
        tx
      );
    }

    return groupByInnputTransaction;
  }

  private isSameTypeScript(script1, script2): boolean {
    if (!script1 || !script2) {
      return false;
    }
    const s1 = this.normalizeScript(script1);
    const s2 = this.normalizeScript(script2);
    return (
      s1.code_hash === s2.code_hash &&
      s1.hash_type === s2.hash_type &&
      s1.args === s2.args
    );
  }

  private normalizeScript(script) {
    return {
      code_hash: script.code_hash || script.codeHash,
      hash_type: script.hash_type || script.hashType,
      args: script.args,
    };
  }

  private getAllInputAddress(inputTransactions: Array<CkbTransactionWithStatusModelWrapper>): string[] {

    const inputCellsInfo: Map<string, CkbCellModel> = new Map()
  
    inputTransactions.forEach(x => {
      x.ckbTransactionWithStatus.transaction.outputs.forEach((value, index) => {
        inputCellsInfo.set(x.ckbTransactionWithStatus.transaction.hash.concat(":").concat(index.toString()), value)
      })
    })

    const addr = new Set();
    const inputAddress = [] 
    this.ckbTransactionWithStatus.transaction.inputs.forEach(x => {
      const index = x.previousOutput.txHash.concat(":").concat(parseInt(x.previousOutput.index, 16).toString());      
      const cell = inputCellsInfo.get(index);
      
      if(!addr.has(cell.lock.args)) {
        addr.add(cell.lock.args);
        inputAddress.push(cell.lock.args);
      }
    })

    return inputAddress;
  }

  private getAllOutputAddress(): string[] {

    const addr = new Set();
    const outputAddress = [] 
    this.ckbTransactionWithStatus.transaction.outputs.forEach(x => {
      if(!addr.has(x.lock.args)) {
        addr.add(x.lock.args);
        outputAddress.push(x.lock.args);
      } 
    });

    return outputAddress;
    
  }

}