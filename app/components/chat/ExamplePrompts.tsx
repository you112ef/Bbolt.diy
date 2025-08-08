import React from 'react';

// Enhanced example prompts covering diverse real-world scenarios
const EXAMPLE_PROMPTS = [
  // Mobile & Web Apps
  {
    text: 'إنشاء تطبيق جوال للتجارة الإلكترونية مع تنقل React Native',
    category: 'Mobile',
  },
  {
    text: 'بناء تطبيق دردشة فورية مع دعم WebSocket',
    category: 'Web App',
  },
  {
    text: 'تطوير PWA لوحة تحكم للتحليلات مع دعم العمل دون اتصال',
    category: 'PWA',
  },

  // AI & Machine Learning
  {
    text: 'تطبيق تصنيف الصور باستخدام TensorFlow.js في المتصفح',
    category: 'AI/ML',
  },
  {
    text: 'إنشاء chatbot مع قدرات معالجة اللغة الطبيعية',
    category: 'AI/ML',
  },
  {
    text: 'بناء نظام توصيات باستخدام التصفية التعاونية',
    category: 'AI/ML',
  },

  // Backend & APIs
  {
    text: 'تصميم REST API مع المصادقة وتحديد المعدل والتوثيق',
    category: 'Backend',
  },
  {
    text: 'إنشاء خادم GraphQL مع اشتراكات في الوقت الفعلي',
    category: 'Backend',
  },
  {
    text: 'بناء معمارية الخدمات المصغرة مع Docker وKubernetes',
    category: 'DevOps',
  },

  // Data & Analytics
  {
    text: 'إنشاء تصورات بيانات تفاعلية مع D3.js وReact',
    category: 'Data Viz',
  },
  {
    text: 'بناء لوحة مراقبة في الوقت الفعلي مع المقاييس والتنبيهات',
    category: 'Analytics',
  },
  {
    text: 'تطوير خط أنابيب ETL لمعالجة مجموعات البيانات الكبيرة',
    category: 'Data Engineering',
  },

  // Gaming & Interactive
  {
    text: 'إنشاء لعبة متعددة اللاعبين مع شبكة WebRTC نظير إلى نظير',
    category: 'Gaming',
  },
  {
    text: 'بناء تصور ثلاثي الأبعاد تفاعلي باستخدام Three.js',
    category: 'Interactive',
  },
  {
    text: 'تطوير تجربة VR/AR لمتصفحات الويب',
    category: 'XR',
  },

  // E-commerce & Business
  {
    text: 'بناء منصة تجارة إلكترونية كاملة مع تكامل الدفع',
    category: 'E-commerce',
  },
  {
    text: 'إنشاء نظام CRM مع إدارة العملاء والتحليلات',
    category: 'Business',
  },
  {
    text: 'تطوير نظام إدارة المخزون مع مسح الباركود',
    category: 'Business',
  },

  // Security & Privacy
  {
    text: 'تطبيق التشفير من طرف إلى طرف لتطبيقات المراسلة',
    category: 'Security',
  },
  {
    text: 'إنشاء نظام مصادقة آمن مع OAuth و2FA',
    category: 'Security',
  },
  {
    text: 'بناء منصة تحليلات تركز على الخصوصية بدون cookies',
    category: 'Privacy',
  },

  // IoT & Hardware
  {
    text: 'إنشاء لوحة تحكم IoT لأتمتة المنزل الذكي',
    category: 'IoT',
  },
  {
    text: 'بناء نظام جمع بيانات المستشعرات مع تكامل Arduino',
    category: 'Hardware',
  },
  {
    text: 'تطوير تطبيق مراقبة بيئية في الوقت الفعلي',
    category: 'IoT',
  },

  // Productivity & Tools
  {
    text: 'إنشاء محرر أكواد تعاوني مع تعاون في الوقت الفعلي',
    category: 'Productivity',
  },
  {
    text: 'بناء أداة إدارة مشاريع مع لوحات Kanban والجداول الزمنية',
    category: 'Productivity',
  },
  {
    text: 'تطوير مولد توثيق مع اكتشاف API تلقائي',
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

  return (
    <div id="examples" className="relative flex flex-col gap-3 w-full max-w-3xl mx-auto flex justify-center mt-3">
      <div className="text-center mb-2">
        <h3 className="text-sm font-medium text-bolt-elements-textPrimary mb-1 opacity-90">✨ استكشف ما يمكنك بناؤه</h3>
        <p className="text-xs text-bolt-elements-textSecondary opacity-70">
          انقر على أي مثال أدناه للبدء، أو اكتب فكرتك الخاصة
        </p>
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
              className="group relative p-2.5 border border-bolt-elements-borderColor bg-gradient-to-br from-bolt-elements-bg-depth-2/50 to-bolt-elements-bg-depth-3/30 backdrop-blur-sm rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-bolt-elements-borderColorActive/50 text-left"
              title={`Category: ${examplePrompt.category}`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-bolt-elements-bg-depth-4/60 text-bolt-elements-textSecondary">
                  {examplePrompt.category}
                </span>
                <div className="text-sm opacity-60 group-hover:opacity-100 transition-opacity">
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
              <p className="text-xs font-normal leading-relaxed text-bolt-elements-textPrimary opacity-85 group-hover:opacity-100 transition-opacity">
                {examplePrompt.text}
              </p>
              <div className="absolute inset-0 bg-gradient-to-br from-primary-color/5 to-secondary-color/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          );
        })}
      </div>

      <div className="text-center mt-2">
        <p className="text-xs text-bolt-elements-textTertiary opacity-60">
          💡 نصيحة: كن محدداً حول التقنيات والميزات والمتطلبات للحصول على أفضل النتائج
        </p>
      </div>
    </div>
  );
}

// Export utility functions for use in other components
export { getPromptsByCategory, getRandomPrompts, EXAMPLE_PROMPTS };
