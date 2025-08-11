import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { saveLocalModel, listLocalModels, removeLocalModel, type LocalModelEntry } from '~/lib/localModels';

export default function CustomAISettingsTab() {
  const [model, setModel] = useState<string>(localStorage.getItem('custom_ai_model') || 'gpt-4o-mini');
  const [prompt, setPrompt] = useState<string>(localStorage.getItem('custom_ai_system_prompt') || '');
  const [localModels, setLocalModels] = useState<LocalModelEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const refreshLocalModels = async () => {
    const items = await listLocalModels();
    setLocalModels(items);
  };

  React.useEffect(() => {
    refreshLocalModels();
  }, []);

  const save = () => {
    localStorage.setItem('custom_ai_model', model);
    localStorage.setItem('custom_ai_system_prompt', prompt);
    toast.success('AI customization saved');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setIsSaving(true);

    try {
      await saveLocalModel(file);
      await refreshLocalModels();
      toast.success('Local model saved');
    } catch (err) {
      toast.error('Failed to save local model');
    } finally {
      setIsSaving(false);
      e.target.value = '';
    }
  };

  const handleRemove = async (id: string) => {
    await removeLocalModel(id);
    await refreshLocalModels();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-bolt-elements-textPrimary">Default Model & System Prompt</h3>
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

          <div className="flex gap-2 justify-end">
            <button onClick={save} className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm">
              Save
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-bolt-elements-textPrimary">Local Offline Model</h3>
          <p className="text-xs text-bolt-elements-textTertiary">
            Upload a local model file (e.g. GGUF/ONNX) to run offline.
          </p>
          <input
            type="file"
            onChange={handleUpload}
            accept=".gguf,.onnx,.bin,.pt,.safetensors,.zip,.tar,.gz"
            disabled={isSaving}
          />

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-bolt-elements-textSecondary">Saved Models</h4>
            {localModels.length === 0 ? (
              <div className="text-xs text-bolt-elements-textTertiary">No local models yet</div>
            ) : (
              <ul className="space-y-2">
                {localModels.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded border border-bolt-elements-borderColor"
                  >
                    <div className="text-xs">
                      <div className="font-medium text-bolt-elements-textPrimary">{m.name}</div>
                      <div className="text-bolt-elements-textTertiary">{(m.size / (1024 * 1024)).toFixed(1)} MB</div>
                    </div>
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-bolt-elements-textPrimary">Free Provider Integrations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <a
            href="/auth/vercel?mode=start"
            className="p-3 rounded-lg border border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-2 flex items-center gap-2"
          >
            <span className="i-ph:rocket w-4 h-4 text-yellow-500" /> Connect Vercel (Hobby)
          </a>
          <a
            href="/auth/netlify?mode=start"
            className="p-3 rounded-lg border border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-2 flex items-center gap-2"
          >
            <span className="i-ph:cloud w-4 h-4 text-yellow-500" /> Connect Netlify (Free tier)
          </a>
          <a
            href="/auth/github?mode=start"
            className="p-3 rounded-lg border border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-2 flex items-center gap-2"
          >
            <span className="i-ph:github-logo w-4 h-4 text-yellow-500" /> Connect GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
