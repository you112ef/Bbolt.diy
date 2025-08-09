import React from 'react';

// Enhanced example prompts covering diverse real-world scenarios
const EXAMPLE_PROMPTS = [
  // Mobile & Web Apps
  { 
    text: 'Create a mobile-first e-commerce app with React Native navigation', 
    category: 'Mobile' 
  },
  { 
    text: 'Build a real-time chat application with WebSocket support', 
    category: 'Web App' 
  },
  { 
    text: 'Develop a PWA dashboard for analytics with offline support', 
    category: 'PWA' 
  },
  
  // AI & Machine Learning
  { 
    text: 'Implement image classification using TensorFlow.js in the browser', 
    category: 'AI/ML' 
  },
  { 
    text: 'Create a chatbot with natural language processing capabilities', 
    category: 'AI/ML' 
  },
  { 
    text: 'Build a recommendation system using collaborative filtering', 
    category: 'AI/ML' 
  },
  
  // Backend & APIs
  { 
    text: 'Design a REST API with authentication, rate limiting, and documentation', 
    category: 'Backend' 
  },
  { 
    text: 'Create a GraphQL server with real-time subscriptions', 
    category: 'Backend' 
  },
  { 
    text: 'Build a microservices architecture with Docker and Kubernetes', 
    category: 'DevOps' 
  },
  
  // Data & Analytics
  { 
    text: 'Create interactive data visualizations with D3.js and React', 
    category: 'Data Viz' 
  },
  { 
    text: 'Build a real-time monitoring dashboard with metrics and alerts', 
    category: 'Analytics' 
  },
  { 
    text: 'Develop an ETL pipeline for processing large datasets', 
    category: 'Data Engineering' 
  },
  
  // Gaming & Interactive
  { 
    text: 'Create a multiplayer game with WebRTC peer-to-peer networking', 
    category: 'Gaming' 
  },
  { 
    text: 'Build a 3D interactive visualization using Three.js', 
    category: 'Interactive' 
  },
  { 
    text: 'Develop a VR/AR experience for web browsers', 
    category: 'XR' 
  },
  
  // E-commerce & Business
  { 
    text: 'Build a complete e-commerce platform with payment integration', 
    category: 'E-commerce' 
  },
  { 
    text: 'Create a CRM system with customer management and analytics', 
    category: 'Business' 
  },
  { 
    text: 'Develop an inventory management system with barcode scanning', 
    category: 'Business' 
  },
  
  // Security & Privacy
  { 
    text: 'Implement end-to-end encryption for messaging applications', 
    category: 'Security' 
  },
  { 
    text: 'Create a secure authentication system with OAuth and 2FA', 
    category: 'Security' 
  },
  { 
    text: 'Build a privacy-focused analytics platform without cookies', 
    category: 'Privacy' 
  },
  
  // IoT & Hardware
  { 
    text: 'Create an IoT dashboard for smart home automation', 
    category: 'IoT' 
  },
  { 
    text: 'Build a sensor data collection system with Arduino integration', 
    category: 'Hardware' 
  },
  { 
    text: 'Develop a real-time environmental monitoring application', 
    category: 'IoT' 
  },
  
  // Productivity & Tools
  { 
    text: 'Create a collaborative code editor with real-time collaboration', 
    category: 'Productivity' 
  },
  { 
    text: 'Build a project management tool with Kanban boards and timelines', 
    category: 'Productivity' 
  },
  { 
    text: 'Develop a documentation generator with automatic API discovery', 
    category: 'Tools' 
  }
];

// Group prompts by category for better organization
const getPromptsByCategory = () => {
  const categories = [...new Set(EXAMPLE_PROMPTS.map(p => p.category))];
  return categories.reduce((acc, category) => {
    acc[category] = EXAMPLE_PROMPTS.filter(p => p.category === category);
    return acc;
  }, {} as Record<string, typeof EXAMPLE_PROMPTS>);
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
    <div id="examples" className="relative flex flex-col gap-6 w-full max-w-4xl mx-auto flex justify-center mt-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">
          ✨ Explore What You Can Build
        </h3>
        <p className="text-sm text-bolt-elements-textSecondary">
          Click any example below to get started, or type your own idea
        </p>
      </div>
      
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        style={{
          animation: '.25s ease-out 0s 1 _fade-and-move-in_g2ptj_1 forwards',
        }}
      >
        {displayPrompts.map((examplePrompt, index: number) => {
          const categoryColors = {
            'Mobile': 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
            'Web App': 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200',
            'PWA': 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-200',
            'AI/ML': 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200',
            'Backend': 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200',
            'DevOps': 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-200',
            'Data Viz': 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-200',
            'Analytics': 'bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-950 dark:border-cyan-800 dark:text-cyan-200',
            'Data Engineering': 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200',
            'Gaming': 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
            'Interactive': 'bg-pink-50 border-pink-200 text-pink-800 dark:bg-pink-950 dark:border-pink-800 dark:text-pink-200',
            'XR': 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-200',
            'E-commerce': 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200',
            'Business': 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200',
            'Security': 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
            'Privacy': 'bg-stone-50 border-stone-200 text-stone-800 dark:bg-stone-950 dark:border-stone-800 dark:text-stone-200',
            'IoT': 'bg-lime-50 border-lime-200 text-lime-800 dark:bg-lime-950 dark:border-lime-800 dark:text-lime-200',
            'Hardware': 'bg-zinc-50 border-zinc-200 text-zinc-800 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200',
            'Productivity': 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-200',
            'Tools': 'bg-neutral-50 border-neutral-200 text-neutral-800 dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-200'
          };
          
          const categoryColor = categoryColors[examplePrompt.category as keyof typeof categoryColors] || categoryColors['Tools'];
          
          return (
            <button
              key={index}
              onClick={(event) => {
                sendMessage?.(event, examplePrompt.text);
              }}
              className={`group relative p-4 border rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-md text-left ${
                categoryColor
              }`}
              title={`Category: ${examplePrompt.category}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50 dark:bg-black/20">
                  {examplePrompt.category}
                </span>
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
              <p className="text-sm font-medium leading-relaxed">
                {examplePrompt.text}
              </p>
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
