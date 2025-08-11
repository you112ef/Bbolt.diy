import { json } from '@remix-run/cloudflare';
import { getTotals, getEvents } from '~/lib/persistence/usageStore';

export async function loader() {
  return json({ totals: getTotals(), events: getEvents(100) });
}