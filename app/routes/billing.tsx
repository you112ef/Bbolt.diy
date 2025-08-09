import type { MetaFunction } from '@remix-run/cloudflare';
import { Header } from '~/components/header/Header';

export const meta: MetaFunction = () => {
  return [
    { title: 'Billing | YOUSEF.SHTIWE AI' },
    { name: 'description', content: 'إدارة الخطط والاستهلاك والفوترة' },
  ];
};

export default function BillingRoute() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <Header />
      <div className="px-4 py-6 text-center text-sm text-bolt-elements-textSecondary">
        صفحة الفوترة قادمة قريبًا. سيتم ربط Stripe وتتبع الاستهلاك هنا.
      </div>
    </div>
  );
}