import { inject, injectable, LazyServiceIdentifer } from "inversify";
import BigNumber from "bignumber.js";
import IndexerWrapper from "../indexer/indexer";

import { modules } from "../../ioc";
import { contracts } from "../../config";
import { CkbUtils, DexOrderCellFormat } from "../../component";
import BestPriceModel from "./best_price_model";
import { IndexerService } from '../indexer/indexer_service';

@injectable()
export default class OrdersService {
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private indexer: IndexerService
  ) {}

  async getOrders(
    type_code_hash,
    type_hash_type,
    type_args,
    order_lock_args
  ): Promise<Array<DexOrderCellFormat>> {
    const orderCells = await this.indexer.collectCells({
      type: {
        code_hash: type_code_hash,
        hash_type: type_hash_type,
        args: type_args,
      },
      lock: {
        code_hash: contracts.orderLock.codeHash,
        hash_type: contracts.orderLock.hashType,
        args: order_lock_args,
      },
    });

    return CkbUtils.formatOrderCells(orderCells);
  }

  async getBestPrice(
    type_code_hash,
    type_hash_type,
    type_args,
    is_bid
  ): Promise<BestPriceModel> {
    const orderCells = await this.indexer.collectCells({
      type: {
        code_hash: type_code_hash,
        hash_type: type_hash_type,
        args: type_args,
      },
      lock: {
        code_hash: contracts.orderLock.codeHash,
        hash_type: contracts.orderLock.hashType,
        args: "0x",
      },
      argsLen: "any",
    });

    if (!orderCells.length) {
      throw { error: "cells is null" };
    }

    const formattedOrderCells = CkbUtils.formatOrderCells(orderCells);

    const sortedCells = formattedOrderCells
      .filter((cell) => is_bid !== cell.is_bid && cell.order_amount !== "0")
      .filter((cell) => !this.isInvalidOrderCell(cell))
      .sort((a, b) => {
        if (is_bid) {
          return new BigNumber(a.price)
            .minus(new BigNumber(b.price))
            .toNumber();
        }
        return new BigNumber(b.price).minus(a.price).toNumber();
      });

    const result: BestPriceModel = {
      price: sortedCells[0].price,
    };

    return result;
  }

  isInvalidOrderCell(cell: DexOrderCellFormat): boolean {
    const orderCellMinCapacity = new BigNumber(17900000000);
    const capacityBN = new BigNumber(cell.raw_data.cell_output.capacity);
    const sudtAmountBN = new BigNumber(cell.sudt_amount);
    const orderAmountBN = new BigNumber(cell.order_amount);
    const priceBN = new BigNumber(cell.price).dividedBy(
      new BigNumber(10 ** 10)
    );
    const feeRatioBN = new BigNumber(0.003);
    try {
      if (cell.raw_data.cell_output.lock.args.length !== 66) {
        return true;
      }
      if (capacityBN.lt(orderCellMinCapacity)) {
        return true;
      }
      if (cell.is_bid) {
        const exchangeCapacity = orderAmountBN.multipliedBy(priceBN);
        const minimumCapacity = exchangeCapacity
          .plus(exchangeCapacity.multipliedBy(feeRatioBN))
          .plus(orderCellMinCapacity);
        const invalid = capacityBN.lt(minimumCapacity);
        return invalid;
      }

      const exchangeSudtAmountBN = orderAmountBN.dividedBy(priceBN);
      const minimumSudtAmountBN = exchangeSudtAmountBN.multipliedBy(1.003);
      const invalid = sudtAmountBN.lt(minimumSudtAmountBN);
      return invalid;
    } catch (error) {
      console.error(error);
      return true;
    }
  }
}
