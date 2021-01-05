import { injectable } from 'inversify'
import rp from 'request-promise'
import { explorerConfig } from '../../config'
import { SudtTokenInfo } from '../../model/sudt_info/sudt_info'

@injectable()
export default class CkbTokenRepository {
  constructor (private readonly groupByAddress: Map<string, SudtTokenInfo[]> = new Map(),
    private readonly groupByTypeHash: Map<string, SudtTokenInfo> = new Map()) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setInterval(async () => {
      console.log('sync explorer')

      const QueryOptions = {
        url: explorerConfig.explorerTokensUrl,
        method: 'GET',
        headers: {
          accept: 'application/vnd.api+json',
          // 'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
          'content-type': 'application/vnd.api+json'
        },
        referrer: explorerConfig.explorerCorsReferrer,
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
          chainName: 'ckb',
          typeHash: sudtInfo.attributes.type_hash
        }

        let tokens = this.getGroupByAddress().get(info.address)
        if (!tokens) {
          tokens = []
          this.groupByAddress.set(info.address, tokens)
        }
        tokens.push(info)
        this.groupByTypeHash.set(info.typeHash, info)
      }
    }, 60000)
  }

  getGroupByAddress (): Map<string, SudtTokenInfo[]> {
    return this.groupByAddress
  }

  getGroupByTypeHash (): Map<string, SudtTokenInfo> {
    return this.groupByTypeHash
  }
}
