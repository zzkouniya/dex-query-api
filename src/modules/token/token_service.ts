import { inject, injectable, LazyServiceIdentifer } from 'inversify'

import { modules } from '../../ioc'
import { SudtTokenInfo } from '../../model/sudt_info/sudt_info'
import CkbTokenRepository from '../repository/sudt_repository'

@injectable()
export default class TokenService {
  constructor (
    @inject(new LazyServiceIdentifer(() => modules[CkbTokenRepository.name]))
    private readonly repository: CkbTokenRepository
  ) {}

  async getWhiteListSudt (): Promise<SudtTokenInfo[]> {
    return this.repository.getWhiteList()
  }

  async getTokenInfoByNameOrSymbol (partialNameOrSymbol: string): Promise<SudtTokenInfo[]> {
    return []
  }

  async getTokenInfoByTypeHash (typeHash: string): Promise<SudtTokenInfo> {
    return this.repository.getGroupByTypeHash().get(typeHash)
  }

  async getTokenInfoByAddress (address: string): Promise<SudtTokenInfo> {
    return this.repository.getGroupByTypeHash().get('address')
  }
}
