import { injectable } from 'inversify';
import redis from 'redis';
import { redisConfiguration } from "../../config"

@injectable()
export default class CellCache {
    private client: redis.RedisClient;
    constructor() {
      this.client = redis.createClient(<number>redisConfiguration.port, redisConfiguration.address);
      this.client.auth(redisConfiguration.auth); 
    }

    set(key: string): void {
      this.client.setex(key, 360, key);
    }

    async exists(key: string): Promise<boolean> {
      const value = await new Promise((resolve => {
        this.client.exists(key, function (err, res) {
          return resolve(res);
        });
      }));
      
      return <boolean>value;
    }
}