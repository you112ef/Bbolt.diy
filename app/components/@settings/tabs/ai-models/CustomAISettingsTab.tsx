import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function CustomAISettingsTab() {
  const [model, setModel] = useState<string>(localStorage.getItem('custom_ai_model') || 'gpt-4o-mini');
  const [prompt, setPrompt] = useState<string>(localStorage.getItem('custom_ai_system_prompt') || '');

  const save = () => {
    localStorage.setItem('custom_ai_model', model);
    localStorage.setItem('custom_ai_system_prompt', prompt);
    toast.success('AI customization saved');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-bolt-elements-textSecondary mb-1">Model ID</label>
        <input
          className="w-full px-3 py-2 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="e.g. gpt-4o-mini, gpt-4.1, llama3-70b, ..."
        />
      </div>

      <div>
        <label className="block text-sm text-bolt-elements-textSecondary mb-1">System Prompt</label>
        <textarea
          className="w-full px-3 py-2 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary min-h-[140px]"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Write a custom system prompt for the assistant..."
        />
      </div>

      <div className="flex justify-end">
        <button onClick={save} className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm">
          Save
        </button>
      </div>

      <p className="text-xs text-bolt-elements-textTertiary">
        Tip: This custom model and system prompt will be used as default in compatible areas.
      </p>
    </div>
  );
}