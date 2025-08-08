import React, { useEffect, useCallback, useRef } from 'react';
import { classNames } from '~/utils/classNames';
import { Button } from './Button';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  position?: 'bottom' | 'center';
  enableDrag?: boolean;
  swipeToClose?: boolean;
  className?: string;
}

export const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'md',
  position = 'bottom',
  enableDrag = true,
  swipeToClose = true,
  className,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Touch handlers for swipe to close
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!swipeToClose || !isMobile) {
        return;
      }

      const touch = e.touches[0];
      touchStartY.current = touch.clientY;
      touchStartTime.current = Date.now();
      setIsDragging(true);
    },
    [swipeToClose, isMobile],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !swipeToClose) {
        return;
      }

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartY.current;

      // Only allow downward swipes for bottom positioned modals
      if (position === 'bottom' && deltaY > 0) {
        setDragOffset(deltaY);
        e.preventDefault();
      }
    },
    [isDragging, swipeToClose, position],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) {
      return;
    }

    const deltaY = dragOffset;
    const deltaTime = Date.now() - touchStartTime.current;
    const velocity = deltaY / deltaTime;

    // Close if dragged down more than 100px or fast swipe
    if (deltaY > 100 || velocity > 0.5) {
      onClose();
    }

    setDragOffset(0);
    setIsDragging(false);
  }, [isDragging, dragOffset, onClose]);

  // Background click handler
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const getSizeClasses = () => {
    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      full: 'max-w-full',
    };
    return sizes[size];
  };

  const getPositionClasses = () => {
    if (position === 'bottom') {
      return 'items-end justify-center';
    }

    return 'items-center justify-center';
  };

  const getModalClasses = () => {
    const baseClasses = 'relative w-full bg-bolt-elements-background-depth-1 shadow-xl transition-all duration-300';

    if (position === 'bottom') {
      return `${baseClasses} rounded-t-2xl max-h-[90vh]`;
    }

    return `${baseClasses} rounded-2xl max-h-[85vh] mx-4`;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleBackgroundClick}
      />

      {/* Modal Container */}
      <div className={classNames('relative z-10 flex w-full', getPositionClasses())}>
        <div
          ref={modalRef}
          className={classNames(
            getModalClasses(),
            getSizeClasses(),
            'transform transition-transform duration-300 ease-out',
            isDragging ? 'transition-none' : '',
            className,
          )}
          style={{
            transform: `translateY(${dragOffset}px)`,
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle */}
          {enableDrag && position === 'bottom' && (
            <div ref={dragHandleRef} className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-bolt-elements-borderColor rounded-full" />
            </div>
          )}

          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-bolt-elements-borderColor">
              <h2 className="text-lg sm:text-xl font-semibold text-bolt-elements-textPrimary">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" aria-label="Close modal">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 mobile-scroll">{children}</div>

          {/* Actions */}
          {actions && <div className="flex gap-3 p-6 border-t border-bolt-elements-borderColor">{actions}</div>}
        </div>
      </div>
    </div>
  );
};

// Hook for mobile modal
export const useMobileModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
};

export default MobileModal;
