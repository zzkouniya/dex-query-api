import { injectable } from 'inversify'
import rp from 'request-promise'
import fs from 'fs'
import { SudtTokenInfo } from '../../model/sudt_info/sudt_info'

@injectable()
export default class CkbTokenRepository {
  constructor (private readonly groupByName: Map<string, SudtTokenInfo> = new Map(),
    private readonly groupBySymbol: Map<string, SudtTokenInfo> = new Map(),
    private readonly groupByAddress: Map<string, SudtTokenInfo> = new Map(),
    private readonly groupByTypeHash: Map<string, SudtTokenInfo> = new Map(),
    private readonly whiteListGroupByName: Map<string, SudtTokenInfo> = new Map(),
    private readonly whiteListGroupBySymbol: Map<string, SudtTokenInfo> = new Map(),
    private readonly whiteList: SudtTokenInfo[] = [],
    private readonly UDTS_URL = 'https://api.explorer.nervos.org/testnet/api/v1/udts') {
    this.whiteListToken(this)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setInterval(async () => {
      console.log('sync explorer')

      const QueryOptions = {
        url: this.UDTS_URL,
        method: 'GET',
        headers: {
          accept: 'application/vnd.api+json',
          // 'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
          'content-type': 'application/vnd.api+json'
        },
        referrer: 'https://explorer.nervos.org/',
        referrerPolicy: 'strict-origin-when-cross-origin',
        body: null,
        mode: 'cors'
      }
      const result = await rp(QueryOptions)
      const sudtinfos = JSON.parse(result).data
      for (const sudtInfo of sudtinfos) {
        const info: SudtTokenInfo = {
          name: sudtInfo.attributes.full_name,
          symbol: sudtInfo.attributes.symbol,
          decimal: sudtInfo.attributes.decimal,
          address: sudtInfo.attributes.issuer_address,
          amount: sudtInfo.attributes.total_amount,
          chianName: 'ckb',
          typeHash: sudtInfo.attributes.type_hash
        }

        this.groupByAddress.set(info.address, info)
        this.groupByTypeHash.set(info.typeHash, info)
        this.groupByName.set(info.name, info)
        this.groupBySymbol.set(info.symbol, info)
      }
    }, 60000)
  }

  getWhiteList (): SudtTokenInfo[] {
    return this.whiteList
  }

  getWhiteListGroupByName (): Map<string, SudtTokenInfo> {
    return this.whiteListGroupByName
  }

  getWhiteListGroupBySymbol (): Map<string, SudtTokenInfo> {
    return this.whiteListGroupBySymbol
  }

  getGroupByAddress (): Map<string, SudtTokenInfo> {
    return this.groupByAddress
  }

  getGroupByTypeHash (): Map<string, SudtTokenInfo> {
    return this.groupByTypeHash
  }

  getGroupByName (): Map<string, SudtTokenInfo> {
    return this.groupByName
  }

  getGroupBySymbol (): Map<string, SudtTokenInfo> {
    return this.groupBySymbol
  }

  private whiteListToken (repository: CkbTokenRepository): void {
    fs.readFile('./white_list.json', function (err, data) {
      if (err) {
        return console.error(err)
      }
      const whiteList = JSON.parse(data.toString())
      for (const info of whiteList) {
        repository.getWhiteListGroupByName().set(info.name, info)
        repository.getWhiteListGroupBySymbol().set(info.symbol, info)
        repository.getWhiteList().push(info)
      }
    })
  }
}
