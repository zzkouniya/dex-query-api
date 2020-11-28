import { Cell, QueryOptions, TransactionWithStatus } from '@ckb-lumos/base';

export interface IndexerService {
    collectCells(queryOptions: QueryOptions): Promise<Array<Cell>>;
    collectTransactions(queryOptions: QueryOptions): Promise<Array<TransactionWithStatus>>
}