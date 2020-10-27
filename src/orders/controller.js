const config = require('../config');
const indexer = require('../indexer');

const OrdersHistoryService = require('./orders-history');
const formatter = require('../commons/formatter');

class Controller {
  async getOrders(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      public_key_hash,
    } = req.query;
    try {
      const orderCells = await indexer.collectCells({
        type: {
          code_hash: type_code_hash,
          hash_type: type_hash_type,
          args: type_args,
        },
        lock: {
          code_hash: config.contracts.orderLock.codeHash,
          hash_type: config.contracts.orderLock.hashType,
          args: public_key_hash,
        },
      });
      const formattedOrderCells = orderCells.map((orderCell) => {
        const parsedOrderData = formatter.parseOrderData(orderCell.data);
        return {
          sudt_amount: parsedOrderData.sUDTAmount.toString(),
          order_amount: parsedOrderData.orderAmount.toString(),
          price: parsedOrderData.price.toString(),
          is_bid: parsedOrderData.isBid,
          raw_data: orderCell,
        };
      });
      res.status(200).json(formattedOrderCells);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }

  async getBestPrice(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      is_bid,
    } = req.query;

    const orderCells = await indexer.collectCells({
      type: {
        code_hash: type_code_hash,
        hash_type: type_hash_type,
        args: type_args,
      },
      lock: {
        code_hash: config.contracts.orderLock.codeHash,
        hash_type: config.contracts.orderLock.hashType,
        args: '0x',
      },
      argsLen: 'any',
    });

    if (!orderCells.length) {
      return res.status(404).send();
    }

    try {
      const formattedOrderCells = formatter.formatOrderCells(orderCells);

      const orderCell = formattedOrderCells
        .filter((cell) => is_bid !== cell.isBid)
        .sort((a, b) => {
          if (is_bid) {
            return a.price - b.price;
          }

          return b.price - a.price;
        })[0];

      res.status(200).json({ price: orderCell.price });
    } catch (error) {
      res.status(500).send();
    }
  }

  async getOrderHistory(req, res) {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      public_key_hash,
    } = req.query;

    const sudtType = {
      code_hash: type_code_hash,
      hash_type: type_hash_type,
      args: type_args,
    };

    const orderLock = {
      code_hash: config.contracts.orderLock.codeHash,
      hash_type: config.contracts.orderLock.hashType,
      args: public_key_hash,
    };

    try {
      const ordersHistoryService = new OrdersHistoryService(orderLock, sudtType);
      const ordersHistory = await ordersHistoryService.calculateOrdersHistory();
      const formattedOrdersHistory = ordersHistory.map((o) => ({
        is_bid: o.isBid,
        order_amount: o.orderAmount.toString(),
        traded_amount: o.tradedAmount.toString(),
        turnover_rate: o.turnoverRate.toString(),
        paid_amount: o.paidAmount.toString(),
        price: o.price.toString(),
        claimable: o.claimable,
        status: o.status,
        last_order_cell_outpoint: {
          tx_hash: o.lastOrderCell.outpoint.txHash,
          index: `0x${o.lastOrderCell.outpoint.index.toString(16)}`,
        },
      }));
      res.status(200).json(formattedOrdersHistory);
    } catch (error) {
      console.error(error);
      res.status(500).send();
    }
  }
}

module.exports = new Controller();
