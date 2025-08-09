import type { MetaFunction } from '@remix-run/cloudflare';
import { Header } from '~/components/header/Header';

export const meta: MetaFunction = () => {
  return [
    { title: 'Knowledge | YOUSEF.SHTIWE AI' },
    { name: 'description', content: 'إدارة قاعدة المعرفة والمستندات' },
  ];
};

export default function KnowledgeRoute() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <Header />
      <div className="px-4 py-6 text-center text-sm text-bolt-elements-textSecondary">
        إدارة قاعدة المعرفة قادمة قريبًا. يمكنك رفع الملفات وربطها بالمحادثات لاحقًا.
      </div>
    </div>
  );
}