import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyInstance } from 'fastify';

import { getDiceRoll } from './application/get-dice-roll.js';

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Node CI/CD Kata',
        description: 'Un servicio sencillo que simula la tirada de un dado.',
        version: '0.1.0',
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  app.get('/', { schema: { hide: true } }, async (_request, reply) => reply.redirect('/docs'));

  app.get(
    '/dice/roll',
    {
      schema: {
        summary: 'Tirar un dado de seis caras',
        response: {
          200: {
            type: 'integer',
            minimum: 1,
            maximum: 6,
          },
        },
      },
    },
    () => getDiceRoll(),
  );

  return app;
}
