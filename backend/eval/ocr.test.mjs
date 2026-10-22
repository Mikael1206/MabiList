import assert from 'node:assert/strict';
import test from 'node:test';
import { characterAccuracy } from './ocr.mjs';

test('OCR score ignores line breaks, punctuation, and label case but counts missing chat text', () => {
  assert.equal(characterAccuracy('Buyer: 2 banana loaves\nSeller: Yes', 'BUYER\n2 banana loaves\nSELLER Yes'), 100);
  assert.ok(characterAccuracy('Buyer: 2 banana loaves', 'BUYER  banana loaves') < 100);
  assert.equal(characterAccuracy('Buyer: 2 banana loaves', ''), 0);
});
