import React from 'react';
import { useI18n } from '~/lib/i18n';

// Enhanced example prompts covering diverse real-world scenarios
const EXAMPLE_PROMPTS = [
  // Mobile & Web Apps
  {
    text: 'Create a mobile-first e-commerce app with React Native navigation',
    category: 'Mobile',
  },
  {
    text: 'Build a real-time chat application with WebSocket support',
    category: 'Web App',
  },
  {
    text: 'Develop a PWA dashboard for analytics with offline support',
    category: 'PWA',
  },

  // AI & Machine Learning
  {
    text: 'Implement image classification using TensorFlow.js in the browser',
    category: 'AI/ML',
  },
  {
    text: 'Create a chatbot with natural language processing capabilities',
    category: 'AI/ML',
  },
  {
    text: 'Build a recommendation system using collaborative filtering',
    category: 'AI/ML',
  },

  // Backend & APIs
  {
    text: 'Design a REST API with authentication, rate limiting, and documentation',
    category: 'Backend',
  },
  {
    text: 'Create a GraphQL server with real-time subscriptions',
    category: 'Backend',
  },
  {
    text: 'Build a microservices architecture with Docker and Kubernetes',
    category: 'DevOps',
  },

  // Data & Analytics
  {
    text: 'Create interactive data visualizations with D3.js and React',
    category: 'Data Viz',
  },
  {
    text: 'Build a real-time monitoring dashboard with metrics and alerts',
    category: 'Analytics',
  },
  {
    text: 'Develop an ETL pipeline for processing large datasets',
    category: 'Data Engineering',
  },

  // Gaming & Interactive
  {
    text: 'Create a multiplayer game with WebRTC peer-to-peer networking',
    category: 'Gaming',
  },
  {
    text: 'Build a 3D interactive visualization using Three.js',
    category: 'Interactive',
  },
  {
    text: 'Develop a VR/AR experience for web browsers',
    category: 'XR',
  },

  // E-commerce & Business
  {
    text: 'Build a complete e-commerce platform with payment integration',
    category: 'E-commerce',
  },
  {
    text: 'Create a CRM system with customer management and analytics',
    category: 'Business',
  },
  {
    text: 'Develop an inventory management system with barcode scanning',
    category: 'Business',
  },

  // Security & Privacy
  {
    text: 'Implement end-to-end encryption for messaging applications',
    category: 'Security',
  },
  {
    text: 'Create a secure authentication system with OAuth and 2FA',
    category: 'Security',
  },
  {
    text: 'Build a privacy-focused analytics platform without cookies',
    category: 'Privacy',
  },

  // IoT & Hardware
  {
    text: 'Create an IoT dashboard for smart home automation',
    category: 'IoT',
  },
  {
    text: 'Build a sensor data collection system with Arduino integration',
    category: 'Hardware',
  },
  {
    text: 'Develop a real-time environmental monitoring application',
    category: 'IoT',
  },

  // Productivity & Tools
  {
    text: 'Create a collaborative code editor with real-time collaboration',
    category: 'Productivity',
  },
  {
    text: 'Build a project management tool with Kanban boards and timelines',
    category: 'Productivity',
  },
  {
    text: 'Develop a documentation generator with automatic API discovery',
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
  const { t } = useI18n();

  return (
    <div id="examples" className="relative flex flex-col gap-6 w-full max-w-4xl mx-auto flex justify-center mt-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">✨ {t('examples.title')}</h3>
        <p className="text-sm text-bolt-elements-textSecondary">{t('examples.subtitle')}</p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
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
              className={
                'group relative p-4 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-md text-left bg-bolt-elements-background-depth-1 dark:bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor'
              }
              title={`Category: ${examplePrompt.category}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium text-white">{t(`category.${examplePrompt.category}`)}</span>
                <div className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">
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
              <p className="text-sm font-medium leading-relaxed">{examplePrompt.text}</p>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent to-white/10 dark:to-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          );
        })}
      </div>

      <div className="text-center mt-4">
        <p className="text-xs text-bolt-elements-textTertiary">
          💡 Pro tip: Be specific about technologies, features, and requirements for better results
        </p>
      </div>
    </div>
  );
}

// Export utility functions for use in other components
export { getPromptsByCategory, getRandomPrompts, EXAMPLE_PROMPTS };
