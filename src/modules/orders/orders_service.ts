import { inject, injectable, LazyServiceIdentifer } from 'inversify'
import BigNumber from 'bignumber.js'
import { modules } from '../../ioc'
import { contracts } from '../../config'
import { CkbUtils, DexOrderCellFormat } from '../../component'
import { Cell, HashType, QueryOptions, Script } from '@ckb-lumos/base'
import { DexRepository } from '../repository/dex_repository'
import CkbRepository from '../repository/ckb_repository'
import { DexOrderChainFactory } from '../../model/orders/dex_order_chain_factory'
import { DexOrderChain } from '../../model/orders/dex_order_chain'

@injectable()
export default class OrdersService {
  constructor (
    @inject(new LazyServiceIdentifer(() => modules[CkbRepository.name]))
    private readonly repository: DexRepository
  ) {}

  async getOrders (
    type_code_hash: string,
    type_hash_type: string,
    type_args: string,
    decimal: string
  ): Promise<{
      bid_orders: Array<{receive: string, price: string}>
      ask_orders: Array<{receive: string, price: string}>
    }> {
    const lock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: '0x'
    }

    const type: Script = {
      code_hash: type_code_hash,
      hash_type: <HashType>type_hash_type,
      args: type_args
    }

    const orderTxs = await this.repository.collectTransactions({
      type: type,
      lock: {
        script: lock,
        argsLen: 'any'
      }
    })

    if (orderTxs.length === 0) {
      return {
        bid_orders: [],
        ask_orders: []
      }
    }

    const factory: DexOrderChainFactory = new DexOrderChainFactory()
    const orders = factory.getOrderChains(lock, type, orderTxs)
    const liveCells = orders.filter(x => x.getLiveCell() != null &&
     this.isMakerCellValid(x) && this.filterPlaceOrders(x, decimal))
      .map(x => {
        const c = x.getLiveCell()
        const cell: Cell = {
          cell_output: {
            lock: c.cell.lock,
            type: c.cell.type,
            capacity: c.cell.capacity
          },
          data: c.data,
          out_point: {
            tx_hash: c.tx.transaction.hash,
            index: c.index.toString()
          }
        }
        return cell
      })

    const orderCells = liveCells

    const dexOrdersBid = this.filterDexOrder(orderCells, true)
    const groupbyPriceBid: Map<string, DexOrderCellFormat[]> = this.groupbyPrice(dexOrdersBid, decimal)
    const bidOrderPriceKeys = Array.from(groupbyPriceBid.keys())
    const bid_orders =
    bidOrderPriceKeys.sort((c1, c2) => new BigNumber(c1).minus(new BigNumber(c2)).toNumber())
      .reverse()
      .slice(0, bidOrderPriceKeys.length > CkbUtils.getOrdersLimit() ? CkbUtils.getOrdersLimit() : bidOrderPriceKeys.length).map(x => {
        let order_amount = BigInt(0)
        const group = groupbyPriceBid.get(x)
        group.forEach(x => { order_amount += BigInt(x.orderAmount) })

        return {
          receive: order_amount.toString(),
          price: group[0].price.toString()
        }
      })

    const dexOrdersAsk = this.filterDexOrder(orderCells, false)
    const groupbyPriceAsk: Map<string, DexOrderCellFormat[]> = this.groupbyPrice(dexOrdersAsk, decimal)
    const askOrderPriceKeys = Array.from(groupbyPriceAsk.keys())
    const ask_orders =
    askOrderPriceKeys.sort((c1, c2) => new BigNumber(c1).minus(new BigNumber(c2)).toNumber())
      .slice(0, askOrderPriceKeys.length > CkbUtils.getOrdersLimit() ? CkbUtils.getOrdersLimit() : askOrderPriceKeys.length).map(x => {
        let order_amount = BigInt(0)
        const group = groupbyPriceAsk.get(x)
        group.forEach(x => { order_amount += BigInt(x.orderAmount) })

        return {
          receive: order_amount.toString(),
          price: group[0].price.toString()
        }
      }).reverse()

    return {
      bid_orders,
      ask_orders
    }
  }

  async getCurrentPrice (type: { code_hash: string, args: string, hash_type: HashType }): Promise<string> {
    const lock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: '0x'
    }
    const queryOption: QueryOptions = {
      type,
      lock: {
        script: lock,
        argsLen: 'any'
      },
      order: 'desc'
    }

    const orderTxs = await this.repository.collectTransactions(queryOption)

    if (orderTxs.length === 0) { return '' }
    const factory: DexOrderChainFactory = new DexOrderChainFactory()
    const orders = factory.getOrderChains(lock, type, orderTxs)

    const makerOrders = orders.filter(x => {
      const top = x.getTopOrder()
      if (!top.isCancel() && top.nextOrderCell) {
        return x
      }
    })

    if (makerOrders.length === 0) { return '' }
    const lastMakerOrders = makerOrders.filter(x => x.getLastOrder().tx.transaction.hash === makerOrders[0].getLastOrder().tx.transaction.hash)
    return lastMakerOrders.reduce(
      (total, order) => total.plus(new BigNumber(CkbUtils.parseOrderData(order.data).price)),
      new BigNumber(0)
    ).dividedBy(lastMakerOrders.length).toExponential()
  }

  isMakerCellValid (order: DexOrderChain): boolean {
    const FEE = BigInt(3)
    const FEE_RATIO = BigInt(1_000)
    // const PRICE_RATIO = BigInt(10 ** 20);

    const live = order.getLiveCell()
    try {
      if (live.data.length !== CkbUtils.getRequiredDataLength()) {
        return false
      }
      const output = live.cell
      const { price, orderAmount, sUDTAmount, isBid } = CkbUtils.parseOrderData(live.data)
      const freeCapacity = BigInt(parseInt(output.capacity, 16)) - CkbUtils.getOrderCellCapacitySize()
      const priceBigNumber = new BigNumber(price)
      if (isBid) {
        const costAmount = new BigNumber(orderAmount.toString()).multipliedBy(priceBigNumber)
        const fee = costAmount.multipliedBy(FEE.toString()).div((FEE + FEE_RATIO).toString())

        if (costAmount.plus(fee).gt(freeCapacity.toString())) {
          return false
        }
        if (costAmount.eq(0)) {
          return false
        }

        return true
      }

      if (!isBid) {
        const costAmount = new BigNumber(orderAmount.toString())
        const fee = costAmount.multipliedBy(FEE.toString()).div((FEE + FEE_RATIO).toString())
        const receive = new BigNumber(sUDTAmount.toString()).multipliedBy(priceBigNumber)
        if (costAmount.plus(fee).gt(receive)) {
          return false
        }
        if (new BigNumber(orderAmount.toString()).div(priceBigNumber).eq(0)) {
          return false
        }
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }

  filterDexOrder (dexOrders: Cell[], isBid: boolean): DexOrderCellFormat[] {
    const REQUIRED_DATA_LENGTH = CkbUtils.getRequiredDataLength()
    return CkbUtils.formatOrderCells(dexOrders
      .filter(o => o.data.length === REQUIRED_DATA_LENGTH))
      .filter(x => x.isBid === isBid)
      .filter(x => x.orderAmount !== '0')
  }

  filterPlaceOrders (order: DexOrderChain, decimal: string): boolean {
    const placeOrder = order.getTopOrder()
    const data = CkbUtils.parseOrderData(placeOrder.data)
    const price = new BigNumber(data.price).times(new BigNumber(10).pow(parseInt(decimal) - 8)).toString()
    const precision = price.lastIndexOf('.') !== -1 ? price.slice(price.lastIndexOf('.') + 1, price.length).length : 0
    if (order.isBid) {
      if (new BigNumber(placeOrder.cell.capacity).lt(100000000)) {
        return false
      }
      const receive = new BigNumber(data.orderAmount.toString()).times(new BigNumber(10).pow(parseInt(decimal)))
      // CKB => ETH
      if (placeOrder.cell.type.args === '0x8462b20277bcbaa30d821790b852fb322d55c2b12e750ea91ad7059bc98dda4b') {
        if (receive.lt(new BigNumber(0.0001))) {
          return false
        }

        if (precision > 2) {
          return false
        }

        // CKB => UDT
      } else {
        if (receive.lt(new BigNumber(0.001))) {
          return false
        }

        if (precision > 4) {
          return false
        }
      }
    } else {
      if (new BigNumber(data.orderAmount.toString()).lt(100000000)) {
        return false
      }

      const pay = new BigNumber(data.sUDTAmount.toString()).times(new BigNumber(10).pow(parseInt(decimal)))
      // ETH => CKB
      if (placeOrder.cell.type.args === '0x8462b20277bcbaa30d821790b852fb322d55c2b12e750ea91ad7059bc98dda4b') {
        if (pay.lt(new BigNumber(0.0001))) {
          return false
        }

        if (precision > 2) {
          return false
        }

        // UDT => CKB
      } else {
        if (pay.lt(new BigNumber(0.001))) {
          return false
        }
      }

      if (precision > 4) {
        return false
      }
    }

    return true
  }

  private groupbyPrice (dexOrders: DexOrderCellFormat[], decimal: string): Map<string, DexOrderCellFormat[]> {
    const groupbyPrice: Map<string, DexOrderCellFormat[]> = new Map()
    for (let i = 0; i < dexOrders.length; i++) {
      const dexOrder = dexOrders[i]
      const price = new BigNumber(dexOrder.price).times(new BigNumber(10).pow(parseInt(decimal) - 8))
      const key = CkbUtils.roundHalfUp(price.toString())
      let priceArr = groupbyPrice.get(key)
      if (!priceArr) {
        priceArr = []
        groupbyPrice.set(key, priceArr)
      }

      priceArr.push(dexOrder)
    }

    return groupbyPrice
  }
}
