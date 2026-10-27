export type CharacterId = 'gabi' | 'gabito';
export type Point = { x: number; y: number };
export type AnimationMode = 'idle' | 'walk' | 'wave' | 'mate' | 'work';
export type Quality = 'auto' | 'high' | 'balanced' | 'low';
export type Appearance = { shirt: string; hair: string; skin: string; beard: boolean; glasses: boolean };
export type Preferences = { reducedMotion: boolean; humor: boolean; quality: Quality; appearance: Appearance };
export type OfficeSelection = CharacterId | 'desk' | 'thermos' | 'coffee' | 'meeting' | 'frame';
export type OfficeCommand =
  | { type: 'select'; id: OfficeSelection }
  | { type: 'action'; id: CharacterId; action: 'wave' | 'mate' | 'work' | 'coffee' | 'tour' }
  | { type: 'camera'; action: 'reset' | 'in' | 'out' | 'follow' | 'stop'; id?: CharacterId }
  | { type: 'preferences'; value: Preferences };
export type OfficeStatus = { following: CharacterId | null; zoom: number; ready: boolean };
// Ambient events cannot masquerade as operational task results.
export type AmbientEvent = { kind: 'ambient'; character: 'gabito'; text: string };
export type AgentTask = { kind: 'real-task'; id: string; state: 'queued' | 'running' | 'done' | 'failed'; evidenceUrl?: string };
export const officeBus = new EventTarget();
export function command(detail: OfficeCommand) { officeBus.dispatchEvent(new CustomEvent('command', { detail })); }
export function select(detail: OfficeSelection) { officeBus.dispatchEvent(new CustomEvent('selection', { detail })); }
