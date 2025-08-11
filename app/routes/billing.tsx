import type { MetaFunction } from '@remix-run/cloudflare';
import { Header } from '~/components/header/Header';
import React, { useEffect, useState } from 'react';

export const meta: MetaFunction = () => {
  return [{ title: 'Billing | YOUSEF.SHTIWE AI' }, { name: 'description', content: 'إدارة الخطط والاستهلاك والفوترة' }];
};

type UsageTotals = { promptTokens: number; completionTokens: number; totalTokens: number };

type UsageEvent = { timestamp: string; promptTokens: number; completionTokens: number; totalTokens: number };

export default function BillingRoute() {
  const [totals, setTotals] = useState<UsageTotals | null>(null);
  const [events, setEvents] = useState<UsageEvent[]>([]);

  useEffect(() => {
    fetch('/api/usage')
      .then((r) => r.json() as Promise<{ totals: UsageTotals; events: UsageEvent[] }>)
      .then((d) => {
        setTotals(d.totals);
        setEvents(d.events);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <Header />
      <div className="max-w-4xl w-full mx-auto p-4">
        <h2 className="text-lg font-semibold mb-2">الاستهلاك</h2>
        {totals ? (
          <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
            <div className="p-3 rounded border border-gray-800">Prompt: {totals.promptTokens}</div>
            <div className="p-3 rounded border border-gray-800">Completion: {totals.completionTokens}</div>
            <div className="p-3 rounded border border-gray-800">Total: {totals.totalTokens}</div>
          </div>
        ) : (
          <div className="opacity-60 text-sm">لا توجد بيانات بعد</div>
        )}
        <h3 className="text-md font-semibold mt-4 mb-2">الأحداث الأخيرة</h3>
        <ul className="space-y-2 text-sm">
          {events.map((e, i) => (
            <li key={i} className="flex items-center justify-between border-b border-gray-800 pb-1">
              <span>{new Date(e.timestamp).toLocaleString()}</span>
              <span>{e.totalTokens} tokens</span>
            </li>
          ))}
          {events.length === 0 && <li className="opacity-60">لا يوجد أحداث</li>}
        </ul>
      </div>
    </div>
  );
}
