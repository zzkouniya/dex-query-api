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
import TxService from "./tx_service";
import CkbRequestModel from "../ckb_request_model";

@ApiPath({
  path: "/",
  name: "Transactions",
  security: { basicAuth: [] },
})
@controller("/")
export default class TxController {
  private logger: DexLogger;
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[TxService.name]))
    private txService: TxService
  ) {
    this.logger = new DexLogger(TxController.name);
  }

  @ApiOperationGet({
    path: "sudt-transactions",
    description: "Get sudt transactions",
    summary: "Get sudt transactions",
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
        lock_code_hash: {
          name: "lock_code_hash",
          type: "string",
          required: true,
          description: "",
        },
        lock_hash_type: {
          name: "lock_hash_type",
          type: "string",
          required: true,
          description: "",
        },
        lock_args: {
          name: "lock_args",
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
  @httpGet("sudt-transactions")
  async getSudtTransactions(
    req: express.Request,
    res: express.Response
  ): Promise<any> {
    const reqParam: CkbRequestModel = CkbRequestModel.buildReqParam(
      req.query.type_code_hash,
      req.query.type_hash_type,
      req.query.type_args,
      req.query.lock_code_hash,
      req.query.lock_hash_type,
      req.query.lock_args
    );

    if (!reqParam.isValidLockScript() && !reqParam.isValidTypeScript()) {
      return res.status(400).json({
        error: "requires either lock or type script specified as parameters",
      });
    }

    try {
      const result = await this.txService.getSudtTransactions(reqParam);

      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }

}
