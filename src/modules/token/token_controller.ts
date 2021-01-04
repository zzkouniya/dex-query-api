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
    path: 'tokens/whiteList',
    description: 'white list',
    summary: 'white list',
    responses: {
      200: {
        description: 'Success'
      },
      400: { description: 'Parameters fail' }
    }
  })
  @httpGet('tokens/whiteList')
  async whiteList (req: express.Request, res: express.Response): Promise<void> {
    try {
      const whiteList = await this.tokenService.getWhiteListSudt()
      res.status(200).json(whiteList)
    } catch (error) {
      this.logger.error(error)
    }
  }

  @ApiOperationGet({
    path: 'tokens/partialNameOrSymbol',
    description: 'partial name or symbol',
    summary: 'partial name or symbol',
    parameters: {
      query: {
        type_code_hash: {
          name: 'partialNameOrSymbol',
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
  @httpGet('tokens/partialNameOrSymbol')
  async partialNameOrSymbol (req: express.Request, res: express.Response): Promise<void> {
    const partialNameOrSymbol = <string>req.query.partialNameOrSymbol
    try {
      const whiteList = await this.tokenService.getTokenInfoByNameOrSymbol(partialNameOrSymbol)
      res.status(200).json(whiteList)
    } catch (error) {
      this.logger.error(error)
    }
  }

  @ApiOperationGet({
    path: 'tokens/typeHash',
    description: 'query by typeHash',
    summary: 'query by typeHash',
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
  @httpGet('tokens/typeHash')
  async typeHash (req: express.Request, res: express.Response): Promise<void> {
    const typeHash = <string>req.query.typeHash
    try {
      const tokenInfo = await this.tokenService.getTokenInfoByTypeHash(typeHash)
      res.status(200).json(tokenInfo)
    } catch (error) {
      this.logger.error(error)
    }
  }

  @ApiOperationGet({
    path: 'tokens/address',
    description: 'query by address',
    summary: 'query by address',
    parameters: {
      query: {
        type_code_hash: {
          name: 'address',
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
  @httpGet('tokens/address')
  async address (req: express.Request, res: express.Response): Promise<void> {
    const address = <string>req.query.address
    try {
      const tokenInfo = await this.tokenService.getTokenInfoByAddress(address)
      res.status(200).json(tokenInfo)
    } catch (error) {
      this.logger.error(error)
    }
  }

  @ApiOperationGet({
    path: 'tokens/cellInfo',
    description: 'query cell info',
    summary: 'query cell info',
    parameters: {
      query: {
        type_code_hash: {
          name: 'address',
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
  @httpGet('tokens/cellInfo')
  async cellInfo (req: express.Request, res: express.Response): Promise<void> {
    const address = <string>req.query.address
    try {
      const result = await this.tokenService.getCellInfoByAddress(address)
      res.status(200).json(result)
    } catch (error) {
      this.logger.error(error)
    }
  }
}
