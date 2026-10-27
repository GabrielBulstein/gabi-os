import type { Preferences } from './types';
export const preferenceKey = 'gabi-pixel-office:preferences:v1';
export const defaultPreferences: Preferences = {
  reducedMotion: false, humor: true, quality: 'auto',
  appearance: { shirt: '#bc7253', hair: '#5a4035', skin: '#d6a47c', beard: false, glasses: false },
};
export function readPreferences(): Preferences {
  const base = structuredClone(defaultPreferences);
  base.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    const data = JSON.parse(localStorage.getItem(preferenceKey) || 'null');
    if (!data || typeof data !== 'object') return base;
    for (const key of ['reducedMotion', 'humor'] as const) if (typeof data[key] === 'boolean') base[key] = data[key];
    if (['auto','high','balanced','low'].includes(data.quality)) base.quality = data.quality;
    if (data.appearance && typeof data.appearance === 'object') {
      for (const key of ['shirt','hair','skin'] as const) if (/^#[a-f\d]{6}$/i.test(data.appearance[key])) base.appearance[key] = data.appearance[key];
      for (const key of ['beard','glasses'] as const) if (typeof data.appearance[key] === 'boolean') base.appearance[key] = data.appearance[key];
    }
  } catch { /* Preferences are optional in private browsing. */ }
  return base;
}
export function savePreferences(value: Preferences): boolean {
  try { localStorage.setItem(preferenceKey, JSON.stringify(value)); return true; } catch { return false; }
}
