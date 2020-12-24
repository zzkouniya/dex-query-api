import { inject, injectable, LazyServiceIdentifer } from 'inversify'
import BigNumber from 'bignumber.js'

import { modules } from '../../ioc'
import { contracts } from '../../config'
import { CkbUtils, DexOrderCellFormat } from '../../component'
import BestPriceModel from './best_price_model'
import { Cell, HashType, Script } from '@ckb-lumos/base'
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
    const liveCells = orders.filter(x => x.getLiveCell() != null && Number(x.getTurnoverRate().toFixed(3, 1)) < 0.999 && this.isMakerCellValid(x))
      .map(x => {
        const c = x.getLiveCell()
        const cell: Cell = {
          cell_output: {
            lock: c.cell.lock,
            type: c.cell.type,
            capacity: c.cell.capacity
          },
          data: c.data
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
          price: group[0].price
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
        group.forEach(x => order_amount += BigInt(x.orderAmount))

        return {
          receive: order_amount.toString(),
          price: group[0].price
        }
      }).reverse()

    return {
      bid_orders,
      ask_orders
    }
  }

  async getCurrentPrice (type: { code_hash: string, args: string, hash_type: HashType }): Promise<string> {
    const orders = await this.repository.getLastMatchOrders(type)
    if (!orders) {
      return ''
    }
    const bid_price = new BigNumber(orders.bid_orders.sort((o1, o2) => Number(o1.price - o2.price))[0].price.toString())
    const ask_price = new BigNumber(orders.ask_orders.sort((o1, o2) => Number(o2.price - o1.price))[0].price.toString())
    return (bid_price.plus(ask_price)).dividedBy(2).toString(10)
  }

  async getBestPrice (
    type_code_hash: string,
    type_hash_type: string,
    type_args: string,
    is_bid: boolean
  ): Promise<BestPriceModel> {
    const orderCells = await this.repository.collectCells({
      type: {
        code_hash: type_code_hash,
        hash_type: <HashType>type_hash_type,
        args: type_args
      },
      lock: {
        code_hash: contracts.orderLock.codeHash,
        hash_type: contracts.orderLock.hashType,
        args: '0x'
      },
      argsLen: 'any'
    })

    if (!orderCells.length) {
      throw { error: 'cells is null' }
    }

    const formattedOrderCells = CkbUtils.formatOrderCells(orderCells)

    const sortedCells = formattedOrderCells
      .filter((cell) => is_bid !== cell.isBid && cell.orderAmount !== '0')
      .filter((cell) => !this.isInvalidOrderCell(cell))
      .sort((a, b) => {
        if (is_bid) {
          return new BigNumber(a.price)
            .minus(new BigNumber(b.price))
            .toNumber()
        }
        return new BigNumber(b.price).minus(a.price).toNumber()
      })

    const result: BestPriceModel = {
      price: sortedCells[0].price
    }

    return result
  }

  isMakerCellValid (order: DexOrderChain): boolean {
    const FEE = BigInt(3)
    const FEE_RATIO = BigInt(1_000)
    const PRICE_RATIO = BigInt(10 ** 20)

    const live = order.getLiveCell()
    try {
      if (live.data.length !== CkbUtils.getRequiredDataLength()) {
        return false
      }

      const output = live.cell
      const { price, orderAmount, sUDTAmount, isBid } = CkbUtils.parseOrderData(live.data)
      const freeCapacity = BigInt(parseInt(output.capacity, 16)) - CkbUtils.getOrderCellCapacitySize()

      if (isBid) {
        const costAmount = orderAmount * price
        if (costAmount + (costAmount * FEE) / (FEE + FEE_RATIO) > freeCapacity * PRICE_RATIO) {
          return false
        }
        if ((orderAmount * price) / PRICE_RATIO === BigInt(0)) {
          return false
        }

        return true
      }

      if (!isBid) {
        const costAmount = orderAmount * PRICE_RATIO
        if (costAmount + (costAmount * FEE) / (FEE + FEE_RATIO) > sUDTAmount * price) {
          return false
        }
        if ((orderAmount * PRICE_RATIO) / price === BigInt(0)) {
          return false
        }
        return true
      }
      return false
    } catch (err) {
      return false
    }
  }

  isInvalidOrderCell (cell: DexOrderCellFormat): boolean {
    const orderCellMinCapacity = new BigNumber(CkbUtils.getOrderCellCapacitySize().toString())
    const capacityBN = new BigNumber(cell.rawData.cell_output.capacity)
    const sudtAmountBN = new BigNumber(cell.sUDTAmount)
    const orderAmountBN = new BigNumber(cell.orderAmount)
    const priceBN = new BigNumber(cell.price).dividedBy(
      new BigNumber(10 ** 10)
    )
    const feeRatioBN = new BigNumber(0.003)
    try {
      if (cell.rawData.cell_output.lock.args.length !== 66) {
        return true
      }
      if (capacityBN.lt(orderCellMinCapacity)) {
        return true
      }
      if (cell.isBid) {
        const exchangeCapacity = orderAmountBN.multipliedBy(priceBN)
        const minimumCapacity = exchangeCapacity
          .plus(exchangeCapacity.multipliedBy(feeRatioBN))
          .plus(orderCellMinCapacity)
        const invalid = capacityBN.lt(minimumCapacity)
        return invalid
      }

      const exchangeSudtAmountBN = orderAmountBN.dividedBy(priceBN)
      const minimumSudtAmountBN = exchangeSudtAmountBN.multipliedBy(1.003)
      const invalid = sudtAmountBN.lt(minimumSudtAmountBN)
      return invalid
    } catch (error) {
      console.error(error)
      return true
    }
  }

  private filterDexOrder (dexOrders: Cell[], isBid: boolean): DexOrderCellFormat[] {
    const REQUIRED_DATA_LENGTH = CkbUtils.getRequiredDataLength()
    return CkbUtils.formatOrderCells(dexOrders
      .filter(o => o.data.length === REQUIRED_DATA_LENGTH))
      .filter(x => x.isBid === isBid)
      .filter(x => x.orderAmount !== '0')
  }

  private groupbyPrice (dexOrders: DexOrderCellFormat[], decimal: string): Map<string, DexOrderCellFormat[]> {
    const groupbyPrice: Map<string, DexOrderCellFormat[]> = new Map()
    for (let i = 0; i < dexOrders.length; i++) {
      const dexOrder = dexOrders[i]
      const key = this.getRoundHalfUpPrice(dexOrder.price, decimal)
      let priceArr = groupbyPrice.get(key)
      if (!priceArr) {
        priceArr = []
        groupbyPrice.set(key, priceArr)
      }

      priceArr.push(dexOrder)
    }

    return groupbyPrice
  }

  private getRoundHalfUpPrice (price: string, decimal: string) {
    const key = CkbUtils.roundHalfUp(CkbUtils.priceUnitConversion(price, decimal))

    return key
  }
}
