import dotENV from 'dotenv';
import type { Knex } from "knex";
import { knexSnakeCaseMappers } from 'objection';
import path from 'path';
dotENV.config({
  path: path.join('.env')
});

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT as string),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      charset: process.env.DATABASE_CHARSET,
    },
    pool: {
      min: 5,
      max: 30,
      acquireTimeoutMillis: 20_000,   // 20s chờ acquire connection
      createTimeoutMillis: 10_000,    // 10s tạo connection
      idleTimeoutMillis: 300_000,     // 5 phút idle thì release
      reapIntervalMillis: 10_000,     // 10s dọn pool
      createRetryIntervalMillis: 2000 // 2s retry nếu tạo connection fail
    },
    searchPath: ['knex', 'public'],
    migrations: { tableName: "knex_migrations" },
    debug: true,
    log: {
      debug: (message) => {
        const { sql, bindings } = message;
        console.info(sql, bindings);
      }
    },
    ...knexSnakeCaseMappers()
  },

  productionWrite: {
    client: "pg",
    connection: {
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT as string),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      charset: process.env.DATABASE_CHARSET,
    },
    pool: {
      min: 5,
      max: 20,                        // nhỏ hơn dev, tránh quá tải DB
      acquireTimeoutMillis: 20_000,   // tăng lên 20s để giảm lỗi acquire
      createTimeoutMillis: 10_000,
      idleTimeoutMillis: 300_000,
      reapIntervalMillis: 10_000,
      createRetryIntervalMillis: 2000
    },
    asyncStackTraces: true,
    searchPath: ['knex', 'public'],
    migrations: { tableName: "knex_migrations" },
    ...knexSnakeCaseMappers()
  },

  productionRead: {
    client: "pg",
    connection: {
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT as string),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      charset: process.env.DATABASE_CHARSET,
    },
    pool: {
      min: 5,
      max: 20,                        // giống write để cân bằng tải
      acquireTimeoutMillis: 20_000,
      createTimeoutMillis: 10_000,
      idleTimeoutMillis: 300_000,
      reapIntervalMillis: 10_000,
      createRetryIntervalMillis: 2000
    },
    asyncStackTraces: true,
    searchPath: ['knex', 'public'],
    migrations: { tableName: "knex_migrations" },
    ...knexSnakeCaseMappers()
  },
};

export default config;
