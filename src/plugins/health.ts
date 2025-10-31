import fp from 'fastify-plugin';

/**
 * Health check endpoint
 */
export default fp(async (fastify) => {
  fastify.get('/health', async () => ({ status: 'ok' }));
}, {
  name: 'health-plugin',
});
