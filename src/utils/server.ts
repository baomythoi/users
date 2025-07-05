import 'dotenv/config';
import fastify from 'fastify';
import RateLimit from '@fastify/rate-limit';
import Pino from 'pino';
import RabbitMQ from '@core/base.rabbitmq';
import Redis from '@core/base.redis';
import responseHandler from '@utils/response-handler';
import knexConfig from '@configs/db.config';

export async function buildServer() {
  const rabbitMQ = new RabbitMQ();

  const fastifyInstance = fastify({
    logger: Pino({
      level: 'info',
      transport: {
        target: 'pino-pretty'
      }
    }),
    ignoreTrailingSlash: true,
    keepAliveTimeout: 300_000,
    requestTimeout: 300_000
  });

  fastifyInstance.register(RateLimit, {
    max: 5_000,
    timeWindow: '1 minute'
  })

  // Fastify lifecycle hook to set up RabbitMQ connection
  fastifyInstance.addHook('onReady', async () => {
    await Promise.all([
      knexConfig.init(),
      Redis.connect(),
      rabbitMQ.connect()
    ])
  });

  // Fastify lifecycle hook to close RabbitMQ connection
  fastifyInstance.addHook('onClose', async () => {
    await Promise.all([
      Redis.quitConnect(),
      rabbitMQ.closeConnection()
    ])
  });

  fastifyInstance.addHook('onSend', (request, reply, payload: string, done) => {
    const payloadJson = JSON.parse(payload);

    reply.code = payloadJson.statusCode;
    const err = null;
    const response = new responseHandler(payloadJson);

    done(err, JSON.stringify(response.get()))
  })

  return fastifyInstance;
}