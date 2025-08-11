import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { classNames } from '~/utils/classNames';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs sm:text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bolt-elements-borderColor disabled:pointer-events-none disabled:opacity-50 touch-target active:scale-98 active:brightness-95 touch-action-manipulation select-none',
  {
    variants: {
      variant: {
        default: 'bg-bolt-elements-background text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline:
          'border border-bolt-elements-borderColor bg-transparent hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary text-bolt-elements-textPrimary dark:border-bolt-elements-borderColorActive',
        secondary:
          'bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2',
        ghost: 'hover:bg-bolt-elements-background-depth-1 hover:text-bolt-elements-textPrimary',
        link: 'text-bolt-elements-textPrimary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 sm:h-11 lg:h-12 px-4 sm:px-6 py-2 sm:py-3 min-h-[44px]',
        sm: 'h-8 sm:h-9 lg:h-10 rounded-md px-3 sm:px-4 text-xs min-h-[40px]',
        lg: 'h-12 sm:h-13 lg:h-14 rounded-md px-6 sm:px-8 lg:px-10 min-h-[56px]',
        icon: 'h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 min-h-[44px] min-w-[44px]',
        touch: 'h-12 sm:h-14 lg:h-16 px-6 sm:px-8 lg:px-10 text-base min-h-[56px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  _asChild?: boolean;
  enableHaptics?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy';
  longPressDelay?: number;
  onLongPress?: () => void;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      _asChild = false,
      enableHaptics = true,
      hapticType = 'light',
      longPressDelay = 500,
      onLongPress,
      onClick,
      onTouchStart,
      onTouchEnd,
      ...props
    },
    ref,
  ) => {
    /* no pressed state */
    const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);

    const triggerHaptic = React.useCallback(() => {
      if (!enableHaptics || !isMobile) {
        return;
      }

      if ('Haptics' in window && (window as any).Haptics) {
        const Haptics = (window as any).Haptics;
        const styles = {
          light: 'LIGHT',
          medium: 'MEDIUM',
          heavy: 'HEAVY',
        };
        Haptics.impact({ style: styles[hapticType] });
      } else if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [50],
        };
        navigator.vibrate(patterns[hapticType]);
      }
    }, [enableHaptics, hapticType, isMobile]);

    const handleTouchStart = React.useCallback(
      (e: React.TouchEvent<HTMLButtonElement>) => {
        /* noop */
        triggerHaptic();

        if (onLongPress) {
          longPressTimerRef.current = setTimeout(() => {
            onLongPress();
          }, longPressDelay);
        }

        onTouchStart?.(e);
      },
      [triggerHaptic, onLongPress, longPressDelay, onTouchStart],
    );

    const handleTouchEnd = React.useCallback(
      (e: React.TouchEvent<HTMLButtonElement>) => {
        /* noop */

        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        onTouchEnd?.(e);
      },
      [onTouchEnd],
    );

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!isMobile) {
          triggerHaptic();
        }

        onClick?.(e);
      },
      [onClick, triggerHaptic, isMobile],
    );

    React.useEffect(() => {
      return () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
        }
      };
    }, []);

    const buttonClasses = classNames(
      buttonVariants({ variant, size }),
      {
        'active:scale-95': isMobile,
        'transform transition-transform': true,
      },
      className,
    );

    return (
      <button
        className={buttonClasses}
        ref={ref}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
