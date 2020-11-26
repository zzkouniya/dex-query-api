import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { Script } from "@ckb-lumos/base";
import IndexerWrapper from "../indexer/indexer";

import { modules } from "../../ioc";
import { contracts } from "../../config";
import OrdersHistoryCalculate from "./orders_history_calculate";
import { IndexerService } from '../indexer/indexer_service';

@injectable()
export default class OrdersHistoryService {
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[IndexerWrapper.name]))
    private indexer: IndexerService
  ) {}
  async getOrderHistory(
    type_code_hash,
    type_hash_type,
    type_args,
    order_lock_args
  ) {
    const sudtType: Script = {
      code_hash: type_code_hash,
      hash_type: type_hash_type,
      args: type_args,
    };

    const orderLock: Script = {
      code_hash: contracts.orderLock.codeHash,
      hash_type: contracts.orderLock.hashType,
      args: order_lock_args,
    };

    const ordersHistoryService = new OrdersHistoryCalculate(this.indexer, orderLock, sudtType);
    const ordersHistory = await ordersHistoryService.calculateOrdersHistory();

    const formattedOrdersHistory = ordersHistory.map((o) => {
      const orderHistory = {
        block_hash: o.block_hash,
        is_bid: o.isBid,
        order_amount: o.orderAmount.toString(),
        traded_amount: o.tradedAmount.toString(),
        turnover_rate: o.turnoverRate.toString(),
        paid_amount: o.paidAmount.toString(),
        price: o.price.toString(),
        status: o.status,
        last_order_cell_outpoint: {
          tx_hash: o.lastOrderCell.outpoint.txHash,
          index: `0x${o.lastOrderCell.outpoint.index.toString(16)}`,
        },
      };
      if (o.lastOrderCell.nextTxHash) {
        orderHistory.last_order_cell_outpoint = {
          tx_hash: o.lastOrderCell.nextTxHash,
          index: "0x1",
        };
      }

      return orderHistory;
    });

    return formattedOrdersHistory;
  }
}
