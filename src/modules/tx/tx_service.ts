import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { QueryOptions } from "@ckb-lumos/base";
import CKB from "@nervosnetwork/ckb-sdk-core";

import IndexerWrapper from "../indexer/indexer";
import { modules } from "../../ioc";
import CkbRequestModel from "../../model/req/ckb_request_model";
import { CkbUtils } from "../../component";

import CkbService from "../ckb/ckb_service";
import CkbCellScriptModel from "../../model/ckb/ckb_cell_script";
import TransactionDetailsModel from './transaction_details_model';
import CkbTransactionWithStatusModelWrapper from '../../model/ckb/ckb_transaction_with_status';

@injectable()
export default class TxService {

  constructor(
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private indexer: IndexerWrapper,
    @inject(new LazyServiceIdentifer(() => modules[CkbService.name]))
    private ckbService: CkbService
  ) {}

  async getSudtTransactions(reqParam: CkbRequestModel): Promise<any> {
    const queryOptions: QueryOptions = {};

    if (reqParam.isValidLockScript()) {
      queryOptions.lock = reqParam.lockScript();
    }

    if (reqParam.isValidTypeScript()) {
      queryOptions.type = reqParam.typeScript();
    }

    const txs = [];

    try {
      const txsWithStatus = await this.indexer.collectTransactions(
        queryOptions
      );
      
      const requests = [];
      for (const tx of txsWithStatus) {
        const { inputs } = tx.transaction;
        for (const input of inputs) {
          requests.push(["getTransaction", input.previous_output.tx_hash]);
        }
      }
      const inputTxs = await this.ckbService.getTransactions(requests);
      
      const inputTxsMap: Map<string, CkbTransactionWithStatusModelWrapper> = new Map();
      for (const tx of inputTxs) {
        inputTxsMap.set(tx.ckbTransactionWithStatus.transaction.hash, tx);
      }

      for (let i = 0; i < txsWithStatus.length; i++) {
        const txWithStatus = txsWithStatus[i];
        const {
          inputs,
          outputs,
          outputs_data,
          hash,
        } = txWithStatus.transaction;

        let outputSum = BigInt(0);
        let inputSum = BigInt(0);

        for (const input of inputs) {
          const { index, tx_hash } = input.previous_output;
          const inputIndex = parseInt(index, 16);
          const tx = inputTxsMap.get(tx_hash);
          if (tx) {
            const cell = tx.ckbTransactionWithStatus.transaction.outputs[inputIndex];
            if (
              cell &&
              this.isSameTypeScript(cell.lock, queryOptions.lock) &&
              this.isSameTypeScript(cell.type, queryOptions.type)
            ) {
              const data = tx.ckbTransactionWithStatus.transaction.outputsData[inputIndex];
              const amount = CkbUtils.parseAmountFromLeHex(data);
              inputSum += amount;
            }
          }
        }

        for (let j = 0; j < outputs.length; j++) {
          const output = outputs[j];
          if (
            this.isSameTypeScript(output.type, queryOptions.type) &&
            this.isSameTypeScript(output.lock, queryOptions.lock)
          ) {
            const amount = CkbUtils.parseAmountFromLeHex(outputs_data[j]);        
            outputSum += amount;
          }
        }

        const income = outputSum - inputSum;        

        if (income.toString() !== "0") {
          // console.log(inputSum, outputSum);
          txs.push({
            hash,
            income: income.toString(),
          });
        }
      }

      return txs;
    } catch (err) {
      console.error(err);
    }
  }

  async getTransactionDetailsByHash(
    reqParam: CkbRequestModel,
    txHash: string
  ): Promise<TransactionDetailsModel> {

    try {

      const tx = await this.ckbService.getTransactionByHash(txHash);
      if (!tx) {
        throw { error: "The transaction does not exist!" };
      }

      const requests = [];
      const { inputs } = tx.ckbTransactionWithStatus.transaction;
      for (const input of inputs) {          
        requests.push(["getTransaction", input.previousOutput.txHash]);
      }

      const inputTransactions = await this.ckbService.getTransactions(requests);
    
      const fee = tx.getFee(inputTransactions);
      let amount: bigint;
      const lock: CkbCellScriptModel = {
        codeHash: reqParam.lock_code_hash,
        hashType: reqParam.lock_hash_type,
        args: reqParam.lock_args
      }

      const type: CkbCellScriptModel = {
        codeHash: reqParam.type_code_hash,
        hashType: reqParam.type_hash_type,
        args: reqParam.type_args
      }
      if(reqParam.isValidTypeScript()) {
        amount = tx.getSudtAmountByScript(inputTransactions, lock, type);
      } else {
        amount = tx.getCkbAmountByScript(inputTransactions, lock);
      }

      const blockNumber = await this.ckbService.getblockNumberByBlockHash(tx.ckbTransactionWithStatus.txStatus.blockHash);

      const from = tx.getFromAddress(lock);
      const to = tx.getToAddress(lock);

      const details: TransactionDetailsModel = {
        status: tx.ckbTransactionWithStatus.txStatus.status,
        transaction_fee: fee.toString(),
        amount: amount.toString(),
        to: to,
        from: from,
        hash: txHash,
        block_no: blockNumber
      }

      return details

    } catch (err) {
      console.error(err);
    }
  }

  isSameTypeScript(script1, script2) {
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

  normalizeScript(script) {
    return {
      code_hash: script.code_hash || script.codeHash,
      hash_type: script.hash_type || script.hashType,
      args: script.args,
    };
  }
}
