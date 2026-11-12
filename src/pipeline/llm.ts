// Optional script writer / fact validator. Provider-agnostic; nothing here runs without a key.
import {config, env, fetchRetry, okJson, PipelineError} from './lib.ts';

type AiCfg = {anthropic: {model: string; maxTokens: number}; openai: {model: string; maxTokens: number}};
export const llmProvider = (): 'anthropic' | 'openai' | null =>
  env('ANTHROPIC_API_KEY') ? 'anthropic' : env('OPENAI_API_KEY') ? 'openai' : null;

export const callLLM = async (system: string, user: string): Promise<string> => {
  const cfg = config<AiCfg>('ai');
  const provider = llmProvider();
  if (provider === 'anthropic') {
    const res = await fetchRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json'},
      body: JSON.stringify({model: env('LLM_MODEL') || cfg.anthropic.model, max_tokens: cfg.anthropic.maxTokens, system, messages: [{role: 'user', content: user}]}),
    }, {stage: 'llm', retries: 3, timeoutMs: 180_000});
    const j = await okJson<{content: {type: string; text?: string}[]}>(res, 'llm');
    return j.content.filter((c) => c.type === 'text').map((c) => c.text).join('');
  }
  if (provider === 'openai') {
    const model = env('OPENAI_MODEL') || env('LLM_MODEL') || cfg.openai.model;
    if (!model) throw new PipelineError('llm', 'OPENAI_MODEL variable is not set');
    const res = await fetchRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {authorization: `Bearer ${env('OPENAI_API_KEY')}`, 'content-type': 'application/json'},
      body: JSON.stringify({model, messages: [{role: 'system', content: system}, {role: 'user', content: user}], response_format: {type: 'json_object'}}),
    }, {stage: 'llm', retries: 3, timeoutMs: 180_000});
    const j = await okJson<{choices: {message: {content: string}}[]}>(res, 'llm');
    return j.choices[0]?.message?.content ?? '';
  }
  throw new PipelineError('llm', 'no LLM key configured');
};

export const extractJson = <T>(text: string): T => {
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b <= a) throw new PipelineError('llm', 'model did not return JSON');
  return JSON.parse(text.slice(a, b + 1)) as T;
};
