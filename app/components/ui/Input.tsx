import { forwardRef } from 'react';
import { classNames } from '~/utils/classNames';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  touchOptimized?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ 
  className, 
  type, 
  touchOptimized = true,
  autoCapitalize = 'none',
  inputMode,
  ...props 
}, ref) => {
  const isMobile = typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  
  const getInputMode = () => {
    if (inputMode) return inputMode;
    
    switch (type) {
      case 'email': return 'email';
      case 'tel': return 'tel';
      case 'url': return 'url';
      case 'number': return 'numeric';
      case 'search': return 'search';
      default: return 'text';
    }
  };
  
  const baseClasses = touchOptimized && isMobile
    ? 'flex h-12 sm:h-13 lg:h-14 w-full rounded-lg border-2 border-bolt-elements-border bg-bolt-elements-background px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg'
    : 'flex h-8 sm:h-9 lg:h-10 w-full rounded-md border border-bolt-elements-border bg-bolt-elements-background px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm';
    
  return (
    <input
      type={type}
      inputMode={getInputMode()}
      autoCapitalize={autoCapitalize}
      className={classNames(
        baseClasses,
        'ring-offset-bolt-elements-background file:border-0 file:bg-transparent file:text-xs sm:file:text-sm file:font-medium placeholder:text-bolt-elements-textSecondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bolt-elements-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        'transition-all duration-200 focus:border-bolt-elements-focus',
        'touch-action-manipulation',
        touchOptimized && isMobile && 'min-h-[44px] text-[16px]', // Prevent zoom on iOS
        className,
      )}
      style={{
        WebkitAppearance: 'none',
        WebkitBorderRadius: touchOptimized && isMobile ? '12px' : '6px',
      }}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
