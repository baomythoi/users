import { createClient } from 'redis';

/* eslint-disable no-console */
export default new class RedisService {
  protected redisClient: ReturnType<typeof createClient>;

  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy(retries: number): number | Error {
          return retries <= 3 ? 3_000 : new Error('Max retries reached');
        },
        connectTimeout: 60_000,
      },
    });
  }

  async connect() {
    try {
      this.redisClient.connect().then(() => {
        setInterval(async () => {
          await this.redisClient.ping();
        }, 10_000); // ping every 10s
      });

      // Log Redis client connection success
      this.redisClient.on('connect', () => {
        console.info('Redis client connected');
      });

      // Log Redis client connection error
      this.redisClient.on('error', (error) => {
        console.error(`Redis connection error: ${error?.message}`);
      });
    } catch (error: any) {
      console.error(`Failed to connect to Redis: ${error?.message}`);
      setTimeout(() => this.connect(), 5000); // Retry connection
    }
  }

  async getInstance() {
    await this.connect();

    return this.redisClient;
  }

  async quitConnect() {
    if (this.redisClient)
      await this.redisClient.quit();
  }
}