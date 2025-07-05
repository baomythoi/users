import Redis from '@utils/redis';
import { createClient } from 'redis';

export default new class RedisService {
  protected redisClient!: ReturnType<typeof createClient>;

  connect = async (): Promise<void> => {
    this.redisClient = await Redis.getInstance();
  }

  async quitConnect() {
    if (this.redisClient)
      await this.redisClient.quit();
  }

  pushToQueue = async (data: { key: string; value: string }, expire: number = 60 * 60 * 24): Promise<number> => {
    const resultPush = await this.redisClient.rPush(data.key, String(data.value));
    if (!resultPush) return resultPush;

    await this.redisClient.expire(data.key, expire);
    return resultPush;
  }

  getListFromQueue = async (key: string, limit: number): Promise<string[]> => {
    let result = await this.redisClient.lRange(key, 0, limit);

    if (result.length) {
      result = result.map((item) => {
        return JSON.parse(item);
      });
    }

    return result;
  };

  getFirstAndRemove = async (key: string): Promise<string | null> => {
    let result = await this.redisClient.lPop(key);

    if (result) {
      try {
        result = JSON.parse(result);
      } catch (error) {
        return result;
      }
    }

    return result;
  };

  removeQueueByValue = async (data: { key: string; value: string }, index = 0): Promise<number> => {
    return await this.redisClient.lRem(data.key, index, data.value);
  };

  addCache = async (data: { key: string; value: string }, expire = 0): Promise<string | null> => {
    let option: { EX?: number } = { EX: expire };
    if (!expire)
      option = {};

    return this.redisClient.set(data.key, data.value, option);
  };

  getCache = async (key: string): Promise<any> => {
    let result = await this.redisClient.get(key);

    if (result) {
      try {
        result = JSON.parse(result);
      } catch (error) {
        return result;
      }
    }

    return result;
  };

  clearCache = async (key: string): Promise<number> => {
    return await this.redisClient.del(key);
  };

  findValueInQueue = async (key: string, value: string): Promise<number | null> => {
    try {
      return await this.redisClient.LPOS(key, value);
    } catch (error) {
      return null;
    }
  };
}