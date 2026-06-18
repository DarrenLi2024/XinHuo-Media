/**
 * DeepSeek V4 客户端封装
 *
 * 模型:
 *   - V4 Flash (deepseek-chat):   快速轻量，适合排座优化、数据摘要
 *   - V4 Pro   (deepseek-reasoner): 深度推理，适合复盘报告生成
 *
 * API Key 从服务端环境变量 DEEPSEEK_API_KEY 读取，
 * 绝不对前端暴露。
 */

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekCompletionRequest {
  model: DeepSeekModel;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface DeepSeekCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class DeepSeekClient {
  private getApiKey(): string {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key || key.trim().length === 0) {
      throw new Error('DEEPSEEK_API_KEY 未配置，请在 Vercel 环境变量中设置');
    }
    return key.trim();
  }

  /**
   * 验证 API Key 是否有效
   */
  async verifyKey(key: string): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await fetch(`${DEEPSEEK_BASE_URL}/models`, {
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      if (response.ok) {
        return { valid: true, message: 'API Key 验证成功' };
      }

      const body = await response.json().catch(() => ({}));
      if (response.status === 401) {
        return { valid: false, message: 'API Key 无效' };
      }
      return { valid: false, message: (body as { error?: { message?: string } }).error?.message || '验证失败' };
    } catch {
      return { valid: false, message: '网络连接失败，请检查网络' };
    }
  }

  /**
   * 检查是否已配置 API Key
   */
  isConfigured(): boolean {
    const key = process.env.DEEPSEEK_API_KEY;
    return Boolean(key && key.trim().length > 0);
  }

  /**
   * 发起对话补全请求
   */
  async chat(
    model: DeepSeekModel,
    messages: DeepSeekMessage[],
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<{ content: string; usage: { totalTokens: number } }> {
    const key = this.getApiKey();

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      } satisfies DeepSeekCompletionRequest),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMessage =
        (errorBody as { error?: { message?: string } }).error?.message ||
        `DeepSeek API 请求失败 (${response.status})`;
      throw new Error(errorMessage);
    }

    const data: DeepSeekCompletionResponse = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      usage: { totalTokens: data.usage?.total_tokens || 0 },
    };
  }

  /**
   * V4 Flash — 快速推理（排座优化、数据摘要）
   */
  async flash(prompt: string, system?: string): Promise<{ content: string; tokens: number }> {
    const messages: DeepSeekMessage[] = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const result = await this.chat('deepseek-chat', messages, { temperature: 0.3, maxTokens: 1000 });
    return { content: result.content, tokens: result.usage.totalTokens };
  }

  /**
   * V4 Pro — 深度推理（复盘报告）
   */
  async pro(prompt: string, system?: string): Promise<{ content: string; tokens: number }> {
    const messages: DeepSeekMessage[] = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const result = await this.chat('deepseek-reasoner', messages, { temperature: 0.5, maxTokens: 4000 });
    return { content: result.content, tokens: result.usage.totalTokens };
  }
}

export const deepseek = new DeepSeekClient();
