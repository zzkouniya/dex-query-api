import { inject, injectable, LazyServiceIdentifer } from 'inversify'
import { HashType, Script } from '@ckb-lumos/base'
import IndexerWrapper from '../indexer/indexer'

import { modules } from '../../ioc'
import { contracts } from '../../config'
import { IndexerService } from '../indexer/indexer_service'
import { OrdersHistoryModel } from './orders_history_model'
import { DexOrderChainFactory } from '../../model/orders/dex_order_chain_factory'

@injectable()
export default class OrdersHistoryService {
  constructor (
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private readonly indexer: IndexerService
  ) {}

  async getOrderHistory (
    type_code_hash: string,
    type_hash_type: string,
    type_args: string,
    order_lock_args: string
  ): Promise<OrdersHistoryModel[]> {
    const sudtType: Script = {
      code_hash: type_code_hash,
      hash_type: <HashType>type_hash_type,
      args: type_args
    }

    const orderLock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: order_lock_args
    }

    const txsWithStatus = await this.indexer.collectTransactions({
      type: sudtType,
      lock: orderLock
    })

    const factory: DexOrderChainFactory = new DexOrderChainFactory()
    const orders = factory.getOrderChains(orderLock, sudtType, txsWithStatus).filter(x => x.cell.lock.args === order_lock_args)

    const result = orders.map(x => {
      const orders = x.getOrders()
      const orderCells = x.getOrderStatus() !== 'opening' ? orders.splice(0, orders.length - 1) : orders

      const orderHistory: OrdersHistoryModel = {
        block_hash: x.tx.tx_status.block_hash,
        is_bid: x.isBid(),
        order_amount: x.getOrderData().orderAmount.toString(),
        traded_amount: x.getTradedAmount().toString(),
        turnover_rate: x.getTurnoverRate().toString(),
        paid_amount: x.getPaidAmount().toString(),
        price: x.getOrderData().price.toString(),
        status: x.getOrderStatus(),
        last_order_cell_outpoint: {
          tx_hash: x.getLastOrder().tx.transaction.hash,
          index: `0x${x.getLastOrder().index.toString(16)}`
        },
        order_cells: orderCells.map(orderCell => ({
          tx_hash: orderCell.tx.transaction.hash,
          index: `0x${orderCell.index.toString(16)}`
        }))
      }

      return orderHistory
    })

    return result
  }
}
