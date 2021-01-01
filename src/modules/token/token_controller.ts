import express from 'express'
import { inject, LazyServiceIdentifer } from 'inversify'
import { controller, httpGet } from 'inversify-express-utils'
import { ApiOperationGet, ApiPath } from 'swagger-express-ts'
import { DexLogger } from '../../component'
import { modules } from '../../ioc'
import TokenService from './token_service'

@ApiPath({
  path: '/',
  name: 'Orders',
  security: { basicAuth: [] }
})
@controller('/')
export default class TokenController {
  private readonly logger: DexLogger
  constructor (
    @inject(new LazyServiceIdentifer(() => modules[TokenService.name]))
    private readonly tokenService: TokenService
  ) {
    this.logger = new DexLogger(TokenController.name)
  }

  @ApiOperationGet({
    path: 'test',
    description: 'test',
    summary: 'test',
    responses: {
      200: {
        description: 'Success'
        // type: SwaggerDefinitionConstant.Response.Type.ARRAY
        // model: "BalanceCkbModel",
      },
      400: { description: 'Parameters fail' }
    }
  })
  @httpGet('test')
  async test (req: express.Request, res: express.Response): Promise<void> {
    const result = await this.tokenService.getWhiteListSudt()
    console.log(result)
  }
}
