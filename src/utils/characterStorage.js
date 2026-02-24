/**
 * Character sheet persistence: localStorage (auto-save/restore) and file export/import.
 */

const STORAGE_KEY = 'dnd-2nd-sheet-character';
const SAVE_FORMAT_VERSION = 1;

/** Legacy weapon keys -> current keys (sword-*, hammer-* convention). */
const WEAPON_KEY_MIGRATION = {
  'bastard-sword': 'sword-bastard',
  'broad-sword': 'sword-broad',
  'long-sword': 'sword-long',
  'short-sword': 'sword-short',
  'two-handed-sword': 'sword-two-handed',
  'scimitar': 'sword-scimitar',
  'khopesh': 'sword-khopesh',
  'rapier': 'sword-rapier',
  'warhammer': 'hammer-war',
  'lucern-hammer': 'hammer-lucern',
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep-merge loaded data with initial state so missing keys get defaults and structure stays valid.
 * Prefers loaded values where present; uses initial for missing or invalid structure.
 */
export function mergeWithInitial(loaded, initial) {
  if (loaded === null || typeof loaded !== 'object') return initial;
  if (Array.isArray(initial)) return Array.isArray(loaded) ? loaded : initial;

  const merged = {};
  const keys = new Set([...Object.keys(initial), ...Object.keys(loaded)]);

  for (const key of keys) {
    const initialVal = initial[key];
    const loadedVal = loaded[key];

    if (loadedVal === undefined) {
      merged[key] = initialVal;
    } else if (isPlainObject(initialVal) && isPlainObject(loadedVal)) {
      merged[key] = mergeWithInitial(loadedVal, initialVal);
    } else {
      merged[key] = loadedVal;
    }
  }

  return merged;
}

/**
 * Migrate weaponProficiencies keys from legacy names to current (sword-*, hammer-*) keys.
 */
function migrateWeaponProficiencies(character) {
  const prof = character?.weaponProficiencies;
  if (!prof || typeof prof !== 'object') return character;
  const next = {};
  for (const [key, slots] of Object.entries(prof)) {
    next[WEAPON_KEY_MIGRATION[key] ?? key] = slots;
  }
  return { ...character, weaponProficiencies: next };
}

/**
 * Save character to localStorage (used for auto-save and "restore last" on load).
 */
export function saveToStorage(character) {
  try {
    const payload = { version: SAVE_FORMAT_VERSION, character };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Character save to localStorage failed:', e);
  }
}

/**
 * Load character from localStorage. Returns merged state or null if none/error.
 */
export function loadFromStorage(initialCharacterState) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { character } = JSON.parse(raw);
    if (!character || typeof character !== 'object') return null;
    const merged = mergeWithInitial(character, initialCharacterState);
    return migrateWeaponProficiencies(merged);
  } catch (e) {
    console.warn('Character load from localStorage failed:', e);
    return null;
  }
}

/**
 * Clear saved character from localStorage.
 */
export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Clear localStorage failed:', e);
  }
}

/**
 * Build downloadable JSON (includes version for future import compatibility).
 */
export function exportToJsonBlob(character) {
  const payload = { version: SAVE_FORMAT_VERSION, character };
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

/**
 * Parse imported JSON string and return merged character state.
 * @throws {Error} if JSON is invalid or not a supported character export.
 */
export function parseImportedJson(jsonString, initialCharacterState) {
  const data = JSON.parse(jsonString);
  const character = data?.character ?? data;
  if (!character || typeof character !== 'object') {
    throw new Error('Invalid character file: missing character data');
  }
  const merged = mergeWithInitial(character, initialCharacterState);
  return migrateWeaponProficiencies(merged);
}
