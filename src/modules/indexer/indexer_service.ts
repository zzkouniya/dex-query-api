import { Cell, QueryOptions, TransactionWithStatus } from '@ckb-lumos/base'

export interface IndexerService {

  collectCells: (queryOptions: QueryOptions) => Promise<Cell[]>

  collectTransactions: (queryOptions: QueryOptions) => Promise<TransactionWithStatus[]>

  tip: () => Promise<number>

}
