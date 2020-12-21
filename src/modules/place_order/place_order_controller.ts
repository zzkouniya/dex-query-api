import { controller, httpPost } from "inversify-express-utils";
import { modules } from "../../ioc";
import { inject, LazyServiceIdentifer } from "inversify";
import {
  ApiOperationPost,
  ApiPath,
  SwaggerDefinitionConstant,
} from "swagger-express-ts";
import * as express from "express";
import { DexLogger } from "../../component";
import PlaceOrderService from "./place_order_service";

@ApiPath({
  path: "/",
  name: "place-order",
  security: { basicAuth: [] },
})
@controller("/")
export default class PlaceOrderController {
  private logger: DexLogger;
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[PlaceOrderService.name]))
    private placeOrderService: PlaceOrderService
  ) {
    this.logger = new DexLogger(PlaceOrderController.name);
  }

  @ApiOperationPost({
    path: "place-order",
    description: "place order tx",
    summary: "",
    parameters: {
      body: {
        description: "",
        required: true,
        model: "PlaceOrderModel",
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
  @httpPost("place-order")
  async getLiveCells(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const tx = await this.placeOrderService.placeOrder({
        pay: req.body.pay,
        price: req.body.price,
        udt_type_args: req.body.udt_type_args,
        ckb_address: req.body.ckb_address,
        is_bid: req.body.is_bid,
        udt_decimals: req.body.udt_decimals,
        spent_cells: req.body.spent_cells
      });

      res.status(200).json(tx);
    } catch (error) {
      console.log(error);
      
      res.status(400).json(error);
    }

  }

}
