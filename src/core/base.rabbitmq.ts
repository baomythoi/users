import { Channel } from 'amqplib';
import RabbitMQ from '@utils/rabbitmq';

// rpc service
import UserAmqp from '@services/rabbitmq/rpc/user.amqp';
import UserPortalAmqp from '@services/rabbitmq/rpc/user-portal.amqp';

// worker service
import UserWorkerAmqp from '@services/rabbitmq/worker/user.amqp';

export default class RabbitMQService {
  protected channelWrapper!: Channel;
  protected PREFETCH_COUNT = 5; // Limit messages per consumer

  // rpc
  protected exchange = 'rpc.service.users.exchange';
  protected dlExchange = 'rpc.service.users.dl_exchange';

  // worker
  protected workerExchange = 'worker.service.users.exchange';
  protected dlWorkerExchange = 'worker.service.users.dl_exchange';

  constructor() {
    // Initialize
    RabbitMQ.on('rabbitmq_connected', (): void => {
      this.init();
    })
  }

  connect = async (): Promise<void> => {
    await RabbitMQ.connect();
  }

  init = async (): Promise<void> => {
    this.channelWrapper = await RabbitMQ.getChannel();

    /** Set prefetch limit per consumer */
    await this.channelWrapper.prefetch(this.PREFETCH_COUNT);

    await this.initRPC();
    await this.initWorker();
  }

  initRPC = async (): Promise<void> => {
    /** Exchange */
    await this.channelWrapper.assertExchange(this.exchange, 'topic', {
      durable: true
    });

    /** DL Exchange */
    await this.channelWrapper.assertExchange(this.dlExchange, 'direct', {
      durable: true
    });

    /** init amqp */
    await Promise.allSettled([
      new UserAmqp(this.channelWrapper).init(this.exchange, this.dlExchange),
      new UserPortalAmqp(this.channelWrapper).init(this.exchange, this.dlExchange),
    ])
  }

  initWorker = async (): Promise<void> => {
    /** Exchange */
    await this.channelWrapper.assertExchange(this.workerExchange, 'topic', {
      durable: true
    });

    /** DL Exchange */
    await this.channelWrapper.assertExchange(this.dlWorkerExchange, 'direct', {
      durable: true
    });

    /** init amqp */
    await Promise.allSettled([
      new UserWorkerAmqp(this.channelWrapper).init(this.workerExchange, this.dlWorkerExchange)
    ])
  }

  closeConnection = async (): Promise<void> => {
    await RabbitMQ.closeConnection();
  }
}