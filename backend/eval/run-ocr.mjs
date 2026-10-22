import { access, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { extractOrders } from '../src/extract-orders.mjs';
import { fixtures } from './fixtures.mjs';
import { scoreCase, summarize } from './score.mjs';
import { characterAccuracy, checkOcrAvailable, readScreenshot } from './ocr.mjs';

const provider = process.argv.find((arg) => arg.startsWith('--provider='))?.split('=')[1] ?? 'gemini';
const providerModels = {
  cloudflare: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  huggingface: 'Qwen/Qwen3-8B',
};
const limit = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] ?? fixtures.length);
if (!['gemini', 'cloudflare', 'huggingface'].includes(provider) || !Number.isInteger(limit) || limit < 1 || limit > fixtures.length) {
  console.error(`Use --provider=gemini|cloudflare|huggingface and --limit=1..${fixtures.length}.`);
  process.exit(2);
}
const credentials = {
  gemini: ['GEMINI_API_KEY'],
  cloudflare: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_AUTH_TOKEN'],
  huggingface: ['HF_TOKEN'],
}[provider];
const missing = credentials.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`OCR evaluation requires ${missing.join(', ')}. No scores were measured.`);
  process.exit(2);
}
const folder = join(dirname(fileURLToPath(import.meta.url)), 'generated');
const selected = fixtures.slice(0, limit);
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
      provider, ...(providerModels[provider] ? { cloudflareModel: providerModels[provider], huggingFaceModel: providerModels[provider] } : {}),
    });
    const durationMs = Math.round(performance.now() - start);
    results.push({ id: fixture.id, durationMs, ocrMs, ocrPercent, transcript,
      score: scoreCase(fixture.expected, actual), actual });
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    results.push({ id: fixture.id, durationMs, ocrMs: ocrMs ?? null, ocrPercent: ocrPercent ?? null, transcript: transcript ?? null,
      score: scoreCase(fixture.expected, null), error: error.message });
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
if (summary.overallPercent < 70 || summary.keyPercent < 80 || summary.failedOrInvalid > 0) {
  console.error('Evaluation did not clear the rethink lines or had failed/invalid responses.');
  process.exitCode = 1;
}
