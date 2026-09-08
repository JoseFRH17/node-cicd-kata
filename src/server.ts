import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 10_000);
const app = await createApp();

try {
  await app.listen({ host: '0.0.0.0', port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
