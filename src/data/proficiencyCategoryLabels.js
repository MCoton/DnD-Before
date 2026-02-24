/**
 * Lookup: category code → display label for non-weapon proficiency categories.
 * Used to resolve category codes from nonWeaponProficiencies.json for display.
 */
export const PROFICIENCY_CATEGORY_LABELS = {
  general: 'General',
  dw_cr: 'Dwarf (Craftsman)',
  dw_gen: 'Dwarf (General)',
  dw_pr: 'Dwarf (Priest)',
  dw_rg: 'Dwarf (Rogue)',
  dw_sp: 'Dwarf (Special)',
  dw_wr: 'Dwarf (Warrior)',
  el_rg_restricted: 'Elf (Rogue @)',
  el_wr: 'Elf (Warrior)',
  gn_rg_restricted: 'Gnome (Rogue @)',
  gn_wr: 'Gnome (Warrior)',
  hu_gen: 'Human (General)',
  pr: 'Priest',
  rangers: 'Rangers',
  rg: 'Rogue',
  rg_restricted: 'Rogue (@)',
  wr: 'Warrior',
  wz: 'Wizard',
};

/**
 * Format a category array (codes) as a display string.
 * @param {string[]} categoryCodes - Array of category codes
 * @returns {string} e.g. "General, Priest, Dwarf (Craftsman)"
 */
export function formatProficiencyCategory(categoryCodes) {
  if (!Array.isArray(categoryCodes) || categoryCodes.length === 0) {
    return '';
  }
  return categoryCodes
    .map((code) => PROFICIENCY_CATEGORY_LABELS[code] ?? code)
    .join(', ');
}
