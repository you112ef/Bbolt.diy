export interface Feature {
  id: string;
  name: string;
  description: string;
  viewed: boolean;
  releaseDate: string;
}

export const getFeatureFlags = async (): Promise<Feature[]> => {
  try {
    // Try to fetch from a real features manifest if served by the app
    const res = await fetch('/features.json', { cache: 'no-store' });
    if (res.ok) {
      const features = (await res.json()) as Feature[];

      // Merge viewed state from localStorage (client-side only)
      if (typeof window !== 'undefined') {
        const viewed = JSON.parse(localStorage.getItem('viewed-features') || '{}');
        return features.map((f) => ({
          ...f,
          viewed: Boolean(viewed[f.id]) || Boolean(f.viewed),
        }));
      }

      return features;
    }
  } catch {
    // ignore and fall back
  }

  // Fallback to empty list if no manifest available
  return [];
};

export const markFeatureViewed = async (featureId: string): Promise<void> => {
  if (typeof window === 'undefined') return;
  const viewed = JSON.parse(localStorage.getItem('viewed-features') || '{}');
  viewed[featureId] = true;
  localStorage.setItem('viewed-features', JSON.stringify(viewed));
};
