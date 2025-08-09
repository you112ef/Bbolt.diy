export interface Feature {
  id: string;
  name: string;
  description: string;
  viewed: boolean;
  releaseDate: string;
}

const FEATURES_BASE = (import.meta as any).env?.FEATURES_API_BASE || '';

export const getFeatureFlags = async (): Promise<Feature[]> => {
  if (!FEATURES_BASE) {
    return [];
  }

  const res = await fetch(`${String(FEATURES_BASE).replace(/\/$/, '')}/features`, {
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch features: ${res.status}`);
  }

  const data = (await res.json()) as Feature[];
  return data;
};

export const markFeatureViewed = async (featureId: string): Promise<void> => {
  if (!FEATURES_BASE) return;
  await fetch(`${String(FEATURES_BASE).replace(/\/$/, '')}/features/${encodeURIComponent(featureId)}/viewed`, {
    method: 'POST',
  });
};
