import { useCallback, useEffect, useRef, useState } from 'react';

// Touch gesture types
type GestureType = 'tap' | 'longPress' | 'swipe' | 'pinch' | 'pan';
type SwipeDirection = 'left' | 'right' | 'up' | 'down';
type HapticType = 'light' | 'medium' | 'heavy';

// Configuration interfaces
interface TouchConfig {
  threshold: number; // Minimum distance for swipe
  velocity: number; // Minimum velocity for swipe
  timeLimit: number; // Maximum time for swipe
  longPressDelay: number; // Long press delay
  enableHaptics: boolean;
  preventScroll: boolean;
}

interface TouchData {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  angle: number;
  velocity: number;
  duration: number;
  direction: SwipeDirection | null;
}

interface GestureHandlers {
  onTap?: (data: TouchData) => void;
  onLongPress?: (data: TouchData) => void;
  onSwipe?: (direction: SwipeDirection, data: TouchData) => void;
  onPan?: (data: TouchData) => void;
  onPinch?: (scale: number, data: TouchData) => void;
  onTouchStart?: (data: TouchData) => void;
  onTouchMove?: (data: TouchData) => void;
  onTouchEnd?: (data: TouchData) => void;
}

const DEFAULT_CONFIG: TouchConfig = {
  threshold: 50,
  velocity: 0.3,
  timeLimit: 500,
  longPressDelay: 500,
  enableHaptics: true,
  preventScroll: false,
};

export const useTouch = (
  elementRef: React.RefObject<HTMLElement>,
  handlers: GestureHandlers = {},
  config: Partial<TouchConfig> = {}
) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const [isPressed, setIsPressed] = useState(false);
  const [touchData, setTouchData] = useState<TouchData | null>(null);
  
  const startTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  // Multi-touch for pinch
  const initialDistanceRef = useRef<number>(0);
  const lastScaleRef = useRef<number>(1);

  // Haptic feedback
  const triggerHaptic = useCallback((type: HapticType) => {
    if (!fullConfig.enableHaptics) return;
    
    if ('Haptics' in window && (window as any).Haptics) {
      const Haptics = (window as any).Haptics;
      const styles = {
        light: 'LIGHT',
        medium: 'MEDIUM',
        heavy: 'HEAVY'
      };
      Haptics.impact({ style: styles[type] });
    } else if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [fullConfig.enableHaptics]);

  // Calculate gesture data
  const calculateTouchData = useCallback((touch: Touch): TouchData => {
    const initial = initialTouchRef.current;
    if (!initial) {
      return {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX: 0,
        deltaY: 0,
        distance: 0,
        angle: 0,
        velocity: 0,
        duration: 0,
        direction: null,
      };
    }

    const deltaX = touch.clientX - initial.x;
    const deltaY = touch.clientY - initial.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    const duration = Date.now() - startTimeRef.current;
    const velocity = duration > 0 ? distance / duration : 0;

    let direction: SwipeDirection | null = null;
    if (distance > fullConfig.threshold) {
      const absAngle = Math.abs(angle);
      if (absAngle < 45) direction = 'right';
      else if (absAngle > 135) direction = 'left';
      else if (angle > 0) direction = 'down';
      else direction = 'up';
    }

    return {
      startX: initial.x,
      startY: initial.y,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      distance,
      angle,
      velocity,
      duration,
      direction,
    };
  }, [fullConfig.threshold]);

  // Calculate distance between two touches
  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    initialTouchRef.current = { x: touch.clientX, y: touch.clientY };
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY, time: now };
    startTimeRef.current = now;
    setIsPressed(true);
    
    const data = calculateTouchData(touch);
    setTouchData(data);
    handlers.onTouchStart?.(data);
    
    // Multi-touch handling
    if (e.touches.length === 2) {
      initialDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
      lastScaleRef.current = 1;
    }
    
    // Start long press timer
    if (handlers.onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        triggerHaptic('medium');
        handlers.onLongPress!(data);
      }, fullConfig.longPressDelay);
    }
    
    if (fullConfig.preventScroll) {
      e.preventDefault();
    }
  }, [calculateTouchData, handlers, fullConfig, triggerHaptic]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const data = calculateTouchData(touch);
    setTouchData(data);
    
    // Cancel long press if moved too much
    if (data.distance > 10 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Handle pinch gesture
    if (e.touches.length === 2 && handlers.onPinch) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistanceRef.current;
      
      if (Math.abs(scale - lastScaleRef.current) > 0.01) {
        handlers.onPinch(scale, data);
        lastScaleRef.current = scale;
      }
    }
    
    // Handle pan gesture
    if (handlers.onPan && data.distance > 5) {
      handlers.onPan(data);
    }
    
    handlers.onTouchMove?.(data);
    
    if (fullConfig.preventScroll) {
      e.preventDefault();
    }
  }, [calculateTouchData, handlers, fullConfig]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const data = calculateTouchData(touch);
    setIsPressed(false);
    setTouchData(null);
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Determine gesture type
    const isSwipe = data.distance > fullConfig.threshold && 
                   data.velocity > fullConfig.velocity &&
                   data.duration < fullConfig.timeLimit;
    
    if (isSwipe && data.direction && handlers.onSwipe) {
      triggerHaptic('medium');
      handlers.onSwipe(data.direction, data);
    } else if (data.distance < 10 && data.duration < 300 && handlers.onTap) {
      triggerHaptic('light');
      handlers.onTap(data);
    }
    
    handlers.onTouchEnd?.(data);
    
    // Reset refs
    initialTouchRef.current = null;
    lastTouchRef.current = null;
    initialDistanceRef.current = 0;
    lastScaleRef.current = 1;
  }, [calculateTouchData, handlers, fullConfig, triggerHaptic]);

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false);
    setTouchData(null);
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Reset refs
    initialTouchRef.current = null;
    lastTouchRef.current = null;
  }, []);

  // Setup event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const options = { passive: !fullConfig.preventScroll };
    
    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);
    element.addEventListener('touchcancel', handleTouchCancel, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, fullConfig.preventScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    isPressed,
    touchData,
    triggerHaptic,
  };
};

// Hook for simple swipe detection
export const useSwipe = (
  elementRef: React.RefObject<HTMLElement>,
  onSwipe: (direction: SwipeDirection) => void,
  config?: Partial<TouchConfig>
) => {
  return useTouch(elementRef, { onSwipe }, config);
};

// Hook for tap detection
export const useTap = (
  elementRef: React.RefObject<HTMLElement>,
  onTap: () => void,
  config?: Partial<TouchConfig>
) => {
  return useTouch(elementRef, { onTap }, config);
};

// Hook for long press detection
export const useLongPress = (
  elementRef: React.RefObject<HTMLElement>,
  onLongPress: () => void,
  config?: Partial<TouchConfig>
) => {
  return useTouch(elementRef, { onLongPress }, config);
};

export default useTouch;