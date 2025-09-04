import Knex from 'knex';
import knexConfig from '@app/knexfile';
import { Model } from 'objection';

/* eslint-disable no-console */
export default new class KnexConfig {
  private knexWriteInstance: any;
  private knexReadInstance: any;
  private reconnecting = false;

  constructor() {
    this.initKnexInstances();
  }

  private initKnexInstances() {
    switch (process.env.NODE_ENV) {
      case 'production':
      case 'pilot':
        this.knexWriteInstance = Knex(knexConfig.productionWrite);
        this.knexReadInstance = Knex(knexConfig.productionRead);
        break;
      default:
        this.knexWriteInstance = Knex(knexConfig.development);
        this.knexReadInstance = Knex(knexConfig.development);
        break;
    }
  }

  async init(): Promise<void> {
    try {
      /** Set the global knex instance for Objection.js */
      Model.knex(this.knexWriteInstance);

      setInterval(async () => {
        try {
          await this.knexWriteInstance.raw('SELECT 1');
          await this.knexReadInstance.raw('SELECT 2');
        } catch (err) {
          console.error('Database connection lost. Attempting to reconnect...');
          await this.reconnect();
        }
      }, 10 * 60_000); // ping every 10 minutes

      console.info('Knex initialized successfully and database connected')
    } catch (error) {
      console.error('Error initializing Knex or connecting to database:', JSON.stringify(error));
      await this.reconnect();
    }
  }

  private async reconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;
    try {
      // Destroy old instances if exist
      if (this.knexWriteInstance) await this.knexWriteInstance.destroy();
      if (this.knexReadInstance) await this.knexReadInstance.destroy();

      this.initKnexInstances();
      Model.knex(this.knexWriteInstance);

      // Test connection
      await this.knexWriteInstance.raw('SELECT 1');
      await this.knexReadInstance.raw('SELECT 2');
      console.info('Database reconnected successfully');
    } catch (err) {
      console.error('Reconnect failed, will retry in 10s:', err);
      setTimeout(() => this.reconnect(), 10_000);
    } finally {
      this.reconnecting = false;
    }
  }

  // Getter for read Knex instance
  getReadKnex() {
    return this.knexReadInstance;
  }
}