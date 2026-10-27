export const characterIds = ['gabi','gabito','profe','migue','pame','nacho','kevin','dexter'] as const;
export type CharacterId = typeof characterIds[number];
export type Point = { x: number; y: number };
export type AnimationMode = 'idle' | 'walk' | 'wave' | 'mate' | 'work' | 'specialty' | 'react' | 'talk' | 'look';
export type Quality = 'auto' | 'high' | 'balanced' | 'low';
export type Appearance = { shirt: string; hair: string; skin: string; beard: boolean; glasses: boolean; hairstyle: 'short'|'curly'|'long'; outfit: 'sweater'|'hoodie'|'shirt'; accessory: 'none'|'cap'|'headphones' };
export type TimePreview = 'real'|'morning'|'day'|'evening'|'night';
export type Preferences = { reducedMotion: boolean; humor: boolean; humorFrequency:'low'|'moderate'; quality: Quality; details:boolean; welcome:boolean; timePreview:TimePreview; musicVolume:number; effectsVolume:number; appearance: Appearance };
export const hotspotIds = ['desk','meeting','coffee','board','copier','reception','thermos'] as const;
export type HotspotId = typeof hotspotIds[number];
export type OfficeSelection = CharacterId | HotspotId | 'frame';
export type CharacterAction = 'wave'|'mate'|'work'|'coffee'|'tour'|'specialty'|'react'|'look';
export type SceneId = 'budget'|'bugs'|'printer'|'lesson'|'recruit'|'meeting'|'welcome';
export type OfficeCommand =
  | { type: 'select'; id: OfficeSelection }
  | { type: 'action'; id: CharacterId; action: CharacterAction }
  | { type:'scene'; id:SceneId } | {type:'stop-scene'}
  | { type: 'camera'; action: 'reset' | 'in' | 'out' | 'follow' | 'stop'; id?: CharacterId }
  | { type: 'preferences'; value: Preferences };
export type OfficeStatus = { following: CharacterId | null; zoom: number; ready: boolean };
// Ambient events cannot masquerade as operational task results.
export type AmbientEvent = { kind: 'ambient'; character: Exclude<CharacterId,'gabi'>; text: string };
export type AgentTask = { kind: 'real-task'; id: string; state: 'queued' | 'running' | 'done' | 'failed'; evidenceUrl?: string };
export const officeBus = new EventTarget();
export function command(detail: OfficeCommand) { officeBus.dispatchEvent(new CustomEvent('command', { detail })); }
export function select(detail: OfficeSelection) { officeBus.dispatchEvent(new CustomEvent('selection', { detail })); }
