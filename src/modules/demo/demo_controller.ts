import { controller, httpGet } from "inversify-express-utils";
import { modules } from "../../ioc";
import { inject, LazyServiceIdentifer } from "inversify";
import {
  ApiOperationGet,
  ApiPath,
  SwaggerDefinitionConstant,
} from "swagger-express-ts";
import * as express from "express";
import { DexLogger } from "../../component";
import SqlIndexerWrapper from '../indexer/indexer_sql';
import CkbRequestModel from "../../model/req/ckb_request_model";
import { QueryOptions, Script } from "@ckb-lumos/base";


@ApiPath({
  path: "/",
  name: "test",
  security: { basicAuth: [] },
})

@controller("/")
export default class DemoController {
    private logger: DexLogger;
    constructor(
      @inject(new LazyServiceIdentifer(() => modules[SqlIndexerWrapper.name]))
      private indexer: SqlIndexerWrapper
    ) {
      this.logger = new DexLogger(DemoController.name);
    }

    @ApiOperationGet({
      path: "demo",
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
          // model: "BalanceCkbModel",
        },
        400: { description: "Parameters fail" },
      },
    })
    @httpGet("demo")
    async getCKBBalance(
      req: express.Request,
      res: express.Response
    ): Promise<void> {
      const reqParms = CkbRequestModel.buildReqParam(
        null,
        null,
        null,
        <string>req.query.lock_code_hash,
        <string>req.query.lock_hash_type,
        <string>req.query.lock_args,
      );

      const query: QueryOptions = {
        lock: reqParms.lockScript()
      }
      try {
        // const a = this.indexer.getTx("0x8084c71e6ff455c947578dba7e5334654b61fc4751fa249f512e73c52250ee68");

        this.indexer.test(query);


        res.status(200).json("ok");
      } catch (err) {
        this.logger.error(err);
        res.status(500).send();
      }
    }

    
}  