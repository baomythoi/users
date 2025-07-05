import { buildServer } from '@utils/server';

const startService = async () => {
  const PORT = process.env.PORT || 0;

  const fastifyInstance = await buildServer();

  try {
    await fastifyInstance.listen({
      port: +PORT,
      host: '0.0.0.0'
    });
  } catch (err) {
    fastifyInstance.log.error(err);
  }
};

startService();