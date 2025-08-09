// app/lib/shims/broadcastChannel.ts
// Lightweight BroadcastChannel shim that:
// - uses native BroadcastChannel in browsers if available
// - otherwise provides an in-memory channel (no cross-tab sync, but prevents crashes in Workers/SSR)

export type MessageHandler = (ev: { data: any }) => void;

const inMemory = new Map<string, Set<MessageHandler>>();

export function createBroadcastChannel(name: string) {
  // Browser native
  if (typeof window !== 'undefined' && (window as any).BroadcastChannel) {
    return new (window as any).BroadcastChannel(name);
  }

  // Worker / Node / SSR fallback: in-memory pub/sub (prevents runtime errors)
  let onmessageHandler: MessageHandler | null = null;

  const api = {
    name,
    postMessage(msg: any) {
      const set = inMemory.get(name);
      if (onmessageHandler) {
        try {
          onmessageHandler({ data: msg });
        } catch (_) {}
      }
      if (!set) return;
      for (const h of Array.from(set)) {
        try {
          h({ data: msg });
        } catch (_) {}
      }
    },
    addEventListener(_type: string, handler: MessageHandler) {
      let set = inMemory.get(name);
      if (!set) {
        set = new Set();
        inMemory.set(name, set);
      }
      set.add(handler);
    },
    removeEventListener(_type: string, handler: MessageHandler) {
      const set = inMemory.get(name);
      if (!set) return;
      set.delete(handler);
      if (set.size === 0) inMemory.delete(name);
    },
    close() {
      inMemory.delete(name);
      onmessageHandler = null;
    },
    get onmessage() {
      return onmessageHandler as any;
    },
    set onmessage(handler: any) {
      onmessageHandler = handler as MessageHandler | null;
    },
  } as any;

  return api;
}