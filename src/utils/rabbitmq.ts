import { connect, Connection, Channel } from 'amqplib';
import { EventEmitter } from 'events';

/* eslint-disable no-console */
export default new class RabbitMQService extends EventEmitter {
  private connection!: Connection;
  private channelWrapper!: Channel;

  async connect() {
    console.info('Connecting to RabbitMQ...');

    try {
      const heartbeat = 60; // Set heartbeat interval in seconds
      this.connection = await connect(process.env.RABBITMQ_URL || '', { heartbeat });
      console.info('RabbitMQ connected');

      this.connection.on('error', (error) => {
        console.error(`RabbitMQ connection error: ${error?.message}`);
      });

      this.connection.on('close', () => {
        console.error('RabbitMQ Connection closed. Attempting to reconnect...');
        setTimeout(() => this.connect(), 5000); // Retry after 5 seconds
      });

      // Create a new channel
      this.channelWrapper = await this.connection.createChannel();
      console.info('RabbitMQ channel created');

      // Emit an event to notify that the connection is established
      this.emit('rabbitmq_connected');

    } catch (error: any) {
      console.error(`Failed to connect to RabbitMQ: ${error?.message}`);
      setTimeout(() => this.connect(), 5000); // Retry connection
    }
  }

  getChannel = async (): Promise<Channel> => {
    if (!this.connection) {
      await this.connect(); // Attempt to connect if not connected
    }

    // If the connection is established, check the channel
    if (this.channelWrapper && !this.channelWrapper.connection) {
      console.error('RabbitMQ channel is closed. Recreating channel...');
      this.channelWrapper = await this.connection.createChannel();
    }

    return this.channelWrapper;
  }

  createChannel = async (): Promise<Channel> => {
    const channelWrapper = await this.connection.createChannel();
    return channelWrapper;
  }

  closeConnection = async (): Promise<void> => {
    if (this.connection) {
      await this.connection.close();
    }
  }
}