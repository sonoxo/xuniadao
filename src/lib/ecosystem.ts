export type XuniaLayerId =
  | 'xunia'
  | 'zyra'
  | 'sonoxo'
  | 'almighty-sonoxo'
  | 'va3lm'
  | 'gpt-uap-xo';

export interface XuniaLayer {
  readonly id: XuniaLayerId;
  readonly name: string;
  readonly role: string;
  readonly repository: string;
  readonly runtime?: string;
  readonly visibility?: 'PUBLIC' | 'PRIVATE';
  readonly status: 'ACTIVE' | 'EMBEDDED';
}

export interface TechnologyIntelligenceLayer {
  readonly provider: string;
  readonly capability: string;
  readonly relationship:
    | 'INTEGRATION_READY'
    | 'ARCHITECTURE_ALIGNED'
    | 'MODEL_COMPATIBLE';
}

export const GLASS_ONION = {
  codename: 'GLASS ONION',
  umbrella: 'XUNIA',
  version: '1.3.0',
  leadership: {
    role: 'Founder / Ecosystem Lead',
    credentialAreas: [
      'Anthropic / Claude',
      'Google',
      'Palantir',
      'IBM / Red Hat',
      'AWS',
    ],
    statement:
      'XUNIA is led by a founder with certifications and credentials spanning these technology ecosystems.',
  },
  layers: [
    {
      id: 'xunia',
      name: 'XUNIA / XuniaDAO',
      role: 'ecosystem registry, DAO metadata, integration and governance data layer',
      repository: 'https://github.com/sonoxo/xuniadao',
      visibility: 'PUBLIC',
      status: 'ACTIVE',
    },
    {
      id: 'zyra',
      name: 'ZYRA',
      role: 'agentic orchestration, workflows, command routing and bounded execution',
      repository: 'https://github.com/sonoxo/zyra',
      visibility: 'PUBLIC',
      status: 'ACTIVE',
    },
    {
      id: 'sonoxo',
      name: 'SONOXO / GPT-DOUG-LLM',
      role: 'local model brain, intelligence ontology, defensive automation and agent runtime',
      repository: 'https://github.com/sonoxo/gpt-doug-llm',
      visibility: 'PUBLIC',
      status: 'ACTIVE',
    },
    {
      id: 'almighty-sonoxo',
      name: 'AlmightySonoxo',
      role: 'creative, media and public-facing ecosystem layer',
      repository: 'https://github.com/sonoxo/AlmightySonoxo',
      visibility: 'PUBLIC',
      status: 'ACTIVE',
    },
    {
      id: 'va3lm',
      name: 'VA3LM',
      role: 'Virginia Agentic Large Learning Language Model coding and programming command center',
      repository: 'https://github.com/sonoxo/gpt-doug-llm/tree/main/va3lm',
      runtime: 'http://127.0.0.1:8088',
      visibility: 'PUBLIC',
      status: 'EMBEDDED',
    },
    {
      id: 'gpt-uap-xo',
      name: 'GPT-UAP-XO',
      role: 'private terminal-first local agent runtime for chat, tools, memory, APIs and bounded parallel workers',
      repository: 'https://github.com/sonoxo/gpt-uap-xo',
      visibility: 'PRIVATE',
      status: 'ACTIVE',
    },
  ] as readonly XuniaLayer[],
  technologyIntelligence: [
    {
      provider: 'Anthropic / Claude',
      capability: 'model-provider and agent reasoning interoperability',
      relationship: 'MODEL_COMPATIBLE',
    },
    {
      provider: 'Google',
      capability: 'cloud, AI, data and developer-platform integration targets',
      relationship: 'INTEGRATION_READY',
    },
    {
      provider: 'Palantir',
      capability: 'ontology, workflow and action-model architecture alignment',
      relationship: 'ARCHITECTURE_ALIGNED',
    },
    {
      provider: 'IBM / Red Hat',
      capability: 'enterprise Linux, hybrid-cloud and governance integration targets',
      relationship: 'INTEGRATION_READY',
    },
    {
      provider: 'AWS',
      capability: 'cloud runtime, storage, identity and managed-service integration targets',
      relationship: 'INTEGRATION_READY',
    },
  ] as readonly TechnologyIntelligenceLayer[],
  affiliationBoundary:
    'Leadership certifications and technology compatibility do not by themselves imply sponsorship, investment, partnership, endorsement, or government affiliation.',
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
