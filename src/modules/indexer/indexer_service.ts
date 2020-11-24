import { Cell, QueryOptions, TransactionWithStatus } from '@ckb-lumos/base';

export interface IndexerService {
    collectCells(queryOptons: QueryOptions): Promise<Array<Cell>>;
    collectTransactions(queryOptions: QueryOptions): Promise<Array<TransactionWithStatus>>
}