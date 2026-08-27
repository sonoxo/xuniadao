export type XuniaLayerId =
  | 'xunia'
  | 'zyra'
  | 'sonoxo'
  | 'almighty-sonoxo'
  | 'va3lm';

export interface XuniaLayer {
  readonly id: XuniaLayerId;
  readonly name: string;
  readonly role: string;
  readonly repository: string;
  readonly runtime?: string;
  readonly status: 'ACTIVE' | 'EMBEDDED';
}

export const GLASS_ONION = {
  codename: 'GLASS ONION',
  umbrella: 'XUNIA',
  version: '1.0.0',
  layers: [
    {
      id: 'xunia',
      name: 'XUNIA / XuniaDAO',
      role: 'ecosystem registry, DAO metadata, integration and governance data layer',
      repository: 'https://github.com/sonoxo/xuniadao',
      status: 'ACTIVE',
    },
    {
      id: 'zyra',
      name: 'ZYRA',
      role: 'agentic orchestration, workflows, command routing and bounded execution',
      repository: 'https://github.com/sonoxo/zyra',
      status: 'ACTIVE',
    },
    {
      id: 'sonoxo',
      name: 'SONOXO / GPT-DOUG-LLM',
      role: 'local model brain, intelligence ontology, defensive automation and agent runtime',
      repository: 'https://github.com/sonoxo/gpt-doug-llm',
      status: 'ACTIVE',
    },
    {
      id: 'almighty-sonoxo',
      name: 'AlmightySonoxo',
      role: 'creative, media and public-facing ecosystem layer',
      repository: 'https://github.com/sonoxo/AlmightySonoxo',
      status: 'ACTIVE',
    },
    {
      id: 'va3lm',
      name: 'VA3LM',
      role: 'Virginia Agentic Large Learning Language Model coding and programming command center',
      repository: 'https://github.com/sonoxo/gpt-doug-llm/tree/main/va3lm',
      runtime: 'http://127.0.0.1:8088',
      status: 'EMBEDDED',
    },
  ] as readonly XuniaLayer[],
  rules: {
    humanApprovalForMutation: true,
    automaticFundMovement: false,
    automaticGovernanceVoting: false,
    arbitraryRemoteShell: false,
    provenanceRequired: true,
  },
} as const;

export const getXuniaLayer = (id: XuniaLayerId): XuniaLayer | undefined =>
  GLASS_ONION.layers.find((layer) => layer.id === id);
