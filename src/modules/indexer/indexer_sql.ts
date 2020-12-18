import { Cell, QueryOptions, TransactionWithStatus, Transaction } from "@ckb-lumos/base";

import { injectable } from "inversify";
import { contracts, indexer_config } from "../../config";
import { CkbUtils, DexOrderData } from '../../component';
import { IndexerService } from './indexer_service';
import knex from "knex";
import { CellCollector, Indexer } from '@ckb-lumos/sql-indexer';
import { Reader } from "ckb-js-toolkit";
import { TransactionCollector } from "../../component/transactio_collector";


@injectable()
export default class SqlIndexerWrapper implements IndexerService {
  private indexer: Indexer;
  private knex: knex;

  constructor() {

    const knex2 = knex({
      client: 'mysql',
      connection: {
        host : '127.0.0.1',
        user : 'root',
        password : '123456',
        database : 'ckb'
      },
      // debug: true
    })
              
    knex2.migrate.up();   
    this.knex = knex2;
      
    this.indexer = new Indexer(indexer_config.nodeUrl, this.knex);
    setTimeout(() => {
      this.indexer.startForever();
  
      setInterval(async () => {
        const { block_number } = await this.indexer.tip();
        console.log("indexer tip block", parseInt(block_number, 16));
      }, 5000);
    }, 10000);
  }


  async getTx(hash: string): Promise<void> {
    const query = this.knex("transaction_digests").where("transaction_digests.tx_hash", "=", Buffer.from(new Reader(hash).toArrayBuffer()))
    const items = await query.select();
    console.log(items);
    
  }

  async test(queryOptons: QueryOptions): Promise<void> {
    const collector: TransactionCollector = new TransactionCollector(this.knex, queryOptons, this.indexer['rpc']);
    
    const txs = [];
    for await (const tx of collector.collect()) txs.push(tx);

    console.log(txs.length);
    
      
  }
  
  tip(): Promise<number> {
    throw new Error("Method not implemented.");
  }

  async collectCells(queryOptons: QueryOptions): Promise<Array<Cell>> {  
      
    const cellCollector = new CellCollector(this.knex, queryOptons);

    const cells = [];
    for await (const cell of cellCollector.collect()) cells.push(cell);
    return cells;
  }

  async collectTransactions(queryOptions: QueryOptions): Promise<Array<TransactionWithStatus>> {

    const transactionCollector = new TransactionCollector(
      this.knex,
      queryOptions,
      this.indexer['rpc']
    );
    

    const txs = [];
    for await (const tx of transactionCollector.collect()) {
      txs.push(tx);
    } 

    return txs;
  }

  async getLastMatchOrders(
    type: { code_hash: string, args: string, hash_type: 'data' | 'type' }
  ): Promise<Record<'ask_orders' | 'bid_orders', Array<DexOrderData>> | null> {
    
    const transactionCollector = new TransactionCollector(
      this.knex,
      {
        type,
        lock: {
          script: {
            code_hash: contracts.orderLock.codeHash,
            hash_type: contracts.orderLock.hashType,
            args: "0x",
          },
          argsLen: 'any'
        },
        order: "desc",
      },
      this.indexer['rpc']
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const { tx_status, transaction } of transactionCollector.collect() as any) {
      if (tx_status.status === 'committed') {
        const bid_orders: Array<DexOrderData> = [];
        const ask_orders: Array<DexOrderData> = [];
        const { outputs, outputs_data } = transaction as Transaction;
        await Promise.all(outputs.map(async (output, idx) => {
          if (CkbUtils.isOrder(type, output)) {
            try {
              const order = CkbUtils.parseOrderData(outputs_data[idx]);
              if (order.orderAmount === 0n) {
              // TODO: use order history to verify if the order is a REAL ONE
              // const historyService = container.get<OrdersHistoryService>(modules[OrdersHistoryService.name])
              // const history = await historyService.getOrderHistory(
              //   output.type.code_hash,
              //   output.type.hash_type,
              //   output.type.args,
              //   output.lock.args);
                (order.isBid ? bid_orders : ask_orders).push(order);
              }
            } catch {
            // ignore
            }
          }
        }))
        if (ask_orders.length && bid_orders.length) {
          return { ask_orders, bid_orders };
        }
      }
    }
    return null;
  }

}

