// apps/api/src/core/aiEngine.js
// Single shared AI layer — every module calls THIS, never a provider
// SDK directly. Three tiers, controlled by AI_PROVIDER in .env:
//
//   'rules'    (default, $0)  — deterministic logic per task, no network
//               call at all. This is enough for most of what's labeled
//               "AI" in the handbook — health scores, next-best-action,
//               even a first pass at campaign copy and descriptions.
//   'ollama'   ($0, needs a machine to run it) — a real local LLM via
//               Ollama, better quality than rules, still zero API cost.
//   'anthropic' (paid) — the Claude API, best quality, real per-call cost.
//
// Every task has a rule-based fallback registered — if 'ollama' or
// 'anthropic' fails or isn't configured, it falls back to rules rather
// than breaking (Commandment 10: never fake a result, but also never
// leave the person with nothing).
const db = require('../db/client');

const PROVIDER = process.env.AI_PROVIDER || 'rules';
const tasks = {}; // taskType -> { buildPrompt(context), ruleBased(context) }

function registerTask(taskType, { buildPrompt, ruleBased }) {
  tasks[taskType] = { buildPrompt, ruleBased };
}

async function callOllama(prompt) {
  const baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2';
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false })
  });
  if (!res.ok) throw new Error(`Ollama request failed: ${res.status}`);
  const data = await res.json();
  return data.response.trim();
}

async function callAnthropic(prompt) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.AI_API_KEY });
  const response = await client.messages.create({
    model: 'claude-sonnet-5', // introductory pricing through Aug 2026 — see docs.claude.com for current rates
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  });
  return response.content[0].text.trim();
}

/**
 * generate() — the one function every module uses for AI-labeled output.
 * @param {string} taskType   must match a registerTask() call
 * @param {object} context    whatever the task's buildPrompt/ruleBased need
 * @param {string} cacheKey   unique per input (e.g. `next_best_action:${customerId}`)
 * @param {number} cacheMinutes  how long to reuse a cached result
 */
async function generate(taskType, context, cacheKey, cacheMinutes = 60) {
  const task = tasks[taskType];
  if (!task) throw new Error(`Unknown AI task type: ${taskType}. Register it with registerTask() first.`);

  const cached = await db('ai_cache').where({ cache_key: cacheKey }).first();
  if (cached && new Date(cached.expires_at) > new Date()) {
    return { text: cached.result, provider: cached.provider, failed: false };
  }

  let result, provider = 'rules';

  if (PROVIDER === 'ollama') {
    try {
      result = await callOllama(task.buildPrompt(context));
      provider = 'ollama';
    } catch (err) {
      result = task.ruleBased(context);
      provider = 'rules-fallback';
    }
  } else if (PROVIDER === 'anthropic') {
    try {
      result = await callAnthropic(task.buildPrompt(context));
      provider = 'anthropic';
    } catch (err) {
      result = task.ruleBased(context);
      provider = 'rules-fallback';
    }
  } else {
    result = task.ruleBased(context); // default — zero cost, no network call
  }

  const expiresAt = new Date(Date.now() + cacheMinutes * 60000);
  await db('ai_cache')
    .insert({ cache_key: cacheKey, result, provider, expires_at: expiresAt })
    .onConflict('cache_key')
    .merge({ result, provider, expires_at: expiresAt });

  return { text: result, provider, failed: false };
}

module.exports = { generate, registerTask };
