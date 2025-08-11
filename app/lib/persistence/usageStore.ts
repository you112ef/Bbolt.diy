export type UsageEvent = {
  timestamp: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type UsageTotals = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

const g = globalThis as any;

if (!g.__usageStore) {
  g.__usageStore = {
    events: [] as UsageEvent[],
    totals: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } as UsageTotals,
  };
}

export const usageStore = g.__usageStore as { events: UsageEvent[]; totals: UsageTotals };

export function addUsage(event: UsageEvent) {
  usageStore.events.push(event);
  usageStore.totals.promptTokens += event.promptTokens;
  usageStore.totals.completionTokens += event.completionTokens;
  usageStore.totals.totalTokens += event.totalTokens;
}

export function getTotals(): UsageTotals {
  return { ...usageStore.totals };
}

export function getEvents(limit = 100): UsageEvent[] {
  const start = Math.max(0, usageStore.events.length - limit);
  return usageStore.events.slice(start).reverse();
}
