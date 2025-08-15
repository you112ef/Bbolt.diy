import { atom } from 'nanostores';

export interface AIExtensionSettings {
  useMonacoEditor: boolean;
  aiAssistantEnabled: boolean;
  localAIEnabled: boolean;
  agentPreferences: {
    defaultAgent: 'general' | 'explainer' | 'fixer' | 'optimizer' | 'tester' | 'docs';
    temperature: number;
    maxTokens: number;
  };
}

const defaultSettings: AIExtensionSettings = {
  useMonacoEditor: false,
  aiAssistantEnabled: true, 
  localAIEnabled: true,
  agentPreferences: {
    defaultAgent: 'general',
    temperature: 0.7,
    maxTokens: 2048,
  },
};

// Load settings from localStorage
const loadSettings = (): AIExtensionSettings => {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  try {
    const stored = localStorage.getItem('bolt_ai_extensions');
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

// Save settings to localStorage
const saveSettings = (settings: AIExtensionSettings) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('bolt_ai_extensions', JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save AI extension settings:', error);
  }
};

export const aiExtensionStore = atom<AIExtensionSettings>(loadSettings());

// Actions
export const setUseMonacoEditor = (enabled: boolean) => {
  const current = aiExtensionStore.get();
  const updated = { ...current, useMonacoEditor: enabled };
  aiExtensionStore.set(updated);
  saveSettings(updated);
};

export const setAIAssistantEnabled = (enabled: boolean) => {
  const current = aiExtensionStore.get();
  const updated = { ...current, aiAssistantEnabled: enabled };
  aiExtensionStore.set(updated);
  saveSettings(updated);
};

export const setLocalAIEnabled = (enabled: boolean) => {
  const current = aiExtensionStore.get();
  const updated = { ...current, localAIEnabled: enabled };
  aiExtensionStore.set(updated);
  saveSettings(updated);
};

export const updateAgentPreferences = (preferences: Partial<AIExtensionSettings['agentPreferences']>) => {
  const current = aiExtensionStore.get();
  const updated = {
    ...current,
    agentPreferences: { ...current.agentPreferences, ...preferences },
  };
  aiExtensionStore.set(updated);
  saveSettings(updated);
};