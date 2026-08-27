import { fetch } from 'cross-fetch';

export interface VA3LMStatus {
  readonly name: string;
  readonly brain: string;
  readonly port: number;
  readonly agents: number;
  readonly approvalGate: boolean;
}

export interface VA3LMPromptResponse {
  readonly [key: string]: unknown;
}

export class VA3LMClient {
  constructor(private readonly baseUrl = 'http://127.0.0.1:8088') {}

  private url = (path: string) => `${this.baseUrl.replace(/\/$/, '')}${path}`;

  private getJson = async <T>(path: string): Promise<T> => {
    const response = await fetch(this.url(path));
    if (!response.ok) {
      throw new Error(`VA3LM request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  };

  private postText = async <T>(path: string, text: string): Promise<T> => {
    const response = await fetch(this.url(path), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      throw new Error(`VA3LM request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  };

  status = () => this.getJson<VA3LMStatus>('/api/status');
  agents = () => this.getJson<readonly unknown[]>('/api/agents');
  ontology = () => this.getJson<VA3LMPromptResponse>('/api/ontology');
  plan = (goal: string) => this.postText<VA3LMPromptResponse>('/api/plan', goal);
  brain = (prompt: string) =>
    this.postText<VA3LMPromptResponse>('/api/brain', prompt);
  explain = (subject: string) =>
    this.postText<VA3LMPromptResponse>('/api/explain', subject);
}
