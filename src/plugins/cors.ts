import fp from 'fastify-plugin';
import cors from '@fastify/cors';

/**
 * CORS plugin configuration
 */
export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: true,
  });
}, {
  name: 'cors-plugin',
});
