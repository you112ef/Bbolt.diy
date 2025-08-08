/**
 * Mobile Touch Utilities
 * Provides enhanced touch interactions and haptic feedback
 */

// Touch event types
interface TouchEventData {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  duration: number;
  isSwipe: boolean;
  velocity: number;
}

// Gesture configuration
interface GestureConfig {
  threshold: number;
  velocity: number;
  timeLimit: number;
  longPressDelay: number;
}

// Default configuration
const DEFAULT_CONFIG: GestureConfig = {
  threshold: 50, // Minimum distance for swipe
  velocity: 0.3, // Minimum velocity for swipe
  timeLimit: 500, // Maximum time for swipe
  longPressDelay: 500, // Long press delay
};

class MobileTouchManager {
  private config: GestureConfig;
  private touchData: Map<number, TouchEventData> = new Map();
  private longPressTimers: Map<Element, NodeJS.Timeout> = new Map();
  private hapticSupported: boolean = false;

  constructor(config: Partial<GestureConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.checkHapticSupport();
    this.initializeGlobalListeners();
  }

  private checkHapticSupport(): void {
    this.hapticSupported = 'vibrate' in navigator || 'Haptics' in window;
  }

  private initializeGlobalListeners(): void {
    // Prevent default touch behaviors that interfere with gestures
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener(
      'touchend',
      (e) => {
        const now = Date.now();

        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }

        lastTouchEnd = now;
      },
      { passive: false },
    );
  }

  private handleTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    const target = e.target as Element;

    const touchData: TouchEventData = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      direction: null,
      distance: 0,
      duration: 0,
      isSwipe: false,
      velocity: 0,
    };

    this.touchData.set(touch.identifier, touchData);

    // Handle long press
    if (target.classList.contains('long-pressable')) {
      this.startLongPress(target);
    }

    // Dispatch custom touch start event
    this.dispatchCustomEvent(target, 'touch-start', { touchData, originalEvent: e });
  }

  private handleTouchMove(e: TouchEvent): void {
    const touch = e.touches[0];
    const touchData = this.touchData.get(touch.identifier);

    if (!touchData) {
      return;
    }

    const target = e.target as Element;

    touchData.currentX = touch.clientX;
    touchData.currentY = touch.clientY;
    touchData.deltaX = touchData.currentX - touchData.startX;
    touchData.deltaY = touchData.currentY - touchData.startY;
    touchData.distance = Math.sqrt(touchData.deltaX ** 2 + touchData.deltaY ** 2);

    // Determine direction
    if (Math.abs(touchData.deltaX) > Math.abs(touchData.deltaY)) {
      touchData.direction = touchData.deltaX > 0 ? 'right' : 'left';
    } else {
      touchData.direction = touchData.deltaY > 0 ? 'down' : 'up';
    }

    // Cancel long press if moved too much
    if (touchData.distance > 10) {
      this.cancelLongPress(target);
    }

    // Handle swipe detection
    if (target.classList.contains('swipeable')) {
      this.handleSwipeMove(target, touchData);
    }

    // Dispatch custom touch move event
    this.dispatchCustomEvent(target, 'touch-move', { touchData, originalEvent: e });
  }

  private handleTouchEnd(e: TouchEvent): void {
    const touch = e.changedTouches[0];
    const touchData = this.touchData.get(touch.identifier);

    if (!touchData) {
      return;
    }

    const target = e.target as Element;
    const endTime = Date.now();
    touchData.duration = endTime;

    // Calculate velocity
    touchData.velocity = touchData.distance / touchData.duration;

    // Determine if it's a swipe
    touchData.isSwipe =
      touchData.distance > this.config.threshold &&
      touchData.velocity > this.config.velocity &&
      touchData.duration < this.config.timeLimit;

    // Handle swipe end
    if (target.classList.contains('swipeable') && touchData.isSwipe) {
      this.handleSwipeEnd(target, touchData);
    }

    // Cancel long press
    this.cancelLongPress(target);

    // Trigger haptic feedback for tap
    if (touchData.distance < 10 && touchData.duration < 200) {
      this.triggerHaptic('light', target);
    }

    // Dispatch custom touch end event
    this.dispatchCustomEvent(target, 'touch-end', { touchData, originalEvent: e });

    // Cleanup
    this.touchData.delete(touch.identifier);
  }

  private handleTouchCancel(e: TouchEvent): void {
    const touch = e.changedTouches[0];
    const target = e.target as Element;

    this.cancelLongPress(target);
    this.touchData.delete(touch.identifier);
  }

  private startLongPress(element: Element): void {
    const timer = setTimeout(() => {
      element.classList.add('long-pressing');
      this.triggerHaptic('medium', element);
      this.dispatchCustomEvent(element, 'long-press', {});
    }, this.config.longPressDelay);

    this.longPressTimers.set(element, timer);
  }

  private cancelLongPress(element: Element): void {
    const timer = this.longPressTimers.get(element);

    if (timer) {
      clearTimeout(timer);
      this.longPressTimers.delete(element);
    }

    element.classList.remove('long-pressing');
  }

  private handleSwipeMove(element: Element, touchData: TouchEventData): void {
    const { deltaX, deltaY } = touchData;

    // Add visual feedback during swipe
    if (Math.abs(deltaX) > 20) {
      if (deltaX > 0) {
        element.classList.add('swipe-right');
        element.classList.remove('swipe-left');
      } else {
        element.classList.add('swipe-left');
        element.classList.remove('swipe-right');
      }
    }
  }

  private handleSwipeEnd(element: Element, touchData: TouchEventData): void {
    const { direction, velocity, distance } = touchData;

    // Trigger haptic feedback
    this.triggerHaptic('medium', element);

    // Dispatch swipe event
    this.dispatchCustomEvent(element, 'swipe', {
      direction,
      velocity,
      distance,
      touchData,
    });

    // Reset visual state
    setTimeout(() => {
      element.classList.remove('swipe-left', 'swipe-right');
      element.classList.add('swipe-reset');
      setTimeout(() => element.classList.remove('swipe-reset'), 300);
    }, 100);
  }

  private triggerHaptic(type: 'light' | 'medium' | 'heavy', element?: Element): void {
    if (!this.hapticSupported) {
      return;
    }

    // Use Capacitor Haptics if available
    if ('Haptics' in window && (window as any).Haptics) {
      const Haptics = (window as any).Haptics;

      switch (type) {
        case 'light':
          Haptics.impact({ style: 'LIGHT' });
          break;
        case 'medium':
          Haptics.impact({ style: 'MEDIUM' });
          break;
        case 'heavy':
          Haptics.impact({ style: 'HEAVY' });
          break;
      }
    }
    // Fallback to vibration API
    else if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50],
      };
      navigator.vibrate(patterns[type]);
    }

    // Add haptic class for CSS feedback
    if (element) {
      element.classList.add(`haptic-${type}`);
      setTimeout(() => element.classList.remove(`haptic-${type}`), 200);
    }
  }

  private dispatchCustomEvent(element: Element, eventType: string, detail: any): void {
    const event = new CustomEvent(eventType, {
      detail,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(event);
  }

  // Public methods
  enableSwipe(
    element: Element,
    options?: {
      onSwipe?: (direction: string, velocity: number) => void;
      threshold?: number;
    },
  ): void {
    element.classList.add('swipeable');

    if (options?.onSwipe) {
      element.addEventListener('swipe', (e: any) => {
        options.onSwipe!(e.detail.direction, e.detail.velocity);
      });
    }
  }

  enableLongPress(element: Element, callback?: () => void): void {
    element.classList.add('long-pressable');

    if (callback) {
      element.addEventListener('long-press', callback);
    }
  }

  addTouchFeedback(element: Element): void {
    element.classList.add('touch-target');

    // Add active state handling
    element.addEventListener('touchstart', (e) => {
      element.classList.add('touch-active');
      this.triggerHaptic('light', element);
    });

    element.addEventListener('touchend', () => {
      element.classList.remove('touch-active');
    });

    element.addEventListener('touchcancel', () => {
      element.classList.remove('touch-active');
    });
  }

  enablePullToRefresh(element: Element, callback: () => Promise<void>): void {
    let startY = 0;
    let currentY = 0;
    let isPulling = false;

    element.addEventListener('touchstart', (e: Event) => {
      const touchEvent = e as TouchEvent;
      startY = touchEvent.touches[0].clientY;
      isPulling = element.scrollTop === 0;
    });

    element.addEventListener('touchmove', (e: Event) => {
      const touchEvent = e as TouchEvent;

      if (!isPulling) {
        return;
      }

      currentY = touchEvent.touches[0].clientY;

      const deltaY = currentY - startY;

      if (deltaY > 0 && deltaY < 100) {
        element.classList.add('pulling');
        e.preventDefault();
      }
    });

    element.addEventListener('touchend', async () => {
      if (!isPulling) {
        return;
      }

      const deltaY = currentY - startY;

      if (deltaY > 60) {
        this.triggerHaptic('medium', element);

        try {
          await callback();
        } finally {
          element.classList.remove('pulling');
        }
      } else {
        element.classList.remove('pulling');
      }

      isPulling = false;
    });
  }
}

// Utility functions
export function initializeMobileTouch(config?: Partial<GestureConfig>): MobileTouchManager {
  return new MobileTouchManager(config);
}

export function optimizeForTouch(): void {
  // Add mobile-optimized viewport
  let viewport = document.querySelector('meta[name="viewport"]');

  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }

  viewport.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
  );

  // Prevent selection on touch
  document.body.style.webkitUserSelect = 'none';
  document.body.style.userSelect = 'none';

  // Optimize scrolling
  (document.body.style as any).webkitOverflowScrolling = 'touch';
  (document.body.style as any).overflowScrolling = 'touch';

  // Add safe area CSS variables
  document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
  document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
  document.documentElement.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)');
  document.documentElement.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)');
}

export function isMobileDevice(): boolean {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

export function isLandscape(): boolean {
  return window.innerWidth > window.innerHeight;
}

export function getScreenSize(): 'small' | 'medium' | 'large' {
  const width = window.innerWidth;

  if (width < 640) {
    return 'small';
  }

  if (width < 1024) {
    return 'medium';
  }

  return 'large';
}

// Initialize automatically if on mobile
if (typeof window !== 'undefined' && isMobileDevice()) {
  document.addEventListener('DOMContentLoaded', () => {
    optimizeForTouch();
    initializeMobileTouch();
  });
}

export { MobileTouchManager };
export type { TouchEventData, GestureConfig };
