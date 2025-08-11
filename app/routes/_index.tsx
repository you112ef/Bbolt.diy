import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [
<<<<<<< HEAD
    { title: 'يوسف شتيوي AI - منصة التطوير بالذكاء الاصطناعي' },
    { name: 'description', content: 'منصة تطوير متقدمة بالذكاء الاصطناعي لبناء التطبيقات والمواقع بسهولة وسرعة' },
    { name: 'keywords', content: 'يوسف شتيوي, AI, ذكاء اصطناعي, تطوير, برمجة, React, تطبيقات' },
    { property: 'og:title', content: 'يوسف شتيوي AI - منصة التطوير بالذكاء الاصطناعي' },
    {
      property: 'og:description',
      content: 'منصة تطوير متقدمة بالذكاء الاصطناعي لبناء التطبيقات والمواقع بسهولة وسرعة',
    },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'يوسف شتيوي AI' },
    { name: 'twitter:description', content: 'منصة تطوير متقدمة بالذكاء الاصطناعي' },
=======
    { title: 'YOUSEF.SHTIWE AI – منصة بناء الذكاء الاصطناعي' },
    { name: 'description', content: 'تحدث مع YOUSEF.SHTIWE AI – منصة متقدمة لبناء حلول الذكاء الاصطناعي' },
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
  ];
};

export const loader = () => json({});

/**
 * Landing page component for YOUSEF.SHTIWE AI
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
export default function Index() {
  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <div className="px-4 py-2 text-center text-sm text-bolt-elements-textSecondary">
        مرحباً بك في منصة YOUSEF.SHTIWE – التطبيق البناء للإجابة عن أسئلتك وبناء المشاريع
      </div>
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}
