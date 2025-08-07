import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientOnly } from 'remix-utils/client-only';
import AIAssistant from './AIAssistant';

export const AIFloatingButton: React.FC = () => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <ClientOnly>
      {() => (
        <>
          {/* Floating AI Button */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: 'spring', stiffness: 200 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAssistantOpen(!isAssistantOpen)}
              className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
                isAssistantOpen
                  ? 'bg-blue-600 text-white'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
              }`}
            >
              <AnimatePresence mode="wait">
                {isAssistantOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    className="i-ph:x text-xl"
                  />
                ) : (
                  <motion.div
                    key="robot"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    className="i-ph:robot text-xl"
                  />
                )}
              </AnimatePresence>
            </motion.button>
            
            {/* Tooltip */}
            <AnimatePresence>
              {!isAssistantOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-lg px-3 py-2 shadow-lg pointer-events-none"
                >
                  <div className="text-sm text-bolt-elements-textPrimary whitespace-nowrap">
                    AI Assistant
                  </div>
                  <div className="text-xs text-bolt-elements-textSecondary">
                    Click for code help
                  </div>
                  {/* Arrow */}
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-bolt-elements-borderColor border-y-4 border-y-transparent"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* AI Assistant Panel */}
          <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
        </>
      )}
    </ClientOnly>
  );
};

export default AIFloatingButton;