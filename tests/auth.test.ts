import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

test('Authentication Security & Hashing Tests', async (t) => {
  await t.test('bcrypt correctly hashes and verifies password', async () => {
    const rawPassword = 'PPA@Safety1st!';
    const hash = await bcrypt.hash(rawPassword, 10);
    assert.notEqual(rawPassword, hash);

    const isValid = await bcrypt.compare(rawPassword, hash);
    assert.equal(isValid, true);

    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    assert.equal(isInvalid, false);
  });
});
