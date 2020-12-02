import { controller, httpGet } from "inversify-express-utils";
import { inject, LazyServiceIdentifer } from "inversify";
import {
  ApiOperationGet,
  ApiPath,
  SwaggerDefinitionConstant,
} from "swagger-express-ts";
import * as express from "express";

import { modules } from "../../ioc";
import { DexLogger } from "../../component";
import OrderService from "./orders_service";
import OrdersHistoryService from "./orders_history_service";
import { HashType } from '@ckb-lumos/base';

@ApiPath({
  path: "/",
  name: "Orders",
  security: { basicAuth: [] },
})
@controller("/")
export default class OrderController {
  private logger: DexLogger;
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[OrderService.name]))
    private orderService: OrderService,
    @inject(new LazyServiceIdentifer(() => modules[OrdersHistoryService.name]))
    private orderHistoryService: OrdersHistoryService
  ) {
    this.logger = new DexLogger(OrderController.name);
  }

  @ApiOperationGet({
    path: "orders",
    description: "Get orders",
    summary: "Get orders",
    parameters: {
      query: {
        type_code_hash: {
          name: "type_code_hash",
          type: "string",
          required: true,
          description: "",
        },
        type_hash_type: {
          name: "type_hash_type",
          type: "string",
          required: true,
          description: "",
        },
        type_args: {
          name: "type_args",
          type: "string",
          required: true,
          description: "",
        },
      },
    },
    responses: {
      200: {
        description: "Success",
        type: SwaggerDefinitionConstant.Response.Type.ARRAY,
        // model: "BalanceCkbModel",
      },
      400: { description: "Parameters fail" },
    },
  })
  @httpGet("orders")
  async getOrders(req: express.Request, res: express.Response): Promise<void> {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
    } = req.query;
    try {
      const orders = await this.orderService.getOrders(
        <string>type_code_hash,
        <string>type_hash_type,
        <string>type_args,
      );
      const bid_orders: Array<Record<'order_amount'|'sudt_amount'|'price',string>> = []
      const ask_orders: Array<Record<'order_amount'|'sudt_amount'|'price',string>>= []
      orders
        .forEach(({ isBid, sUDTAmount: sudt_amount, orderAmount: order_amount, price }) => {
          if (order_amount === '0') {
            return
          }
          const order = { sudt_amount, order_amount, price }
          if (isBid) {
            bid_orders.push(order)
          } else {
            ask_orders.push(order)
          }
        })
        
      res.status(200).json({
        bid_orders: bid_orders.slice(0, 5),
        ask_orders: ask_orders.slice(0, 5),
      });
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }
  
  @ApiOperationGet({
    path: "current-price",
    description: "Get current price",
    summary: "Get current price",
    parameters: {
      query: {
        type_code_hash: {
          name: "type_code_hash",
          type: "string",
          required: true,
          description: "",
        },
        type_hash_type: {
          name: "type_hash_type",
          type: "string",
          required: true,
          description: "",
        },
        type_args: {
          name: "type_args",
          type: "string",
          required: true,
          description: "",
        },
      },
    },
    responses: {
      200: {
        description: "Success",
        type: SwaggerDefinitionConstant.Response.Type.STRING,
      },
      400: { description: "Parameters fail" },
    },
  })
  @httpGet("current-price")
  async getCurrentPrice(req: express.Request, res: express.Response): Promise<void> {
    const {
      type_code_hash: code_hash,
      type_hash_type: hash_type,
      type_args: args,
    } = req.query as Record<string, string>;
    try {
      const price = await this.orderService.getCurrentPrice({ code_hash, hash_type: <HashType>hash_type, args })
      res.status(200).json(price);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }

  @ApiOperationGet({
    path: "best-price",
    description: "Get best price",
    summary: "Get best price",
    parameters: {
      query: {
        type_code_hash: {
          name: "type_code_hash",
          type: "string",
          required: true,
          description: "",
        },
        type_hash_type: {
          name: "type_hash_type",
          type: "string",
          required: true,
          description: "",
        },
        type_args: {
          name: "type_args",
          type: "string",
          required: true,
          description: "",
        },
        is_bid: {
          name: "is_bid",
          type: "string",
          required: true,
          description: "",
        },
      },
    },
    responses: {
      200: {
        description: "Success",
        type: SwaggerDefinitionConstant.Response.Type.OBJECT,
        // model: "BestPriceModel",
      },
      400: { description: "Parameters fail" },
    },
  })
  @httpGet("best-price")
  async getBestPrice(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const { type_code_hash, type_hash_type, type_args, is_bid } = req.query;

    try {
      const result = await this.orderService.getBestPrice(
        <string>type_code_hash,
        <string>type_hash_type,
        <string>type_args,
        <boolean>(<unknown>is_bid)
      );

      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  }

  @ApiOperationGet({
    path: "order-history",
    description: "Get orders history",
    summary: "Get orders history",
    parameters: {
      query: {
        type_code_hash: {
          name: "type_code_hash",
          type: "string",
          required: true,
          description: "",
        },
        type_hash_type: {
          name: "type_hash_type",
          type: "string",
          required: true,
          description: "",
        },
        type_args: {
          name: "type_args",
          type: "string",
          required: true,
          description: "",
        },
        order_lock_args: {
          name: "order_lock_args",
          type: "string",
          required: true,
          description: "",
        },
      },
    },
    responses: {
      200: {
        description: "Success",
        type: SwaggerDefinitionConstant.Response.Type.OBJECT,
        // model: "BalanceCkbModel",
      },
      400: { description: "Parameters fail" },
    },
  })
  @httpGet("order-history")
  async getOrderHistory(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    const {
      type_code_hash,
      type_hash_type,
      type_args,
      order_lock_args,
    } = req.query;

    try {
      const result = await this.orderHistoryService.getOrderHistory(
        <string>type_code_hash,
        <string>type_hash_type,
        <string>type_args,
        <string>order_lock_args
      );

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).send();
    }
  }
}
