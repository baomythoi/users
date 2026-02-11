import BaseCommon from '@core/base.common';
import { connect, Connection, Channel } from 'amqplib';
import { EventEmitter } from 'events';

const RECONNECT_DELAY = 5_000;
const HEARTBEAT_INTERVAL = 60;

class RabbitMQService extends EventEmitter {
  private connection!: Connection;
  private isConnecting = false;
  private isManualClose = false;

  async connect(): Promise<void> {
    // Prevent concurrent connect attempts
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.isManualClose = false;

    BaseCommon.logger.info('Connecting to RabbitMQ...');

    try {
      this.connection = await connect(
        process.env.RABBITMQ_URL || '',
        { heartbeat: HEARTBEAT_INTERVAL }
      );

      this.isConnecting = false;
      BaseCommon.logger.info('RabbitMQ connected ✓');

      this.connection.on('error', (error) => {
        BaseCommon.logger.error(`RabbitMQ connection error ✘: ${error?.message}`);
      });

      this.connection.on('close', () => {
        if (this.isManualClose) return;

        BaseCommon.logger.error('RabbitMQ connection closed ✘. Reconnecting...');
        this.emit('rabbitmq_disconnected');
        setTimeout(() => this.connect(), RECONNECT_DELAY);
      });

      this.emit('rabbitmq_connected');
    } catch (error: any) {
      this.isConnecting = false;
      BaseCommon.logger.error(`Failed to connect to RabbitMQ ✘: ${error?.message}`);
      setTimeout(() => this.connect(), RECONNECT_DELAY);
    }
  }

  /**
   * Create a dedicated channel (for consumers or RPC callers)
   * Each channel has its own prefetch and is isolated from others
   */
  createChannel = async (): Promise<Channel> => {
    if (!this.connection) {
      throw new Error('RabbitMQ connection not established');
    }
    return this.connection.createChannel();
  }

  /**
   * Get a shared publisher channel for fire-and-forget messages (pushToWorker)
   * Auto-recreates if the channel is closed
   */
  private publisherChannel: Channel | null = null;
  private publisherChannelPromise: Promise<Channel> | null = null;

  getPublisherChannel = async (): Promise<Channel> => {
    if (!this.connection) {
      throw new Error('RabbitMQ connection not established');
    }

    if (this.publisherChannel) {
      return this.publisherChannel;
    }

    // Prevent duplicate channel creation under concurrent calls
    if (!this.publisherChannelPromise) {
      this.publisherChannelPromise = this.createPublisherChannel();
    }

    return this.publisherChannelPromise;
  }

  private createPublisherChannel = async (): Promise<Channel> => {
    try {
      this.publisherChannel = await this.connection.createChannel();

      this.publisherChannel.on('error', (err) => {
        BaseCommon.logger.error(`Publisher channel error ✘: ${err?.message}`);
        this.publisherChannel = null;
        this.publisherChannelPromise = null;
      });

      this.publisherChannel.on('close', () => {
        BaseCommon.logger.warn('Publisher channel closed, will recreate on next publish');
        this.publisherChannel = null;
        this.publisherChannelPromise = null;
      });

      BaseCommon.logger.info('Publisher channel created ✓');
      return this.publisherChannel;
    } catch (error) {
      this.publisherChannelPromise = null;
      throw error;
    }
  }

  /**
   * Shared RPC channel — single channel for all RPC request/response calls
   * Uses Direct Reply-to (amq.rabbitmq.reply-to) with correlationId map
   * to route responses back to the correct caller.
   *
   * Benefits vs creating channel per call:
   * - No channel creation/destruction overhead per RPC call
   * - Scales to high RPC throughput without channel churn
   * - Single consumer on reply queue handles all responses
   */
  private rpcChannel: Channel | null = null;
  private rpcChannelPromise: Promise<Channel> | null = null;
  private rpcPendingRequests: Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeoutId: NodeJS.Timeout;
  }> = new Map();

  getRpcChannel = async (): Promise<Channel> => {
    if (!this.connection) {
      throw new Error('RabbitMQ connection not established');
    }

    if (this.rpcChannel) {
      return this.rpcChannel;
    }

    // Prevent duplicate channel creation under concurrent calls
    if (!this.rpcChannelPromise) {
      this.rpcChannelPromise = this.createRpcChannel();
    }

    return this.rpcChannelPromise;
  }

  private createRpcChannel = async (): Promise<Channel> => {
    try {
      this.rpcChannel = await this.connection.createChannel();

      // Single consumer on Direct Reply-to queue — routes all RPC responses by correlationId
      this.rpcChannel.consume('amq.rabbitmq.reply-to', (msg) => {
        if (!msg) return;

        const { correlationId } = msg.properties;
        const pending = this.rpcPendingRequests.get(correlationId);

        if (pending) {
          clearTimeout(pending.timeoutId);
          this.rpcPendingRequests.delete(correlationId);

          try {
            const response = JSON.parse(msg.content.toString());
            pending.resolve(response);
          } catch {
            pending.reject(new Error(`Invalid RPC response for correlationId: ${correlationId}`));
          }
        }
      }, { noAck: true });

      this.rpcChannel.on('error', (err) => {
        BaseCommon.logger.error(`RPC channel error ✘: ${err?.message}`);
        this.cleanupRpcChannel('RPC channel error');
      });

      this.rpcChannel.on('close', () => {
        BaseCommon.logger.warn('RPC channel closed, will recreate on next call');
        this.cleanupRpcChannel('RPC channel closed');
      });

      BaseCommon.logger.info('Shared RPC channel created ✓');
      return this.rpcChannel;
    } catch (error) {
      this.rpcChannelPromise = null;
      throw error;
    }
  }

  /**
   * Register a pending RPC request — returns a promise that resolves when response arrives
   */
  registerRpcRequest = (correlationId: string, timeoutMs: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.rpcPendingRequests.delete(correlationId);
        reject(new Error(`RPC call timed out after ${timeoutMs}ms (correlationId: ${correlationId})`));
      }, timeoutMs);

      this.rpcPendingRequests.set(correlationId, { resolve, reject, timeoutId });
    });
  }

  /**
   * Cleanup RPC channel and reject all pending requests
   */
  private cleanupRpcChannel = (reason: string): void => {
    this.rpcChannel = null;
    this.rpcChannelPromise = null;

    // Reject all pending RPC requests
    for (const [correlationId, pending] of this.rpcPendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error(`${reason} — pending request aborted (correlationId: ${correlationId})`));
    }
    this.rpcPendingRequests.clear();
  }

  closeConnection = async (): Promise<void> => {
    this.isManualClose = true;

    // Close publisher channel
    if (this.publisherChannel) {
      try { await this.publisherChannel.close(); } catch { /* already closed */ }
      this.publisherChannel = null;
      this.publisherChannelPromise = null;
    }

    // Close RPC channel and reject pending requests
    if (this.rpcChannel) {
      try { await this.rpcChannel.close(); } catch { /* already closed */ }
      this.cleanupRpcChannel('Connection closing');
    }

    if (this.connection) {
      await this.connection.close();
    }
  }
}

export default new RabbitMQService();