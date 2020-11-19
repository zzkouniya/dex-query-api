import { controller, httpGet } from "inversify-express-utils";
import { modules } from "../../ioc";
import { inject, LazyServiceIdentifer } from "inversify";
import {
  ApiOperationGet,
  ApiPath,
  SwaggerDefinitionConstant,
} from "swagger-express-ts";
import * as express from "express";
import BalanceService from "./balance_service";
import { DexLogger } from "../../component";

@ApiPath({
  path: "/",
  name: "Balance",
  security: { basicAuth: [] },
})
@controller("/")
export default class BalanceController {
  private logger: DexLogger;
  constructor(
    @inject(new LazyServiceIdentifer(() => modules[BalanceService.name]))
    private banlanceService: BalanceService
  ) {
    this.logger = new DexLogger(BalanceController.name);
  }

  @ApiOperationGet({
    path: "ckb-balance",
    description: "Get ckb balance",
    summary: "Get ckb balance",
    parameters: {
      query: {
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
        type: SwaggerDefinitionConstant.Response.Type.OBJECT,
        model: "BalanceCkbModel",
      },
      400: { description: "Parameters fail" },
    },
  })
  @httpGet("ckb-balance")
  async getCKBBalance(
    req: express.Request,
    res: express.Response
  ): Promise<express.Response<void>> {
    const { lock_code_hash, lock_hash_type, lock_args } = req.query;

    if (!this.isValidScript(lock_code_hash, lock_hash_type, lock_args)) {
      return res
        .status(400)
        .json({ error: "requires lock script to be specified as parameters" });
    }

    try {
      const result = await this.banlanceService.getCKBBalance(
        lock_code_hash,
        lock_hash_type,
        lock_args
      );

      res.status(200).json(result);
    } catch (err) {
      this.logger.error(err);
      res.status(500).send();
    }
  }

  @ApiOperationGet({
    path: "sudt-balance",
    description: "Get sudt balance",
    summary: "Get sudt balance",
    parameters: {
      query: {
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
        type: SwaggerDefinitionConstant.Response.Type.OBJECT,
        model: "BalanceSudtModel",
      },
      400: { description: "Parameters fail" },
    },
  })
  @httpGet("sudt-balance")
  async getSUDTBalance(
    req: express.Request,
    res: express.Response
  ): Promise<express.Response<void>> {
    const {
      lock_code_hash,
      lock_hash_type,
      lock_args,
      type_code_hash,
      type_hash_type,
      type_args,
    } = req.query;

    if (
      !this.isValidScript(lock_code_hash, lock_hash_type, lock_args) ||
      !this.isValidScript(type_code_hash, type_hash_type, type_args)
    ) {
      return res.status(400).json({
        error:
          "requires both lock and type scripts to be specified as parameters",
      });
    }

    try {
      const result = this.banlanceService.getSUDTBalance(
        lock_code_hash,
        lock_hash_type,
        lock_args,
        type_code_hash,
        type_hash_type,
        type_args
      );
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send();
    }
  }

  private isValidScript(codeHash: any, hashType: any, args: any) {
    return codeHash && hashType && args;
  }
}
