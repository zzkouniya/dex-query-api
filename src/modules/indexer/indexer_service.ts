import { Cell, QueryOptions, Script, TransactionWithStatus } from '@ckb-lumos/base'
import { DexOrderData } from '../../component'

export interface IndexerService {

  collectCells: (queryOptions: QueryOptions) => Promise<Cell[]>

  collectTransactions: (queryOptions: QueryOptions) => Promise<TransactionWithStatus[]>

  getLastMatchOrders: (
    type: Script
  ) => Promise<Record<'ask_orders' | 'bid_orders', DexOrderData[] | null>>

  tip: () => Promise<number>

}
