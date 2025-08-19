import React from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import AIFloatingButton from '../ai/AIFloatingButton';

/**
 * AI Extensions Component
 * 
 * This component provides AI-powered features to bolt.diy without affecting
 * any existing functionality. It includes:
 * - Floating AI Assistant button
 * - AI agents (explainer, fixer, optimizer, tester, docs)
 * - Offline AI capabilities using local models
 * 
 * The component is completely modular and can be removed without
 * affecting the core application.
 */
export const AIExtensions: React.FC = () => {
  return (
    <ClientOnly>
      {() => (
        <>
          {/* AI Floating Assistant - only renders when needed */}
          <AIFloatingButton />
          
          {/* Future: Additional AI features can be added here */}
          {/* - Voice commands */}
          {/* - AI-powered search */}
          {/* - Smart code completion */}
          {/* - Automated testing suggestions */}
        </>
      )}
    </ClientOnly>
  );
};

export default AIExtensions;