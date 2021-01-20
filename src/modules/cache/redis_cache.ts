import { injectable } from 'inversify'
import redis from 'redis'
import { redisConfiguration } from '../../config'
import { DexCache } from './dex_cache'

@injectable()
export default class RedisCache implements DexCache {
  private readonly client: redis.RedisClient
  constructor () {
    this.client = redis.createClient(<number>redisConfiguration.port, redisConfiguration.address)
    this.client.auth(redisConfiguration.auth)
  }

  async get (key: string): Promise<string> {
    const value = await new Promise(resolve => {
      this.client.get(key, (err, res) => {
        console.log(res)

        if (err) {
          return resolve(null)
        }
        return resolve(res)
      })
    })

    return <string>value
  }

  set (key: string, value: string): void {
    this.client.set(key, value)
  }
}
