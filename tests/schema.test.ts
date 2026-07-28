import test from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

test('Prisma schema & Client validation test', async (t) => {
  await t.test('PrismaClient instance initializes cleanly', () => {
    const client = new PrismaClient();
    assert.ok(client, 'PrismaClient should be instantiated');
    assert.equal(typeof client.admin, 'object');
    assert.equal(typeof client.category, 'object');
    assert.equal(typeof client.link, 'object');
    assert.equal(typeof client.clickLog, 'object');
    assert.equal(typeof client.siteSettings, 'object');
  });
});
