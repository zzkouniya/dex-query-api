import { Cell, QueryOptions, TransactionWithStatus, Transaction } from "@ckb-lumos/base";

import { injectable } from "inversify";
import { indexer_config, contracts } from "../../config";
import { DexOrderData, CkbUtils } from '../../component';
import { IndexerService } from './indexer_service';
import knex from "knex";
import { CellCollector, Indexer } from '@ckb-lumos/sql-indexer';


@injectable()
export default class SqlIndexerWrapper implements IndexerService {
  private indexer: Indexer;
  private knex: knex;

  constructor() {

    const knex2 = knex({
      // postProcessResponse: (result, queryContext) => {
      // // TODO: add special case for raw results (depends on dialect)
      //   console.log(queryContext);
                  
      //   if (Array.isArray(result)) {
      //     console.log(result);
      //     return result
      //   } else {
      //     console.log(result);
      //     return result
      //   }
      // },
      client: 'mysql',
      connection: {
        host : '127.0.0.1',
        user : 'root',
        password : '123456',
        database : 'ckb'
      }
    })
              
    knex2.migrate.up();   
    this.knex = knex2;
      
    setTimeout(() => {
      this.indexer = new Indexer(indexer_config.nodeUrl, this.knex);
      this.indexer.startForever();
  
      setInterval(async () => {
        const { block_number } = await this.indexer.tip();
        console.log("indexer tip block", parseInt(block_number, 16));
      }, 5000);
    }, 10000);


    
  }

  async collectCells(queryOptons: QueryOptions): Promise<Array<Cell>> {  
      
    const cellCollector = new CellCollector(this.knex, queryOptons);

    const cells = [];
    for await (const cell of cellCollector.collect()) cells.push(cell);
    

    return cells;
  }

  async collectTransactions(queryOptions: QueryOptions): Promise<Array<TransactionWithStatus>> {

    // const transactionCollector = new TransactionCollector(
    //   this.knex,
    //   queryOptions
    // );

    // const txs = [];
    // for await (const tx of transactionCollector.collect()) txs.push(tx);

    // return txs;
    return null;
  }

  async getLastMatchOrders(
    type: { code_hash: string, args: string, hash_type: 'data' | 'type' }
  ): Promise<Record<'ask_orders' | 'bid_orders', Array<DexOrderData>> | null> {
    
    // const transactionCollector = new TransactionCollector(
    //   this.indexer,
    //   {
    //     type,
    //     lock: {
    //       script: {
    //         code_hash: contracts.orderLock.codeHash,
    //         hash_type: contracts.orderLock.hashType,
    //         args: "0x",
    //       },
    //       argsLen: 'any'
    //     },
    //     order: "desc",
    //   },
    // );

    // for await (const { tx_status, transaction } of transactionCollector.collect() as any) {
    //   if (tx_status.status === 'committed') {
    //     const bid_orders: Array<DexOrderData> = [];
    //     const ask_orders: Array<DexOrderData> = [];
    //     const { outputs, outputs_data } = transaction as Transaction;
    //     await Promise.all(outputs.map(async (output, idx) => {
    //       if (CkbUtils.isOrder(type, output)) {
    //         try {
    //           const order = CkbUtils.parseOrderData(outputs_data[idx]);
    //           if (order.orderAmount === 0n) {
    //           // TODO: use order history to verify if the order is a REAL ONE
    //           // const historyService = container.get<OrdersHistoryService>(modules[OrdersHistoryService.name])
    //           // const history = await historyService.getOrderHistory(
    //           //   output.type.code_hash,
    //           //   output.type.hash_type,
    //           //   output.type.args,
    //           //   output.lock.args);
    //             (order.isBid ? bid_orders : ask_orders).push(order);
    //           }
    //         } catch {
    //         // ignore
    //         }
    //       }
    //     }))
    //     if (ask_orders.length && bid_orders.length) {
    //       return { ask_orders, bid_orders };
    //     }
    //   }
    // }
    return null;
  }

}

