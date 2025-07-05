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
      min: 30,
      max: 100,
      acquireTimeoutMillis: 30_000,  // 30 seconds
      createTimeoutMillis: 10_000,  // 10 seconds
      idleTimeoutMillis: 300_000,  // 5 minutes
      reapIntervalMillis: 10_000,  // 10 seconds
      createRetryIntervalMillis: 2000,  // 2 seconds
      propagateCreateError: false,
    },
    searchPath: ['knex', 'public'],
    migrations: {
      tableName: "knex_migrations"
    },
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
      min: 10,
      max: 30,
      acquireTimeoutMillis: 10_000, // 10 seconds timeout for acquiring connections
      createTimeoutMillis: 10_000,  // 10 seconds timeout for creating connections
      idleTimeoutMillis: 300_000,   // 5 minutes idle timeout
      reapIntervalMillis: 5_000,    // 5 seconds cleanup interval
      createRetryIntervalMillis: 1000, // 1 second retry interval for creating connections
    },
    asyncStackTraces: true, // Helpful for debugging
    searchPath: ['knex', 'public'],
    migrations: {
      tableName: "knex_migrations"
    },
    ...knexSnakeCaseMappers()
  },
  productionRead: {
    client: "pg",
    connection: {
      host: process.env.DATABASE_REPLICA_HOST,
      port: parseInt(process.env.DATABASE_REPLICA_PORT as string),
      user: process.env.DATABASE_REPLICA_USER,
      password: process.env.DATABASE_REPLICA_PASSWORD,
      database: process.env.DATABASE_REPLICA_NAME,
      charset: process.env.DATABASE_REPLICA_CHARSET,
    },
    pool: {
      min: 10,
      max: 30,
      acquireTimeoutMillis: 10_000, // 10 seconds timeout for acquiring connections
      createTimeoutMillis: 10_000,  // 10 seconds timeout for creating connections
      idleTimeoutMillis: 300_000,   // 5 minutes idle timeout
      reapIntervalMillis: 5_000,    // 5 seconds cleanup interval
      createRetryIntervalMillis: 1000, // 1 second retry interval for creating connections
    },
    asyncStackTraces: true, // Helpful for debugging
    searchPath: ['knex', 'public'],
    migrations: {
      tableName: "knex_migrations"
    },
    ...knexSnakeCaseMappers()
  },
};

export default config;
