import express from 'express'
import { inject, LazyServiceIdentifer } from 'inversify'
import { controller, httpGet } from 'inversify-express-utils'
import { ApiOperationGet, ApiPath } from 'swagger-express-ts'
import { DexLogger } from '../../component'
import { modules } from '../../ioc'
import TokenService from './token_service'

@ApiPath({
  path: '/',
  name: 'Token',
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
    path: 'tokens/search',
    description: 'query by typeHash or address',
    summary: 'query by typeHash or address',
    parameters: {
      query: {
        type_code_hash: {
          name: 'typeHashOrAddress',
          type: 'string',
          required: true,
          description: ''
        }
      }
    },
    responses: {
      200: {
        description: 'Success'
      },
      400: { description: 'Parameters fail' }
    }
  })
  @httpGet('tokens/search')
  async typeHash (req: express.Request, res: express.Response): Promise<void> {
    const typeHashOrAddress = <string>req.query.typeHashOrAddress
    try {
      const tokenInfo = await this.tokenService.getTokesByTypeHashOrAddress(typeHashOrAddress)
      res.status(200).json(tokenInfo)
    } catch (error) {
      this.logger.error(error)
    }
  }

  @ApiOperationGet({
    path: 'tokens/cell-info',
    description: 'query cell info',
    summary: 'query cell info',
    parameters: {
      query: {
        type_code_hash: {
          name: 'typeHash',
          type: 'string',
          required: true,
          description: ''
        }
      }
    },
    responses: {
      200: {
        description: 'Success'
      },
      400: { description: 'Parameters fail' }
    }
  })
  @httpGet('tokens/cell-info')
  async cellInfo (req: express.Request, res: express.Response): Promise<void> {
    const typeHash = <string>req.query.typeHash
    try {
      const cellInfo = await this.tokenService.getCellInfoByTypeHash(typeHash)
      if (!cellInfo) {
        res.status(400).json({ error: 'cell info does not exist' })
        return
      }
      res.status(200).json(cellInfo)
    } catch (error) {
      this.logger.error(error)
    }
  }
}