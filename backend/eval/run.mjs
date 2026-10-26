import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { extractOrders } from '../src/extract-orders.mjs';
import { fixtures } from './fixtures.mjs';
import { scoreCase, summarize } from './score.mjs';
import { buildOfflineReport, classifyProviderFailure, getMissingProviderConfig } from './provider-status.mjs';

const requestedProvider = process.argv.find((arg) => arg.startsWith('--provider='))?.split('=')[1];
const requestedLimit = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] ?? fixtures.length);
const strictLive = process.argv.includes('--strict-live') || process.env.STRICT_LIVE_EVAL === 'true';
const offlineMode = ['mock', 'local'].includes(requestedProvider) || process.env.USE_LIVE_PROVIDER === 'false';
if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > fixtures.length) {
  console.error(`Limit must be between 1 and ${fixtures.length}.`);
  process.exit(2);
}
if (requestedProvider && !['gemini', 'cloudflare', 'mock', 'local'].includes(requestedProvider)) {
  console.error('Image-first evaluation supports gemini, cloudflare, mock, or local.');
  process.exit(2);
}
const providers = requestedProvider ? [requestedProvider] : ['gemini', 'cloudflare'];
const folder = join(dirname(fileURLToPath(import.meta.url)), 'generated');
const selectedFixtures = fixtures.slice(0, requestedLimit);
const report = { measuredAt: new Date().toISOString(), fixtureCount: selectedFixtures.length, providers: {} };

if (offlineMode) {
  const providerName = requestedProvider ?? 'mock';
  const offlineReport = buildOfflineReport({ provider: providerName, fixtures: selectedFixtures, mode: providerName, reason: 'Live provider unavailable. Running offline mock evaluation.' });
  report.providers[providerName] = offlineReport;
  console.log(`${providerName}: status offline (mock mode); overall ${offlineReport.overallPercent.toFixed(1)}%, key ${offlineReport.keyPercent.toFixed(1)}%, guessed ${offlineReport.guessedValues}, failed/invalid ${offlineReport.failedOrInvalid}`);
  await writeFile(join(folder, `results-${providerName}.json`), JSON.stringify(report, null, 2));
  process.exitCode = 0;
} else {
  const credentials = {
    gemini: [['GEMINI_API_KEY', process.env.GEMINI_API_KEY]],
    cloudflare: [['CLOUDFLARE_ACCOUNT_ID', process.env.CLOUDFLARE_ACCOUNT_ID], ['CLOUDFLARE_AUTH_TOKEN', process.env.CLOUDFLARE_AUTH_TOKEN]],
  };
  const missing = providers.flatMap((provider) => (credentials[provider] ?? [])
    .filter(([, value]) => !value).map(([name]) => name));

  if (missing.length) {
    const status = { status: 'blocked', category: 'missing_credentials', message: `Live evaluation requires ${missing.join(', ')}. Task 1 is blocked until provider access is configured.` };
    for (const provider of providers) {
      const offlineReport = buildOfflineReport({ provider, fixtures: selectedFixtures, mode: 'mock', reason: status.message });
      report.providers[provider] = { ...offlineReport, status: status.status, category: status.category, reason: status.message };
      console.log(`${provider}: status blocked; ${status.message}`);
    }
    await writeFile(join(folder, `results-${providers.join('-')}.json`), JSON.stringify(report, null, 2));
    process.exitCode = 0;
  } else {
    for (const provider of providers) {
      const results = [];
      for (const fixture of selectedFixtures) {
        const image = await readFile(join(folder, `${fixture.id}.png`));
        const start = performance.now();
        try {
          const actual = await extractOrders({ images: [image] }, { provider });
          const durationMs = Math.round(performance.now() - start);
          const score = scoreCase(fixture.expected, actual);
          results.push({ id: fixture.id, durationMs, score, actual, status: 'ok' });
        } catch (error) {
          const durationMs = Math.round(performance.now() - start);
          const classification = classifyProviderFailure(error, provider, process.env);
          const score = scoreCase(fixture.expected, null);
          results.push({ id: fixture.id, durationMs, score, error: error.message, status: classification.status, category: classification.category, reason: classification.message });
        }
      }
      report.providers[provider] = { ...summarize(results), casesDetail: results };
      const { overallPercent, keyPercent, guessedValues, failedOrInvalid, medianMs, slowestMs } = report.providers[provider];
      console.log(`${provider}: overall ${overallPercent.toFixed(1)}%, key ${keyPercent.toFixed(1)}%, guessed ${guessedValues}, failed/invalid ${failedOrInvalid}, median ${medianMs}ms, slowest ${slowestMs}ms`);
      const blocked = results.some((entry) => entry.status === 'blocked');
      if (blocked) {
        console.log(`${provider}: status blocked; live provider rejected the request, so Task 1 remains external-blocked.`);
      }
    }
    await writeFile(join(folder, `results-${providers.join('-')}.json`), JSON.stringify(report, null, 2));
    if (strictLive && Object.values(report.providers).some((p) => p.overallPercent < 70 || p.keyPercent < 80 || p.failedOrInvalid > 0)) {
      console.error('Live evaluation did not clear the rethink lines or had failed/invalid responses.');
      process.exitCode = 1;
    } else {
      process.exitCode = 0;
    }
  }
}
