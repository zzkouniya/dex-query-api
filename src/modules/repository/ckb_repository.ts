import { DexRepository } from './dex_repository'
import { Cell, QueryOptions, TransactionWithStatus, Script } from '@ckb-lumos/base'
import { inject, injectable, LazyServiceIdentifer } from 'inversify'
import { modules } from '../../ioc'
import IndexerWrapper from '../indexer/indexer'
import { IndexerService } from '../indexer/indexer_service'
import CkbService, { ckb_methons } from '../ckb/ckb_service'
import { DexOrderData } from '../../component'

import CkbTransactionWithStatusModelWrapper from '../../model/ckb/ckb_transaction_with_status'

@injectable()
export default class CkbRepository implements DexRepository {
  constructor (
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private readonly indexer: IndexerService,
    @inject(new LazyServiceIdentifer(() => modules[CkbService.name]))
    private readonly ckbService: CkbService
  ) {}

  async tip (): Promise<number> {
    const block_number = await this.indexer.tip()
    return block_number
  }

  async collectCells (queryOptions: QueryOptions): Promise<Cell[]> {
    return await this.indexer.collectCells(queryOptions)
  }

  async collectTransactions (queryOptions: QueryOptions): Promise<TransactionWithStatus[]> {
    return await this.indexer.collectTransactions(queryOptions)
  }

  async getLastMatchOrders (type: Script): Promise<Record<'ask_orders' | 'bid_orders', DexOrderData[] | null>> {
    return await this.indexer.getLastMatchOrders(type)
  }

  async getTransactions (ckbReqParams: Array<[method: ckb_methons, ...rest: []]>): Promise<CkbTransactionWithStatusModelWrapper[]> {
    return await this.ckbService.getTransactions(ckbReqParams)
  }

  async getTransactionByHash (txHash: string): Promise<CkbTransactionWithStatusModelWrapper> {
    return await this.ckbService.getTransactionByHash(txHash)
  }

  async getblockNumberByBlockHash (blockHash: string): Promise<number> {
    return await this.ckbService.getblockNumberByBlockHash(blockHash)
  }

  async getBlockTimestampByHash (blockHash: string): Promise<string> {
    return await this.ckbService.getBlockTimestampByHash(blockHash)
  }
}
