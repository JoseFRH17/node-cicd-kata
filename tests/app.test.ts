import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';

const apps: Awaited<ReturnType<typeof createApp>>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map(async (app) => app.close()));
});

describe('HTTP API', () => {
  it('redirects the root route to the API documentation', async () => {
    const app = await createApp();
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/' });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/docs');
  });

  it('returns a dice roll', async () => {
    const app = await createApp();
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/dice/roll' });

    expect(response.statusCode).toBe(200);
    expect(response.json<number>()).toBeGreaterThanOrEqual(1);
    expect(response.json<number>()).toBeLessThanOrEqual(6);
  });
});
