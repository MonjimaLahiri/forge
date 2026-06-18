import type { App, Widget } from './types';
import { THUMBNAIL_COLORS } from './mock-data';

const APPS_KEY = 'forge_apps';
const LEGACY_DRAFT_KEY = 'forge_builder_draft';
const MOCK_OWNER_ID = 'mock_user';

function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random suffix (avoids counter reset on page reload)
  return `app_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function pickThumbnail(existingCount: number): string {
  const keys = Object.keys(THUMBNAIL_COLORS);
  return keys[existingCount % keys.length];
}

// One-time migration: the builder used to persist a single global draft under
// a different key. If that draft has content and the new apps array hasn't
// been created yet, convert it into the first saved app, then drop the old key.
function migrateLegacyDraft(): void {
  if (localStorage.getItem(APPS_KEY) !== null) return;

  try {
    const raw = localStorage.getItem(LEGACY_DRAFT_KEY);
    if (!raw) return;

    const legacy = JSON.parse(raw) as { name?: string; widgets?: Widget[] };
    if (!legacy.widgets || legacy.widgets.length === 0) return;

    const now = new Date().toISOString();
    const migrated: App = {
      id: genId(),
      name: legacy.name?.trim() || 'Untitled App',
      description: '',
      status: 'draft',
      thumbnail: pickThumbnail(0),
      ownerId: MOCK_OWNER_ID,
      createdAt: now,
      updatedAt: now,
      widgets: legacy.widgets,
    };
    localStorage.setItem(APPS_KEY, JSON.stringify([migrated]));
  } catch {
    // corrupt legacy data — nothing safe to migrate, leave the apps array empty
  } finally {
    localStorage.removeItem(LEGACY_DRAFT_KEY);
  }
}

function readApps(): App[] {
  if (typeof window === 'undefined') return [];
  migrateLegacyDraft();
  try {
    const raw = localStorage.getItem(APPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeApps(apps: App[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(APPS_KEY, JSON.stringify(apps));
  } catch {
    // storage may be full or blocked by browser policy
  }
}

export function listApps(): App[] {
  return readApps();
}

export function getApp(id: string): App | null {
  return readApps().find((a) => a.id === id) ?? null;
}

export function createApp(name = 'Untitled App'): App {
  const apps = readApps();
  const now = new Date().toISOString();
  const app: App = {
    id: genId(),
    name,
    description: '',
    status: 'draft',
    thumbnail: pickThumbnail(apps.length),
    ownerId: MOCK_OWNER_ID,
    createdAt: now,
    updatedAt: now,
    widgets: [],
  };
  writeApps([...apps, app]);
  return app;
}

export function saveApp(id: string, patch: Partial<Pick<App, 'name' | 'widgets'>>): void {
  const apps = readApps();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return;
  apps[idx] = { ...apps[idx], ...patch, updatedAt: new Date().toISOString() };
  writeApps(apps);
}

export function deleteApp(id: string): void {
  writeApps(readApps().filter((a) => a.id !== id));
}

export function publishApp(id: string): App | null {
  const apps = readApps();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  apps[idx] = { ...apps[idx], status: 'published', publishedAt: now, updatedAt: now };
  writeApps(apps);
  return apps[idx];
}

export function duplicateApp(id: string): App | null {
  const apps = readApps();
  const original = apps.find((a) => a.id === id);
  if (!original) return null;

  const now = new Date().toISOString();
  const copy: App = {
    ...original,
    id: genId(),
    name: `${original.name} Copy`,
    status: 'draft',
    thumbnail: pickThumbnail(apps.length),
    createdAt: now,
    updatedAt: now,
    publishedAt: undefined,
    // Deep clone so editing the copy can never mutate the original's widgets.
    widgets: JSON.parse(JSON.stringify(original.widgets)),
  };
  writeApps([...apps, copy]);
  return copy;
}
