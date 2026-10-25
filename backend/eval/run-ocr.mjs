import { access, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { extractOrders } from '../src/extract-orders.mjs';
import { fixtures } from './fixtures.mjs';
import { scoreCase, summarize } from './score.mjs';
import { characterAccuracy, checkOcrAvailable, readScreenshot } from './ocr.mjs';
import { buildOfflineReport, classifyProviderFailure, getMissingProviderConfig } from './provider-status.mjs';

const provider = process.argv.find((arg) => arg.startsWith('--provider='))?.split('=')[1] ?? 'gemini';
const strictLive = process.argv.includes('--strict-live') || process.env.STRICT_LIVE_EVAL === 'true';
const offlineMode = ['mock', 'local'].includes(provider) || process.env.USE_LIVE_PROVIDER === 'false';
const providerModels = {
  cloudflare: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  huggingface: 'Qwen/Qwen3-8B',
  ollama: 'llama3.2:3b',
};
const limit = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] ?? fixtures.length);
if (!['gemini', 'cloudflare', 'huggingface', 'ollama', 'mock', 'local'].includes(provider) || !Number.isInteger(limit) || limit < 1 || limit > fixtures.length) {
  console.error(`Use --provider=gemini|cloudflare|huggingface|ollama|mock|local and --limit=1..${fixtures.length}.`);
  process.exit(2);
}
const folder = join(dirname(fileURLToPath(import.meta.url)), 'generated');
const selected = fixtures.slice(0, limit);

if (offlineMode) {
  const offlineReport = buildOfflineReport({ provider, fixtures: selected, mode: provider, reason: 'Live provider unavailable. Running offline OCR evaluation.' });
  await writeFile(join(folder, `results-ocr-${provider}.json`), JSON.stringify({ ...offlineReport, method: 'offline-mock', provider }, null, 2));
  console.log(`ocr + ${provider}: status offline; OCR ${offlineReport.ocrMeanPercent?.toFixed(1) ?? 'n/a'}% mean character accuracy; orders ${offlineReport.overallPercent.toFixed(1)}% overall, ${offlineReport.keyPercent.toFixed(1)}% key, guessed ${offlineReport.guessedValues}, failed/invalid ${offlineReport.failedOrInvalid}`);
  process.exitCode = 0;
} else {
  const missing = getMissingProviderConfig(provider, process.env);
  if (missing.length) {
    const status = { status: 'blocked', category: 'missing_credentials', message: `OCR evaluation requires ${missing.join(', ')}. Task 1 remains blocked until the live provider is configured.` };
    const offlineReport = buildOfflineReport({ provider, fixtures: selected, mode: 'mock', reason: status.message });
    await writeFile(join(folder, `results-ocr-${provider}.json`), JSON.stringify({ ...offlineReport, method: 'tesseract-then-text-extraction', provider, status: status.status, category: status.category, reason: status.message }, null, 2));
    console.log(`ocr + ${provider}: status blocked; ${status.message}`);
    process.exitCode = 0;
  } else {
    try {
      await checkOcrAvailable();
      await Promise.all(selected.map((fixture) => access(join(folder, `${fixture.id}.png`))));
    } catch (error) {
      console.error(`${error.message}. Run npm run eval:fixtures and install Tesseract OCR before evaluating.`);
      process.exit(2);
    }
    const results = [];
    for (const fixture of selected) {
      const path = join(folder, `${fixture.id}.png`);
      const start = performance.now();
      let ocrMs;
      let ocrPercent;
      let transcript;
      try {
        transcript = await readScreenshot(path);
        ocrMs = Math.round(performance.now() - start);
        const reference = fixture.messages.join(' ');
        ocrPercent = characterAccuracy(reference, transcript);
        const actual = await extractOrders({ text: transcript }, {
          provider,
          ...(providerModels[provider] ? {
            cloudflareModel: providerModels[provider],
            huggingFaceModel: providerModels[provider],
            ollamaModel: providerModels[provider],
          } : {}),
        });
        const durationMs = Math.round(performance.now() - start);
        results.push({ id: fixture.id, durationMs, ocrMs, ocrPercent, transcript,
          score: scoreCase(fixture.expected, actual), actual, status: 'ok' });
      } catch (error) {
        const classification = classifyProviderFailure(error, provider, process.env);
        const durationMs = Math.round(performance.now() - start);
        results.push({ id: fixture.id, durationMs, ocrMs: ocrMs ?? null, ocrPercent: ocrPercent ?? null, transcript: transcript ?? null,
          score: scoreCase(fixture.expected, null), error: error.message, status: classification.status, category: classification.category, reason: classification.message });
      }
    }
    const summary = summarize(results);
    const ocrScores = results.filter((result) => Number.isFinite(result.ocrPercent));
    summary.ocrMeanPercent = ocrScores.length
      ? ocrScores.reduce((sum, result) => sum + result.ocrPercent, 0) / ocrScores.length : null;
    summary.ocrFailures = results.filter((result) => result.transcript === null).length;
    const report = { measuredAt: new Date().toISOString(), method: 'tesseract-then-text-extraction',
      provider, ...(providerModels[provider] ? { model: providerModels[provider] } : {}),
      fixtureCount: selected.length, ...summary, casesDetail: results };
    await writeFile(join(folder, `results-ocr-${provider}.json`), JSON.stringify(report, null, 2));
    console.log(`ocr + ${provider}${providerModels[provider] ? ` (${providerModels[provider]})` : ''}: OCR ${summary.ocrMeanPercent?.toFixed(1) ?? 'n/a'}% mean character accuracy, OCR failures ${summary.ocrFailures}; orders ${summary.overallPercent.toFixed(1)}% overall, ${summary.keyPercent.toFixed(1)}% key, guessed ${summary.guessedValues}, failed/invalid ${summary.failedOrInvalid}, median ${summary.medianMs}ms, slowest ${summary.slowestMs}ms`);
    const blocked = results.some((entry) => entry.status === 'blocked');
    if (blocked) {
      console.log(`${provider}: status blocked; live provider rejected the request, so Task 1 remains external-blocked.`);
    }
    if (strictLive && (summary.overallPercent < 70 || summary.keyPercent < 80 || summary.failedOrInvalid > 0)) {
      console.error('Evaluation did not clear the rethink lines or had failed/invalid responses.');
      process.exitCode = 1;
    } else {
      process.exitCode = 0;
    }
  }
}
