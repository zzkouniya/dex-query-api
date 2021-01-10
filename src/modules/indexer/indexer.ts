import { Cell, QueryOptions, TransactionWithStatus, Transaction, Script } from '@ckb-lumos/base'
import TransactionManager from '@ckb-lumos/transaction-manager'
import {
  CellCollector,
  Indexer,
  TransactionCollector
} from '@ckb-lumos/indexer'
import { inject, injectable, LazyServiceIdentifer } from 'inversify'
import { indexer_config, contracts } from '../../config'
import { DexOrderData, CkbUtils } from '../../component'
import { IndexerService } from './indexer_service'
import CkbService from '../ckb/ckb_service'
import { modules } from '../../ioc'

@injectable()
export default class IndexerWrapper implements IndexerService {
  private readonly indexer: Indexer
  private readonly txManager: TransactionManager

  constructor (
    @inject(new LazyServiceIdentifer(() => modules[CkbService.name]))
    private readonly ckbService: CkbService
  ) {
    this.indexer = new Indexer(indexer_config.nodeUrl, indexer_config.dataPath)
    // this.txManager = new TransactionManager(this.indexer)
    this.indexer.start()

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setInterval(async () => {
      const { block_number } = await this.indexer.tip()
      console.log('indexer tip block', parseInt(block_number, 16))
    }, 5000)
  }

  async tip (): Promise<number> {
    const { block_number } = await this.indexer.tip()
    return parseInt(block_number, 16)
  }

  async collectCells (queryOptions: QueryOptions): Promise<Cell[]> {
    const cellCollector = new CellCollector(this.indexer, queryOptions)

    const cells = []
    for await (const cell of cellCollector.collect()) cells.push(cell)

    return cells
  }

  async collectTransactions (queryOptions: QueryOptions): Promise<TransactionWithStatus[]> {
    const transactionCollector = new TransactionCollector(
      this.indexer,
      queryOptions
    )

    const txs = []
    for await (const tx of transactionCollector.collect()) txs.push(tx)

    return txs
  }

  async getLastMatchOrders (
    type: Script
  ): Promise<Record<'ask_orders' | 'bid_orders', DexOrderData[]> | null> {
    const transactionCollector = new TransactionCollector(
      this.indexer,
      {
        type,
        lock: {
          script: {
            code_hash: contracts.orderLock.codeHash,
            hash_type: contracts.orderLock.hashType,
            args: '0x'
          },
          argsLen: 'any'
        },
        order: 'desc'
      }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const { tx_status, transaction } of transactionCollector.collect() as any) {
      if (tx_status.status === 'committed') {
        const bid_orders: DexOrderData[] = []
        const ask_orders: DexOrderData[] = []
        const { inputs, outputs, outputs_data } = transaction as Transaction

        if (!outputs.find(x => CkbUtils.isOrder(type, x))) {
          continue
        }

        const requests = []
        for (const input of inputs) {
          requests.push(['getTransaction', input.previous_output.tx_hash])
        }
        const inputTxs = await this.ckbService.getTransactions(requests)

        if (!inputTxs.find(x => x.ckbTransactionWithStatus.transaction.outputsData.find(y => y.length === CkbUtils.getRequiredDataLength()))) {
          continue
        }

        for (const data of outputs_data) {
          if (data.length !== CkbUtils.getRequiredDataLength()) {
            continue
          }
          const orderCell = CkbUtils.parseOrderData(data);
          (orderCell.isBid ? bid_orders : ask_orders).push(orderCell)
        }

        if (ask_orders.length && bid_orders.length) {
          return { ask_orders, bid_orders }
        }
      }
    }
    return null
  }
}
