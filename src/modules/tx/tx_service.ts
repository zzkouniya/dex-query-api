import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { QueryOptions } from "@ckb-lumos/base";
import CKB from "@nervosnetwork/ckb-sdk-core";

import IndexerWrapper from "../indexer/indexer";
import { modules } from "../../ioc";
import CkbRequestModel from "../ckb_request_model";
import { CkbUtils } from "../../component";
import { indexer_config } from "../../config";

@injectable()
export default class TxService {
  private ckb: CKB;

  constructor(
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private indexer: IndexerWrapper
  ) {
    this.ckb = new CKB(indexer_config.nodeUrl);
  }

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
      const inputTxs = await this.ckb.rpc.createBatchRequest(requests).exec();
      
      const inputTxsMap = new Map();
      for (const tx of inputTxs) {
        inputTxsMap.set(tx.transaction.hash, tx);
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
            const cell = tx.transaction.outputs[inputIndex];
            if (
              cell &&
              this.isSameTypeScript(cell.lock, queryOptions.lock) &&
              this.isSameTypeScript(cell.type, queryOptions.type)
            ) {
              const data = tx.transaction.outputsData[inputIndex];
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
          console.log(inputSum, outputSum);
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
