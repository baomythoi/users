import Knex from 'knex';
import knexConfig from '@app/knexfile';
import { Model } from 'objection';

/* eslint-disable no-console */
export default new class KnexConfig {
  private knexWriteInstance: any;
  private knexReadInstance: any;

  constructor() {
    switch (process.env.NODE_ENV) {
      case 'production':
      case 'pilot':
        this.knexWriteInstance = Knex(knexConfig.productionWrite);
        this.knexReadInstance = Knex(knexConfig.productionRead);
        break;

      default:
        this.knexWriteInstance = Knex(knexConfig.developmentWrite);
        this.knexReadInstance = Knex(knexConfig.developmentRead);
        break;
    }
  }

  async init(): Promise<void> {
    try {
      /** Set the global knex instance for Objection.js */
      Model.knex(this.knexWriteInstance);

      setInterval(async () => {
        try {
          await this.knexWriteInstance.raw('SELECT 1').timeout(5000); // 5s
          await this.knexReadInstance.raw('SELECT 2').timeout(5000);
        } catch (err) {
          console.error('Database ping failed:', err);
        }
      }, 10 * 60_000); // ping every 10 minutes

      console.info('Knex initialized successfully and database connected')
    } catch (error) {
      console.error('Error initializing Knex or connecting to database:', JSON.stringify(error));
    }
  }

  // Getter for read Knex instance
  getReadKnex() {
    return this.knexReadInstance;
  }
}