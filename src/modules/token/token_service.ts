import { QueryOptions } from '@ckb-lumos/base'
import { inject, injectable, LazyServiceIdentifer } from 'inversify'
import * as ckbCoreUtils from '@nervosnetwork/ckb-sdk-utils'
import { modules } from '../../ioc'
import { SudtTokenInfo } from '../../model/sudt_info/sudt_info'
import CkbTokenRepository from '../repository/sudt_repository'
import { DexRepository } from '../repository/dex_repository'
import CkbRepository from '../repository/ckb_repository'

@injectable()
export default class TokenService {
  private readonly type_code_hash: string = '0x72f3d72944f29511eedf806d4b12d77ca0a5cfbb2000d059d8898d283971b579'

  constructor (
    @inject(new LazyServiceIdentifer(() => modules[CkbTokenRepository.name]))
    private readonly tokenRepository: CkbTokenRepository,
    @inject(new LazyServiceIdentifer(() => modules[CkbRepository.name]))
    private readonly ckbRepository: DexRepository
  ) {}

  async getWhiteListSudt (): Promise<SudtTokenInfo[]> {
    return this.tokenRepository.getWhiteList()
  }

  async getTokenInfoByNameOrSymbol (partialNameOrSymbol: string): Promise<SudtTokenInfo[]> {
    const result: SudtTokenInfo[] = []
    for (const name of this.tokenRepository.getWhiteListGroupByName().keys()) {
      if (name.startsWith(partialNameOrSymbol)) {
        result.push(this.tokenRepository.getWhiteListGroupByName().get(name))
      }
    }

    for (const symbol of this.tokenRepository.getWhiteListGroupBySymbol().keys()) {
      if (symbol.startsWith(partialNameOrSymbol)) {
        result.push(this.tokenRepository.getWhiteListGroupBySymbol().get(symbol))
      }
    }

    return result
  }

  async getTokenInfoByTypeHash (typeHash: string): Promise<SudtTokenInfo> {
    return this.tokenRepository.getGroupByTypeHash().get(typeHash)
  }

  async getTokenInfoByAddress (address: string): Promise<SudtTokenInfo> {
    return this.tokenRepository.getGroupByAddress().get(address)
  }

  async getCellInfoByAddress (address: string): Promise<SudtTokenInfo> {
    const queryOption: QueryOptions = {
      type: {
        code_hash: this.type_code_hash,
        hash_type: 'type',
        args: ckbCoreUtils.scriptToHash(ckbCoreUtils.addressToScript(address))
      }
    }

    const sudtInfoCell = await this.ckbRepository.collectCells(queryOption)
    if (sudtInfoCell.length === 0) {
      return undefined
    }

    const sudtInfoData = this.parseSudtInfo(sudtInfoCell[0].data)

    const sudtTokenInfo: SudtTokenInfo = {
      name: sudtInfoData.name,
      symbol: sudtInfoData.symbol,
      decimal: sudtInfoData.decimal,
      address: address,
      amount: undefined,
      chianName: 'ckb',
      typeHash: ckbCoreUtils.scriptToHash(
        {
          codeHash: this.type_code_hash,
          hashType: 'type',
          args: ckbCoreUtils.scriptToHash(ckbCoreUtils.addressToScript(address))
        })
    }

    return sudtTokenInfo
  }

  private parseSudtInfo (cellData: string): SudtInfoData {
    const decimalBuf: Buffer = Buffer.from(cellData.slice(2, 4), 'hex')
    const decimal = decimalBuf.readUInt8()

    const nameAndSymbol = cellData.slice(4, cellData.length)
    const arr = []
    for (let i = 0; i < nameAndSymbol.length; i = i + 2) {
      const num = parseInt(nameAndSymbol.substr(i, 2), 16)
      arr.push(String.fromCharCode(num))
    }

    const sudtInfoData: SudtInfoData = {
      name: arr.splice(1, arr.lastIndexOf('\n') - 1).toString().replace(new RegExp(',', 'g'), ''),
      symbol: arr.splice(arr.lastIndexOf('\n') + 1, arr.length).toString().replace(new RegExp(',', 'g'), ''),
      decimal: decimal
    }

    return sudtInfoData
  }
}

interface SudtInfoData {
  name: string
  symbol: string
  decimal: number
}
