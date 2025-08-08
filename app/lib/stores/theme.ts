import { atom } from 'nanostores';
import { logStore } from './logs';

export type Theme = 'dark' | 'light';

export const kTheme = 'bolt_theme';

export function themeIsDark() {
  return themeStore.get() === 'dark';
}

export const DEFAULT_THEME: Theme = 'light';

export const themeStore = atom<Theme>(initStore());

// Initialize theme from DOM after hydration
if (!import.meta.env.SSR && typeof window !== 'undefined') {
  // Wait for DOM to be ready and then sync with actual theme
  setTimeout(() => {
    const domTheme = document.documentElement?.getAttribute('data-theme') as Theme;
    if (domTheme && (domTheme === 'light' || domTheme === 'dark') && domTheme !== themeStore.get()) {
      themeStore.set(domTheme);
    }
  }, 0);
}

function initStore() {
  // Always return default theme during SSR or initial load to prevent hydration mismatch
  // The theme will be properly initialized by the inline script before React hydration
  // and updated afterward through the subscription mechanism
  
  if (import.meta.env.SSR) {
    return DEFAULT_THEME;
  }
  
  // On client side, still return default initially to prevent hydration mismatch
  // The actual theme will be set after hydration via DOM attributes or localStorage
  return DEFAULT_THEME;
}

export function toggleTheme() {
  const currentTheme = themeStore.get();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  // Update the theme store
  themeStore.set(newTheme);

  // Update localStorage
  try {
    localStorage.setItem(kTheme, newTheme);
  } catch (error) {
    console.error('Error updating localStorage theme:', error);
  }

  // Update the HTML attributes and classes
  const html = document.documentElement;
  html.setAttribute('data-theme', newTheme);
  html.classList.remove('theme-light', 'theme-dark');
  html.classList.add('theme-' + newTheme);

  // Update user profile if it exists
  try {
    const userProfile = localStorage.getItem('bolt_user_profile');

    if (userProfile) {
      const profile = JSON.parse(userProfile);
      profile.theme = newTheme;
      localStorage.setItem('bolt_user_profile', JSON.stringify(profile));
    }
  } catch (error) {
    console.error('Error updating user profile theme:', error);
  }

  logStore.logSystem(`Theme changed to ${newTheme} mode`);
}
