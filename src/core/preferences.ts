import type { Preferences } from './types';
export const preferenceKey = 'gabi-pixel-office:preferences:v1';
export const defaultPreferences: Preferences = {
  reducedMotion: false, humor: true, humorFrequency:'moderate', quality: 'auto', details:true,welcome:true,timePreview:'real',musicVolume:.2,effectsVolume:.3,
  appearance: { shirt: '#bc7253', hair: '#5a4035', skin: '#d6a47c', beard: false, glasses: false,hairstyle:'short',outfit:'sweater',accessory:'none' },
};
export function readPreferences(): Preferences {
  const base = structuredClone(defaultPreferences);
  base.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    const data = JSON.parse(localStorage.getItem(preferenceKey) || 'null');
    if (!data || typeof data !== 'object') return base;
    for (const key of ['reducedMotion', 'humor','details','welcome'] as const) if (typeof data[key] === 'boolean') base[key] = data[key];
    if (['auto','high','balanced','low'].includes(data.quality)) base.quality = data.quality;
    if(['low','moderate'].includes(data.humorFrequency))base.humorFrequency=data.humorFrequency;
    if(['real','morning','day','evening','night'].includes(data.timePreview))base.timePreview=data.timePreview;
    for(const key of ['musicVolume','effectsVolume'] as const)if(typeof data[key]==='number'&&Number.isFinite(data[key]))base[key]=Math.max(0,Math.min(1,data[key]));
    if (data.appearance && typeof data.appearance === 'object') {
      for (const key of ['shirt','hair','skin'] as const) if (/^#[a-f\d]{6}$/i.test(data.appearance[key])) base.appearance[key] = data.appearance[key];
      for (const key of ['beard','glasses'] as const) if (typeof data.appearance[key] === 'boolean') base.appearance[key] = data.appearance[key];
      if(['short','curly','long'].includes(data.appearance.hairstyle))base.appearance.hairstyle=data.appearance.hairstyle;
      if(['sweater','hoodie','shirt'].includes(data.appearance.outfit))base.appearance.outfit=data.appearance.outfit;
      if(['none','cap','headphones'].includes(data.appearance.accessory))base.appearance.accessory=data.appearance.accessory;
    }
  } catch { /* Preferences are optional in private browsing. */ }
  return base;
}
export function savePreferences(value: Preferences): boolean {
  try { localStorage.setItem(preferenceKey, JSON.stringify(value)); return true; } catch { return false; }
}
