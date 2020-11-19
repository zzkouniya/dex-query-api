import { Cell, QueryOptions, TransactionWithStatus } from "@ckb-lumos/base";
import {
  Indexer,
  CellCollector,
  TransactionCollector,
} from "@ckb-lumos/indexer";
import { injectable } from "inversify";
import { indexer_config } from "../../config";

@injectable()
export default class IndexerWrapper {
  private indexer: Indexer;

  constructor() {
    this.indexer = new Indexer(indexer_config.nodeUrl, indexer_config.dataPath);
    this.indexer.startForever();

    setInterval(async () => {
      const { block_number } = await this.indexer.tip();
      console.log("indexer tip block", parseInt(block_number, 16));
    }, 5000);
  }

  async collectCells(queryOptons: QueryOptions): Promise<Array<Cell>> {  
    const cellCollector = new CellCollector(this.indexer, queryOptons);

    const cells = [];
    for await (const cell of cellCollector.collect()) cells.push(cell);

    return cells;
  }

  async collectTransactions(queryOptions: QueryOptions): Promise<Array<TransactionWithStatus>> {
    const transactionCollector = new TransactionCollector(
      this.indexer,
      queryOptions
    );

    const txs = [];
    for await (const tx of transactionCollector.collect()) txs.push(tx);

    return txs;
  }
}
