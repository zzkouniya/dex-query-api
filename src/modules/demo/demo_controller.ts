import { controller, httpGet } from "inversify-express-utils";
import { modules } from "../../ioc";
import { inject, LazyServiceIdentifer } from "inversify";
import {
  ApiPath,
} from "swagger-express-ts";
import { DexLogger } from "../../component";
import SqlIndexerWrapper from '../indexer/indexer_sql';
import { IndexerService } from '../indexer/indexer_service';


@ApiPath({
  path: "/",
  name: "Balance",
  security: { basicAuth: [] },
})

@controller("/")
export default class DemoController {
    private logger: DexLogger;
    constructor(
      @inject(new LazyServiceIdentifer(() => modules[SqlIndexerWrapper.name]))
      private indexer: IndexerService
    ) {
      this.logger = new DexLogger(DemoController.name);
    }
}  