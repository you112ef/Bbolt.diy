import React from 'react';
import { useI18n } from '~/lib/i18n';

// Enhanced example prompts covering diverse real-world scenarios
const EXAMPLE_PROMPTS = [
  // Mobile & Web Apps
  {
<<<<<<< HEAD
    text: 'إنشاء تطبيق جوال للتجارة الإلكترونية مع تنقل React Native',
    category: 'Mobile',
  },
  {
    text: 'بناء تطبيق دردشة فورية مع دعم WebSocket',
    category: 'Web App',
  },
  {
    text: 'تطوير PWA لوحة تحكم للتحليلات مع دعم العمل دون اتصال',
=======
    text: 'Create a mobile-first e-commerce app with React Native navigation',
    category: 'Mobile',
  },
  {
    text: 'Build a real-time chat application with WebSocket support',
    category: 'Web App',
  },
  {
    text: 'Develop a PWA dashboard for analytics with offline support',
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
    category: 'PWA',
  },

  // AI & Machine Learning
  {
<<<<<<< HEAD
    text: 'تطبيق تصنيف الصور باستخدام TensorFlow.js في المتصفح',
    category: 'AI/ML',
  },
  {
    text: 'إنشاء chatbot مع قدرات معالجة اللغة الطبيعية',
    category: 'AI/ML',
  },
  {
    text: 'بناء نظام توصيات باستخدام التصفية التعاونية',
=======
    text: 'Implement image classification using TensorFlow.js in the browser',
    category: 'AI/ML',
  },
  {
    text: 'Create a chatbot with natural language processing capabilities',
    category: 'AI/ML',
  },
  {
    text: 'Build a recommendation system using collaborative filtering',
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
    category: 'AI/ML',
  },

  // Backend & APIs
  {
<<<<<<< HEAD
    text: 'تصميم REST API مع المصادقة وتحديد المعدل والتوثيق',
    category: 'Backend',
  },
  {
    text: 'إنشاء خادم GraphQL مع اشتراكات في الوقت الفعلي',
    category: 'Backend',
  },
  {
    text: 'بناء معمارية الخدمات المصغرة مع Docker وKubernetes',
=======
    text: 'Design a REST API with authentication, rate limiting, and documentation',
    category: 'Backend',
  },
  {
    text: 'Create a GraphQL server with real-time subscriptions',
    category: 'Backend',
  },
  {
    text: 'Build a microservices architecture with Docker and Kubernetes',
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
    category: 'DevOps',
  },

  // Data & Analytics
  {
<<<<<<< HEAD
    text: 'إنشاء تصورات بيانات تفاعلية مع D3.js وReact',
    category: 'Data Viz',
  },
  {
    text: 'بناء لوحة مراقبة في الوقت الفعلي مع المقاييس والتنبيهات',
    category: 'Analytics',
  },
  {
    text: 'تطوير خط أنابيب ETL لمعالجة مجموعات البيانات الكبيرة',
=======
    text: 'Create interactive data visualizations with D3.js and React',
    category: 'Data Viz',
  },
  {
    text: 'Build a real-time monitoring dashboard with metrics and alerts',
    category: 'Analytics',
  },
  {
    text: 'Develop an ETL pipeline for processing large datasets',
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
    category: 'Data Engineering',
  },

  // Gaming & Interactive
  {
<<<<<<< HEAD
    text: 'إنشاء لعبة متعددة اللاعبين مع شبكة WebRTC نظير إلى نظير',
    category: 'Gaming',
  },
  {
    text: 'بناء تصور ثلاثي الأبعاد تفاعلي باستخدام Three.js',
    category: 'Interactive',
  },
  {
    text: 'تطوير تجربة VR/AR لمتصفحات الويب',
=======
    text: 'Create a multiplayer game with WebRTC peer-to-peer networking',
    category: 'Gaming',
  },
  {
    text: 'Build a 3D interactive visualization using Three.js',
    category: 'Interactive',
  },
  {
    text: 'Develop a VR/AR experience for web browsers',
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
    category: 'XR',
  },

  // E-commerce & Business
  {
<<<<<<< HEAD
    text: 'بناء منصة تجارة إلكترونية كاملة مع تكامل الدفع',
    category: 'E-commerce',
  },
  {
    text: 'إنشاء نظام CRM مع إدارة العملاء والتحليلات',
    category: 'Business',
  },
  {
    text: 'تطوير نظام إدارة المخزون مع مسح الباركود',
=======
    text: 'Build a complete e-commerce platform with payment integration',
    category: 'E-commerce',
  },
  {
    text: 'Create a CRM system with customer management and analytics',
    category: 'Business',
  },
  {
    text: 'Develop an inventory management system with barcode scanning',
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
    category: 'Business',
  },

  // Security & Privacy
  {
<<<<<<< HEAD
    text: 'تطبيق التشفير من طرف إلى طرف لتطبيقات المراسلة',
    category: 'Security',
  },
  {
    text: 'إنشاء نظام مصادقة آمن مع OAuth و2FA',
    category: 'Security',
  },
  {
    text: 'بناء منصة تحليلات تركز على الخصوصية بدون cookies',
=======
    text: 'Implement end-to-end encryption for messaging applications',
    category: 'Security',
  },
  {
    text: 'Create a secure authentication system with OAuth and 2FA',
    category: 'Security',
  },
  {
    text: 'Build a privacy-focused analytics platform without cookies',
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
    category: 'Privacy',
  },

  // IoT & Hardware
  {
<<<<<<< HEAD
    text: 'إنشاء لوحة تحكم IoT لأتمتة المنزل الذكي',
    category: 'IoT',
  },
  {
    text: 'بناء نظام جمع بيانات المستشعرات مع تكامل Arduino',
    category: 'Hardware',
  },
  {
    text: 'تطوير تطبيق مراقبة بيئية في الوقت الفعلي',
=======
    text: 'Create an IoT dashboard for smart home automation',
    category: 'IoT',
  },
  {
    text: 'Build a sensor data collection system with Arduino integration',
    category: 'Hardware',
  },
  {
    text: 'Develop a real-time environmental monitoring application',
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
    category: 'IoT',
  },

  // Productivity & Tools
  {
<<<<<<< HEAD
    text: 'إنشاء محرر أكواد تعاوني مع تعاون في الوقت الفعلي',
    category: 'Productivity',
  },
  {
    text: 'بناء أداة إدارة مشاريع مع لوحات Kanban والجداول الزمنية',
    category: 'Productivity',
  },
  {
    text: 'تطوير مولد توثيق مع اكتشاف API تلقائي',
=======
    text: 'Create a collaborative code editor with real-time collaboration',
    category: 'Productivity',
  },
  {
    text: 'Build a project management tool with Kanban boards and timelines',
    category: 'Productivity',
  },
  {
    text: 'Develop a documentation generator with automatic API discovery',
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
    category: 'Tools',
  },
];

// Group prompts by category for better organization
const getPromptsByCategory = () => {
  const categories = [...new Set(EXAMPLE_PROMPTS.map((p) => p.category))];
  return categories.reduce(
    (acc, category) => {
      acc[category] = EXAMPLE_PROMPTS.filter((p) => p.category === category);
      return acc;
    },
    {} as Record<string, typeof EXAMPLE_PROMPTS>,
  );
};

// Get random prompts for variety
const getRandomPrompts = (count: number = 8) => {
  const shuffled = [...EXAMPLE_PROMPTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export function ExamplePrompts(sendMessage?: { (event: React.UIEvent, messageInput?: string): void | undefined }) {
  // Use random prompts for variety on each render
  const displayPrompts = React.useMemo(() => getRandomPrompts(6), []);
<<<<<<< HEAD

  return (
    <div id="examples" className="relative flex flex-col gap-3 w-full max-w-3xl mx-auto flex justify-center mt-3">
      <div className="text-center mb-2">
        <h3 className="text-sm font-medium text-bolt-elements-textPrimary mb-1 opacity-90">✨ استكشف ما يمكنك بناؤه</h3>
        <p className="text-xs text-bolt-elements-textSecondary opacity-70">
          انقر على أي مثال أدناه للبدء، أو اكتب فكرتك الخاصة
        </p>
=======
  const { t } = useI18n();

  return (
    <div id="examples" className="relative flex flex-col gap-6 w-full max-w-4xl mx-auto flex justify-center mt-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">✨ {t('examples.title')}</h3>
        <p className="text-sm text-bolt-elements-textSecondary">{t('examples.subtitle')}</p>
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
        style={{
          animation: '.25s ease-out 0s 1 _fade-and-move-in_g2ptj_1 forwards',
        }}
      >
        {displayPrompts.map((examplePrompt, index: number) => {
          return (
            <button
              key={index}
              onClick={(event) => {
                sendMessage?.(event, examplePrompt.text);
              }}
<<<<<<< HEAD
              className="group relative p-2.5 border border-bolt-elements-borderColor bg-gradient-to-br from-bolt-elements-bg-depth-2/50 to-bolt-elements-bg-depth-3/30 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-bolt-elements-borderColorActive/50 text-left"
              title={`Category: ${examplePrompt.category}`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-bolt-elements-bg-depth-4/60 text-bolt-elements-textSecondary">
                  {examplePrompt.category}
                </span>
                <div className="text-sm opacity-60 group-hover:opacity-100 transition-opacity">
=======
              className={
                'group relative p-4 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-md text-left bg-bolt-elements-background-depth-1 dark:bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor'
              }
              title={`Category: ${examplePrompt.category}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium text-white">{t(`category.${examplePrompt.category}`)}</span>
                <div className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
                  {examplePrompt.category === 'Mobile' && '📱'}
                  {examplePrompt.category === 'Web App' && '🌐'}
                  {examplePrompt.category === 'PWA' && '⚡'}
                  {examplePrompt.category === 'AI/ML' && '🤖'}
                  {examplePrompt.category === 'Backend' && '🔧'}
                  {examplePrompt.category === 'DevOps' && '🚀'}
                  {examplePrompt.category === 'Data Viz' && '📊'}
                  {examplePrompt.category === 'Analytics' && '📈'}
                  {examplePrompt.category === 'Data Engineering' && '🔄'}
                  {examplePrompt.category === 'Gaming' && '🎮'}
                  {examplePrompt.category === 'Interactive' && '🎨'}
                  {examplePrompt.category === 'XR' && '🥽'}
                  {examplePrompt.category === 'E-commerce' && '🛒'}
                  {examplePrompt.category === 'Business' && '💼'}
                  {examplePrompt.category === 'Security' && '🔒'}
                  {examplePrompt.category === 'Privacy' && '🛡️'}
                  {examplePrompt.category === 'IoT' && '🌐'}
                  {examplePrompt.category === 'Hardware' && '⚙️'}
                  {examplePrompt.category === 'Productivity' && '📋'}
                  {examplePrompt.category === 'Tools' && '🛠️'}
                </div>
              </div>
<<<<<<< HEAD
              <p className="text-xs font-normal leading-relaxed text-bolt-elements-textPrimary opacity-85 group-hover:opacity-100 transition-opacity">
                {examplePrompt.text}
              </p>
              <div className="absolute inset-0 bg-gradient-to-br from-primary-color/5 to-secondary-color/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
=======
              <p className="text-sm font-medium leading-relaxed">{examplePrompt.text}</p>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent to-white/10 dark:to-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
            </button>
          );
        })}
      </div>

<<<<<<< HEAD
      <div className="text-center mt-2">
        <p className="text-xs text-bolt-elements-textTertiary opacity-60">
          💡 نصيحة: كن محدداً حول التقنيات والميزات والمتطلبات للحصول على أفضل النتائج
=======
      <div className="text-center mt-4">
        <p className="text-xs text-bolt-elements-textTertiary">
          💡 Pro tip: Be specific about technologies, features, and requirements for better results
>>>>>>> cursor/create-stealthy-multi-layered-code-f8fe
        </p>
      </div>
    </div>
  );
}

// Export utility functions for use in other components
export { getPromptsByCategory, getRandomPrompts, EXAMPLE_PROMPTS };
