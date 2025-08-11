import type { MetaFunction } from '@remix-run/cloudflare';
import { Header } from '~/components/header/Header';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { ControlPanel } from '~/components/@settings/core/ControlPanel';

export const meta: MetaFunction = () => {
  return [
    { title: 'Settings | YOUSEF.SHTIWE AI' },
    { name: 'description', content: 'إعدادات المنصة والمزوّدات والمفاتيح' },
  ];
};

export default function SettingsRoute() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <Header />
      <div className="px-4 py-2 text-center text-sm text-bolt-elements-textSecondary">إعدادات المنصة والمزوّدات</div>
      <div className="flex-1">
        <ClientOnly fallback={<BaseChat />}>{() => <ControlPanel open={true} onClose={() => {}} />}</ClientOnly>
      </div>
    </div>
  );
}
