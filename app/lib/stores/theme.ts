import { atom } from 'nanostores';
import { logStore } from './logs';

export type Theme = 'dark' | 'light';

export const kTheme = 'bolt_theme';

export function themeIsDark() {
  return themeStore.get() === 'dark';
}

export const DEFAULT_THEME = 'light';

export const themeStore = atom<Theme>(initStore());

function initStore() {
  // Always start with default theme to prevent hydration mismatch
  // The actual theme will be set by the inline script and then updated after hydration
  if (!import.meta.env.SSR) {
    // Check if theme is already set in DOM (by inline script)
    const themeAttribute = document.documentElement?.getAttribute('data-theme') as Theme;
    if (themeAttribute && (themeAttribute === 'light' || themeAttribute === 'dark')) {
      return themeAttribute;
    }
    
    // Fallback to localStorage if DOM isn't ready yet
    try {
      const persistedTheme = localStorage.getItem(kTheme) as Theme | undefined;
      if (persistedTheme && (persistedTheme === 'light' || persistedTheme === 'dark')) {
        return persistedTheme;
      }
    } catch {
      // localStorage might not be available
    }
  }

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
