import { Channel } from 'amqplib';
import BaseCommon from '@core/base.common';

// consumers
import RPCConsumer from '@core/consumers/rpc.consumer';
import WorkerConsumer from '@core/consumers/worker.consumer';

interface ConsumerConfig {
  name: string;
  instance: any;
  prefetchCount: number;
}

export default class RabbitMQService {
  private channels: Map<string, Channel> = new Map();
  private consumers: ConsumerConfig[] = [
    { name: 'users_rpc', instance: new RPCConsumer(), prefetchCount: 20 },
    { name: 'users_worker', instance: new WorkerConsumer(), prefetchCount: 5 },
  ];

 constructor() {
    BaseCommon.rabbitmq.on('rabbitmq_connected', (): void => {
      this.init();
    });

    BaseCommon.rabbitmq.on('rabbitmq_disconnected', (): void => {
      this.handleDisconnect();
    });
  }

  connect = async (): Promise<void> => {
    try {
      await BaseCommon.rabbitmq.connect();
      BaseCommon.logger.info('RabbitMQ connected successfully');
    } catch (error) {
      BaseCommon.logger.error('RabbitMQ connection failed');
      throw error;
    }
  }

  init = async (): Promise<void> => {
    try {
      for (const config of this.consumers) {
        const channel = await BaseCommon.rabbitmq.getChannel();

        await channel.prefetch(config.prefetchCount);

        channel.on('error', (err) => {
          BaseCommon.logger.error(`Channel error for ${config.name}`, err);
        });
        
        channel.on('close', () => {
          BaseCommon.logger.warn(`Channel closed for ${config.name}`);
          this.channels.delete(config.name);
        });

        this.channels.set(config.name, channel);


        await config.instance.initConsumer(channel);
        
        BaseCommon.logger.info(
          `Consumer ${config.name} initialized`
        );
      }
    } catch (error) {
      BaseCommon.logger.error('RabbitMQ initialization failed', error);
      throw error;
    }
  }

  private handleDisconnect = (): void => {
    BaseCommon.logger.warn('RabbitMQ disconnected, clearing channels');
    this.channels.clear();
  }

  getHealthStatus = (): object => {
    const status = {
      connected: this.channels.size > 0,
      channels: {} as Record<string, boolean>,
      totalChannels: this.channels.size,
    };

    this.consumers.forEach(config => {
      status.channels[config.name] = this.channels.has(config.name);
    });

    return status;
  }

  closeConnection = async (): Promise<void> => {
    try {
      BaseCommon.logger.info('Closing RabbitMQ connections...');

      // Close all channels first
      for (const [name, channel] of this.channels) {
        try {
          await channel.close();
          BaseCommon.logger.info(`Channel ${name} closed`);
        } catch (error) {
          BaseCommon.logger.error(`Error closing channel ${name}`, error);
        }
      }

      this.channels.clear();

      // Then close connection
      await BaseCommon.rabbitmq.closeConnection();
      BaseCommon.logger.info('RabbitMQ connection closed');
    } catch (error) {
      BaseCommon.logger.error('Error closing RabbitMQ', error);
      throw error;
    }
  }

  getChannel = (name: string): Channel | undefined => {
    return this.channels.get(name);
  }
}