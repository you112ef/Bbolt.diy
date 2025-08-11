export function isMobile() {
  // we use sm: as the breakpoint for mobile. It's currently set to 640px
  return globalThis.innerWidth < 640;
}

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isTouchDevice();
}

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = globalThis.innerWidth;
  const isMobileUA = /Mobile/i.test(navigator.userAgent);
  const isTabletUA = /Tablet|iPad/i.test(navigator.userAgent);

  if (width < 640 || isMobileUA) {
    return 'mobile';
  }

  if (width < 1024 || isTabletUA) {
    return 'tablet';
  }

  return 'desktop';
}

export function isLandscape(): boolean {
  return globalThis.innerWidth > globalThis.innerHeight;
}

export function getOrientation(): 'portrait' | 'landscape' {
  return isLandscape() ? 'landscape' : 'portrait';
}

export function getScreenDensity(): number {
  return globalThis.devicePixelRatio || 1;
}

export function getViewportSize(): { width: number; height: number } {
  return {
    width: globalThis.innerWidth,
    height: globalThis.innerHeight,
  };
}

export function getSafeAreaInsets(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  // Get CSS env() values for safe areas
  const computedStyle = getComputedStyle(document.documentElement);

  return {
    top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
    bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
    right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0'),
  };
}

export function hasNotch(): boolean {
  const { top } = getSafeAreaInsets();
  return top > 20; // Typical status bar height
}

export function supportsHaptics(): boolean {
  return 'vibrate' in navigator || 'Haptics' in globalThis;
}

export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  if ('Haptics' in globalThis) {
    // Use Capacitor Haptics
    const Haptics = (globalThis as any).Haptics;
    const styles = {
      light: 'LIGHT',
      medium: 'MEDIUM',
      heavy: 'HEAVY',
    };
    Haptics.impact({ style: styles[type] });
  } else if ('vibrate' in navigator) {
    // Fallback to vibration API
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50],
    };
    navigator.vibrate(patterns[type]);
  }
}

export function getConnectionType(): string {
  if ('connection' in navigator) {
    return (navigator as any).connection.effectiveType || 'unknown';
  }

  return 'unknown';
}

export function isBatteryLow(): Promise<boolean> {
  if ('getBattery' in navigator) {
    return (navigator as any).getBattery().then((battery: any) => {
      return battery.level < 0.2; // Less than 20%
    });
  }

  return Promise.resolve(false);
}

export function optimizeForMobile(): void {
  if (!isMobileDevice()) {
    return;
  }

  // Add mobile-specific optimizations
  document.body.classList.add('mobile-device');

  if (isTouchDevice()) {
    document.body.classList.add('touch-device');
  }

  // Add device type class
  document.body.classList.add(`device-${getDeviceType()}`);

  // Add orientation class
  document.body.classList.add(`orientation-${getOrientation()}`);

  // Listen for orientation changes
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      document.body.classList.remove('orientation-portrait', 'orientation-landscape');
      document.body.classList.add(`orientation-${getOrientation()}`);
    }, 100);
  });

  // Prevent zoom on input focus (iOS)
  const viewport = document.querySelector('meta[name=viewport]');

  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
    );
  }

  // Optimize scrolling
  (document.documentElement.style as any).webkitOverflowScrolling = 'touch';

  // Prevent overscroll
  document.body.style.overscrollBehavior = 'none';
}
