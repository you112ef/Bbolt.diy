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

// Provide a global alias used across components for provider typing
// Aligns UI usage with LLM provider info shape
type UIProviderInfo = import('~/lib/modules/llm/types').ProviderInfo;
