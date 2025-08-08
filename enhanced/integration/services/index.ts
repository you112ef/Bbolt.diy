/**
 * Enhanced Features Integration Layer
 * 
 * This module provides seamless integration between enhanced features
 * and the original Bolt.diy project without breaking existing functionality
 */

import React from 'react';
import { atom } from 'nanostores';

// Enhanced features state
export const enhancedStore = atom({
  monacoEnabled: false,
  terminalEnabled: false,
  previewEnabled: false,
  aiAgentsEnabled: false,
  offlineAIEnabled: false,
});

// Lazy loading functions for enhanced features
export const loadEnhancedFeatures = {
  async monaco() {
    const { MonacoEditor } = await import('../../../editor/monaco/MonacoEditor');
    return MonacoEditor;
  },
  
  async terminal() {
    const { EnhancedTerminal } = await import('../../../terminal/xterm/EnhancedTerminal');
    return EnhancedTerminal;
  },
  
  async preview() {
    const { LivePreview } = await import('../../../preview/iframe/LivePreview');
    return LivePreview;
  },
  
  async aiAgents() {
    const { AIAgentsChat } = await import('../../../ai-agents/chat/AIAgentsChat');
    return AIAgentsChat;
  },
  
  async offlineAI() {
    const { OfflineAI } = await import('../../../models/providers/OfflineAI');
    return OfflineAI;
  },
};

// Integration hooks for React components
export const useEnhancedFeatures = () => {
  const [features, setFeatures] = React.useState(enhancedStore.get());
  
  React.useEffect(() => {
    const unsubscribe = enhancedStore.subscribe(setFeatures);
    return unsubscribe;
  }, []);
  
  const enableFeature = (feature: keyof typeof features) => {
    enhancedStore.set({ ...features, [feature]: true });
  };
  
  const disableFeature = (feature: keyof typeof features) => {
    enhancedStore.set({ ...features, [feature]: false });
  };
  
  return { features, enableFeature, disableFeature };
};

// Bridge for integrating with existing workbench
export const enhancedIntegration = {
  // Add enhanced editor to existing workbench
  async addMonacoEditor(container: HTMLElement) {
    const MonacoEditor = await loadEnhancedFeatures.monaco();
    const { createRoot } = await import('react-dom/client');

    const mount = document.createElement('div');
    mount.style.width = '100%';
    mount.style.height = '100%';
    container.appendChild(mount);

    const root = createRoot(mount);
    root.render(React.createElement(MonacoEditor, { height: '100%', width: '100%' }));

    return {
      unmount: () => {
        root.unmount();
        if (mount.parentNode) mount.parentNode.removeChild(mount);
      },
      container: mount,
    } as const;
  },
  
  // Add enhanced terminal
  async addEnhancedTerminal(container: HTMLElement) {
    const EnhancedTerminal = await loadEnhancedFeatures.terminal();
    const { createRoot } = await import('react-dom/client');

    const mount = document.createElement('div');
    mount.style.width = '100%';
    mount.style.height = '100%';
    container.appendChild(mount);

    const root = createRoot(mount);
    root.render(React.createElement(EnhancedTerminal, {}));

    return {
      unmount: () => {
        root.unmount();
        if (mount.parentNode) mount.parentNode.removeChild(mount);
      },
      container: mount,
    } as const;
  },
  
  // Add live preview
  async addLivePreview(container: HTMLElement) {
    const LivePreview = await loadEnhancedFeatures.preview();
    const { createRoot } = await import('react-dom/client');

    const mount = document.createElement('div');
    mount.style.width = '100%';
    mount.style.height = '100%';
    container.appendChild(mount);

    const root = createRoot(mount);
    root.render(React.createElement(LivePreview, {}));

    return {
      unmount: () => {
        root.unmount();
        if (mount.parentNode) mount.parentNode.removeChild(mount);
      },
      container: mount,
    } as const;
  },
  
  // Add AI agents chat
  async addAIAgents(container: HTMLElement) {
    const AIAgentsChat = await loadEnhancedFeatures.aiAgents();
    const { createRoot } = await import('react-dom/client');

    const mount = document.createElement('div');
    mount.style.width = '100%';
    mount.style.height = '100%';
    container.appendChild(mount);

    const root = createRoot(mount);
    root.render(React.createElement(AIAgentsChat, {}));

    return {
      unmount: () => {
        root.unmount();
        if (mount.parentNode) mount.parentNode.removeChild(mount);
      },
      container: mount,
    } as const;
  },
};

export default enhancedIntegration;