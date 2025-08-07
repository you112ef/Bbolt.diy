import React from 'react';
import { Card } from '~/components/ui/Card';

const AIModelsTab = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-2">
          AI Models Management
        </h2>
        <p className="text-sm text-bolt-elements-textSecondary">
          Upload and manage local AI models for offline inference. This feature allows you to use AI models locally without internet connection.
        </p>
      </div>

      {/* Upload Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Upload AI Model</h3>
          
          <div className="border-2 border-dashed border-bolt-elements-borderColor rounded-lg p-8 text-center hover:border-bolt-elements-focus transition-colors">
            <div className="space-y-2">
              <div className="text-4xl">🧠</div>
              <div className="text-sm text-bolt-elements-textSecondary">
                Drag and drop AI model files here or click to browse
              </div>
              <div className="text-xs text-bolt-elements-textTertiary">
                Supports: .gguf, .bin, .safetensors, .onnx (max 10GB each)
              </div>
            </div>
          </div>
          
          <button className="w-full px-4 py-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-md hover:bg-bolt-elements-button-primary-backgroundHover transition-colors">
            Select Model Files
          </button>
        </div>
      </Card>

      {/* Models List */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Uploaded Models (0)</h3>
        
        <div className="text-center py-8 text-bolt-elements-textSecondary">
          <div className="text-4xl mb-2">📚</div>
          <p>No AI models uploaded yet</p>
          <p className="text-sm mt-1">Upload your first model to get started with offline AI inference</p>
        </div>
      </Card>

      {/* Model Usage Info */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-medium mb-2 text-blue-900 dark:text-blue-100">
          💡 How to Use Local AI Models
        </h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>• Upload GGUF, PyTorch, SafeTensors, or ONNX model files</p>
          <p>• Models will be processed and made available for chat</p>
          <p>• Local models work completely offline for privacy</p>
          <p>• Larger models (7B+) require more RAM and processing time</p>
          <p>• GGUF format is recommended for best performance</p>
        </div>
      </Card>
    </div>
  );
};

export default AIModelsTab;