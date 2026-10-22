import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { extractOrders } from '../src/extract-orders.mjs';
import { fixtures } from './fixtures.mjs';
import { scoreCase, summarize } from './score.mjs';

const requestedProvider = process.argv.find((arg) => arg.startsWith('--provider='))?.split('=')[1];
const requestedLimit = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] ?? fixtures.length);
if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > fixtures.length) {
  console.error(`Limit must be between 1 and ${fixtures.length}.`);
  process.exit(2);
}
if (requestedProvider && !['gemini', 'cloudflare'].includes(requestedProvider)) {
  console.error('Image-first evaluation supports gemini or cloudflare.');
  process.exit(2);
}
const providers = requestedProvider ? [requestedProvider] : ['gemini', 'cloudflare'];
const credentials = {
  gemini: [['GEMINI_API_KEY', process.env.GEMINI_API_KEY]],
  cloudflare: [['CLOUDFLARE_ACCOUNT_ID', process.env.CLOUDFLARE_ACCOUNT_ID], ['CLOUDFLARE_AUTH_TOKEN', process.env.CLOUDFLARE_AUTH_TOKEN]],
};
const missing = providers.flatMap((provider) => credentials[provider]
  .filter(([, value]) => !value).map(([name]) => name));
if (missing.length) {
  console.error(`Live evaluation requires ${missing.join(', ')}. No provider scores were measured.`);
  process.exit(2);
}

const folder = join(dirname(fileURLToPath(import.meta.url)), 'generated');
const selectedFixtures = fixtures.slice(0, requestedLimit);
const report = { measuredAt: new Date().toISOString(), fixtureCount: selectedFixtures.length, providers: {} };
for (const provider of providers) {
  const results = [];
  for (const fixture of selectedFixtures) {
    const image = await readFile(join(folder, `${fixture.id}.png`));
    const start = performance.now();
    try {
      const actual = await extractOrders({ images: [image] }, { provider });
      const durationMs = Math.round(performance.now() - start);
      const score = scoreCase(fixture.expected, actual);
      results.push({ id: fixture.id, durationMs, score, actual });
    } catch (error) {
      const durationMs = Math.round(performance.now() - start);
      const score = scoreCase(fixture.expected, null);
      results.push({ id: fixture.id, durationMs, score, error: error.message });
    }
  }
  report.providers[provider] = { ...summarize(results), casesDetail: results };
  const { overallPercent, keyPercent, guessedValues, failedOrInvalid, medianMs, slowestMs } = report.providers[provider];
  console.log(`${provider}: overall ${overallPercent.toFixed(1)}%, key ${keyPercent.toFixed(1)}%, guessed ${guessedValues}, failed/invalid ${failedOrInvalid}, median ${medianMs}ms, slowest ${slowestMs}ms`);
}
await writeFile(join(folder, `results-${providers.join('-')}.json`), JSON.stringify(report, null, 2));
if (Object.values(report.providers).some((p) => p.overallPercent < 70 || p.keyPercent < 80 || p.failedOrInvalid > 0)) {
  console.error('Evaluation did not clear the rethink lines or had failed/invalid responses.');
  process.exitCode = 1;
}
