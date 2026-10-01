import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyInstance } from 'fastify';

import { getDiceRoll } from './application/get-dice-roll.js';

interface AppOptions {
  simulateIncident?: boolean;
}

export async function createApp({
  simulateIncident = process.env.DEMO_INCIDENT === '1',
}: AppOptions = {}): Promise<FastifyInstance> {
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
    () => {
      const roll = getDiceRoll();
      return simulateIncident ? roll + 10 : roll;
    },
  );

  app.get(
    '/version',
    {
      schema: {
        summary: 'Identificar la versión desplegada',
        response: {
          200: {
            type: 'object',
            required: ['version'],
            properties: { version: { type: 'string' } },
          },
        },
      },
    },
    () => ({ version: process.env.APP_VERSION ?? 'dev' }),
  );

  app.get(
    '/health',
    {
      schema: {
        summary: 'Comprobar que el servicio responde',
        response: {
          200: {
            type: 'object',
            required: ['status'],
            properties: { status: { type: 'string', const: 'ok' } },
          },
        },
      },
    },
    () => ({ status: 'ok' }),
  );

  return app;
}
