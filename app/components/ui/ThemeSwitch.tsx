import { useStore } from '@nanostores/react';
import { memo, useEffect, useState } from 'react';
import { themeStore, toggleTheme } from '~/lib/stores/theme';
import { IconButton } from './IconButton';

interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch = memo(({ className }: ThemeSwitchProps) => {
  const [domLoaded, setDomLoaded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Get theme from DOM or store after hydration
    const theme = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || themeStore.get();
    setCurrentTheme(theme);
    setDomLoaded(true);

    // Subscribe to theme changes
    const unsubscribe = themeStore.subscribe((newTheme) => {
      setCurrentTheme(newTheme);
    });

    return unsubscribe;
  }, []);

  return (
    domLoaded && (
      <IconButton
        className={className}
        icon={currentTheme === 'dark' ? 'i-ph-sun-dim-duotone' : 'i-ph-moon-stars-duotone'}
        size="xl"
        title="Toggle Theme"
        onClick={toggleTheme}
      />
    )
  );
});
