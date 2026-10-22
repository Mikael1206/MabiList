const sameText = (a, b) => a === b || (typeof a === 'string' && typeof b === 'string' &&
  a.trim().replace(/\s+/g, ' ').toLocaleLowerCase() === b.trim().replace(/\s+/g, ' ').toLocaleLowerCase());
const sameNumber = (a, b) => a === b || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 0.005);
import { validExtraction } from '../src/extract-orders.mjs';
const itemName = (value) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

export function scoreCase(expected, actual) {
  const names = ['customer_name', 'items', 'quantity', 'price', 'delivery_date', 'payment_status'];
  if (!validExtraction(actual)) return { correct: Object.fromEntries(names.map((name) => [name, false])), guesses: 0, invalid: true };
  const truth = expected.orders[0];
  const got = actual.orders[0];
  const actualItems = [...got.items].sort((a, b) => itemName(a.name).localeCompare(itemName(b.name)));
  const expectedItems = [...truth.items].sort((a, b) => itemName(a.name).localeCompare(itemName(b.name)));
  const aligned = expectedItems.length === actualItems.length && expectedItems.every((item, i) => sameText(item.name, actualItems[i].name));
  const correct = {
    customer_name: sameText(truth.customer_name, got.customer_name),
    items: aligned,
    quantity: aligned && expectedItems.every((item, i) => sameNumber(item.quantity, actualItems[i].quantity)),
    price: aligned && sameNumber(truth.total_php, got.total_php) && expectedItems.every((item, i) => sameNumber(item.unit_price_php, actualItems[i].unit_price_php)),
    delivery_date: sameText(truth.delivery_date, got.delivery_date),
    payment_status: truth.payment_status === got.payment_status,
  };
  let guesses = 0;
  if (truth.customer_name === null && got.customer_name !== null) guesses++;
  if (truth.delivery_date === null && got.delivery_date !== null) guesses++;
  if (truth.total_php === null && got.total_php !== null) guesses++;
  if (truth.payment_status === 'not_stated' && got.payment_status !== 'not_stated') guesses++;
  for (let i = 0; i < expectedItems.length; i++) {
    if (expectedItems[i].quantity === null && actualItems[i]?.quantity != null) guesses++;
    if (expectedItems[i].unit_price_php === null && actualItems[i]?.unit_price_php != null) guesses++;
  }
  return { correct, guesses, invalid: false };
}

export function summarize(results) {
  const fields = ['customer_name', 'items', 'quantity', 'price', 'delivery_date', 'payment_status'];
  const keyFields = ['items', 'quantity', 'price', 'payment_status'];
  const hits = (selected) => results.reduce((sum, result) => sum + selected.filter((field) => result.score.correct[field]).length, 0);
  const timings = results.map((result) => result.durationMs).filter(Number.isFinite).sort((a, b) => a - b);
  const median = timings.length ? (timings[Math.floor((timings.length - 1) / 2)] + timings[Math.floor(timings.length / 2)]) / 2 : null;
  return {
    cases: results.length,
    overallPercent: 100 * hits(fields) / (results.length * fields.length),
    keyPercent: 100 * hits(keyFields) / (results.length * keyFields.length),
    guessedValues: results.reduce((sum, result) => sum + result.score.guesses, 0),
    failedOrInvalid: results.filter((result) => result.error || result.score.invalid).length,
    medianMs: median, slowestMs: timings.at(-1) ?? null,
    fieldPercent: Object.fromEntries(fields.map((field) => [field, 100 * hits([field]) / results.length])),
  };
}
