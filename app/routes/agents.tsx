import type { MetaFunction } from '@remix-run/cloudflare';
import { Header } from '~/components/header/Header';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import AIAgentsChat from '~/enhanced/ai-agents/chat/AIAgentsChat';

export const meta: MetaFunction = () => {
  return [{ title: 'Agents | YOUSEF.SHTIWE AI' }, { name: 'description', content: 'إدارة وتشغيل الوكلاء الذكيين' }];
};

export default function AgentsRoute() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <Header />
      <div className="px-4 py-2 text-center text-sm text-bolt-elements-textSecondary">إدارة وتشغيل الوكلاء الذكيين</div>
      <div className="flex-1">
        <ClientOnly fallback={<BaseChat />}>{() => <AIAgentsChat />}</ClientOnly>
      </div>
    </div>
  );
}
