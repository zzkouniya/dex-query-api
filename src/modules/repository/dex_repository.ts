import CkbTransactionWithStatusModelWrapper from '../../model/ckb/ckb_transaction_with_status'
import { ckb_methons } from '../ckb/ckb_service'
import { IndexerService } from '../indexer/indexer_service'

export interface DexRepository extends IndexerService {

  getTransactions: (ckbReqParams: Array<[method: ckb_methons, ...rest: []]>) => Promise<CkbTransactionWithStatusModelWrapper[]>

  getTransactionByHash: (txHash: string) => Promise<CkbTransactionWithStatusModelWrapper>

  getblockNumberByBlockHash: (blockHash: string) => Promise<number>

  getBlockTimestampByHash: (blockHash: string) => Promise<string>

  getCellsOutPointFromTheTxPool: () => Promise<void>

}
