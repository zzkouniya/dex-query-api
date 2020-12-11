import { Cell, QueryOptions, Script, TransactionWithStatus } from '@ckb-lumos/base';
import { TransactionCollector } from '@ckb-lumos/indexer';
import { DexOrderData } from '../../component'

export interface IndexerService {
    
    collectCells(queryOptions: QueryOptions): Promise<Array<Cell>>;

    collectTransactions(queryOptions: QueryOptions): Promise<Array<TransactionWithStatus>>;

    getCollectTransactions(queryOptions: QueryOptions): TransactionCollector;

    getLastMatchOrders(
        type: Script
    ): Promise<Record<'ask_orders' | 'bid_orders', Array<DexOrderData> | null>>

    tip(): Promise<number>;
   
}