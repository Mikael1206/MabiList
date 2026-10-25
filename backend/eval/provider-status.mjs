import { scoreCase, summarize } from './score.mjs';

export const providerCredentialMap = {
  gemini: ['GEMINI_API_KEY'],
  cloudflare: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_AUTH_TOKEN'],
  huggingface: ['HF_TOKEN'],
  ollama: [],
};

export function getMissingProviderConfig(provider, env = process.env) {
  const credentials = providerCredentialMap[provider] ?? [];
  return credentials.filter((name) => !env?.[name]);
}

export function classifyProviderFailure(error, provider, env = process.env) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const missing = getMissingProviderConfig(provider, env);

  if (missing.length > 0) {
    return {
      status: 'blocked',
      category: 'missing_credentials',
      message: `Missing ${missing.join(', ')} for ${provider}.`,
    };
  }

  if (/HTTP 402|402|billing|credits|payment|subscription/i.test(message)) {
    return {
      status: 'blocked',
      category: 'quota_or_billing',
      message: `Provider ${provider} rejected the request because billing or credits are unavailable.`,
    };
  }

  if (/HTTP 429|429|quota|rate limit|too many requests|high demand|limit reached/i.test(message)) {
    return {
      status: 'blocked',
      category: 'quota_or_rate_limit',
      message: `Provider ${provider} is rate-limited or quota-exhausted.`,
    };
  }

  if (/HTTP 500|503|internal error|internal_error|temporar|upstream.*error/i.test(message)) {
    return {
      status: 'blocked',
      category: 'provider_error',
      message: `Provider ${provider} returned an upstream error and cannot complete the evaluation.`,
    };
  }

  if (/invalid json|json.*invalid|provider returned invalid json|malformed/i.test(message)) {
    return {
      status: 'failed_case',
      category: 'malformed_output',
      message: `Provider ${provider} returned malformed JSON.`,
    };
  }

  return {
    status: 'failed_case',
    category: 'provider_failed',
    message: `Provider ${provider} failed the evaluation: ${message}`,
  };
}

export function buildOfflineReport({ provider, fixtures, mode = 'mock', reason = 'Live provider unavailable' }) {
  const cases = fixtures.map((fixture) => {
    const score = scoreCase(fixture.expected, null);
    return {
      id: fixture.id,
      durationMs: 0,
      score,
      error: `${mode} mode: ${reason}`,
    };
  });

  const summary = summarize(cases);
  return {
    measuredAt: new Date().toISOString(),
    status: 'offline',
    mode,
    provider,
    fixtureCount: fixtures.length,
    ...summary,
    casesDetail: cases,
  };
}
