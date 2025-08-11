interface Window {
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  webkitSpeechRecognition: typeof SpeechRecognition;
  SpeechRecognition: typeof SpeechRecognition;
}

interface Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

<<<<<<< HEAD
// Ambient module for Cloudflare Pages build output to satisfy TS during typecheck
declare module '../build/server' {
  const build: any;
  export = build;
}
=======
/*
 * Provide a global alias used across components for provider typing
 * Aligns UI usage with LLM provider info shape
 */
type UIProviderInfo = import('~/lib/modules/llm/types').ProviderInfo;
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
