import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtures } from './fixtures.mjs';
import { scoreCase, summarize } from './score.mjs';

test('fixture set is 30 distinct synthetic conversations with labeled fields', () => {
  assert.equal(fixtures.length, 30);
  assert.equal(new Set(fixtures.map((item) => item.id)).size, 30);
  assert.ok(fixtures.every((item) => item.messages.length >= 2 && item.expected.orders.length === 1));
});

test('omission scores correctly and guessed missing values fail', () => {
  const expected = fixtures.find((item) => item.id === '04-no-price').expected;
  assert.equal(Object.values(scoreCase(expected, structuredClone(expected)).correct).every(Boolean), true);
  const guess = structuredClone(expected);
  guess.orders[0].items[0].unit_price_php = 100;
  guess.orders[0].total_php = 200;
  const result = scoreCase(expected, guess);
  assert.equal(result.correct.price, false);
  assert.equal(result.guesses, 2);
});

test('malformed reply counts as all fields wrong, not a dropped case', () => {
  const score = scoreCase(fixtures[0].expected, { orders: [] });
  const summary = summarize([{ score, durationMs: 12 }]);
  assert.equal(summary.overallPercent, 0);
  assert.equal(summary.keyPercent, 0);
  assert.equal(summary.failedOrInvalid, 1);
});

test('item order does not change the score, but extra output fields invalidate it', () => {
  const expected = fixtures.find((item) => item.id === '11-two-items').expected;
  const reversed = structuredClone(expected);
  reversed.orders[0].items.reverse();
  assert.equal(Object.values(scoreCase(expected, reversed).correct).every(Boolean), true);
  reversed.orders[0].phone = 'fake';
  assert.equal(scoreCase(expected, reversed).invalid, true);
});
