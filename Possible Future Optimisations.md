# Possible Future Optimisations

Hypothetical optimisations for the dnd-2nd-sheet data structures to improve **ease of maintenance** and **minimise data loading**. No code changes have been made; this document is for planning.

---

## 1. Data loading and bundle size

**Current pattern:** Data is loaded via static `import ... from './data/....json'`. Whatever is on the app’s dependency graph is bundled and parsed at build time. There is no lazy loading or code-splitting by data.

**Hypothetical optimisations:**

- **Spell lists**  
  `wizard_spells.json` and `priest_spells.json` are very large and only used by spell-related components. You could:
  - Load them with **dynamic `import()`** when the user opens the spell book / spell UI, so they’re in a separate chunk and not in the initial bundle.
  - Optionally split by spell level or class (e.g. `wizard_spells_1.json`, …) and load only the level/tab the user is viewing, at the cost of more requests and more complex wiring.

- **Single “data entry point”**  
  `character_classes.json` is imported in many places (App, rulesEngine, WeaponProficienciesDisplay, NonWeapProfDisplay, SpellDisplay, etc.). You could:
  - Import it **once** in a small `data/index.js` (or similar) and re-export it; other modules import from that. You don’t reduce total data size, but you avoid multiple copies in the bundle and make it obvious where class data lives.

- **Stat tables**  
  The six stat tables + armour are small and used in `rulesEngine`. You could leave them as-is or merge them into one `statTables.json` (or one module that imports all) so there’s one place to manage and one “stat data” chunk instead of many tiny files.

So: **minimising data loading** in practice means “load big, optional data (spells) only when needed” and “avoid duplicating the same big JSON in the bundle”; the rest is minor.

---

## 2. Ease of maintenance (structure and consistency)

**Stable IDs vs display text**

- Weapon keys, class keys (`fighter`, `paladin`), race keys are used as **identifiers** in state and in code. You already had to add migration when weapon keys changed.
- **Hypothetical improvement:** Treat IDs as stable (e.g. `weaponId`, `classId`) and keep “display name” in the data (`name`, `label`). So you’d rarely change IDs; you’d only change labels. No code change required to *start* doing this—just a convention and future edits—but any ID rename would still need a one-off migration.

**Normalise repeated strings**

- In `nonWeaponProficiencies.json`, `category` uses strings like `"GENERAL"`, `"Pr"`, `"Rg"`, `"Dw Cr"`. The same tokens appear in many entries.
- **Hypothetical improvement:** Replace with a small **lookup** (e.g. a tiny JSON or constant map) from code → display text. The data file would store only codes (e.g. `["general","pr"]`); the app would resolve to “General, Priest” for display. Maintenance: change the label in one place; no need to grep through the whole proficiency list.

**Single source of truth for “class + abilities”**

- Classes live in `character_classes.json`; ability text in `character_abilities_text.json`, keyed by class. Two places to keep in sync when you add or rename a class.
- **Hypothetical improvement:** Either embed ability text inside each class in `character_classes.json`, or have one small “class list” that references both files by ID. That way “add a class” or “change class name” has one procedure. Again, this is mostly structural/organisational; you could do it without changing runtime code by just moving/merging JSON and updating the one place that reads them.

**Weapon / proficiency data**

- `weapons.json` is one big object; `nonWeaponProficiencies.json` is one big array. Optional future split (e.g. weapons by type, or proficiencies by category) could make editing easier and reduce merge conflicts, without necessarily changing how the app loads them (e.g. build step could concatenate them).

---

## 3. Summary table

| Area | Current | Possible optimisation | Effect |
|------|--------|------------------------|--------|
| Spell lists | Static import, part of main bundle | Dynamic `import()` when spell UI opens | Smaller initial load; spells loaded only when needed |
| Class data | Imported in many files | Single re-export (e.g. `data/index.js`) | One source, smaller risk of duplicate payload |
| Stat tables | 6 + armour files | One combined file or one re-export | Fewer files to touch; same data size |
| IDs (weapon, class, race) | Keys used as IDs | Treat IDs as stable; rename only display fields | Fewer migrations; clearer maintenance |
| Category strings | Repeated in many rows | Small code → label map; data stores codes | One place to change wording |
| Class vs abilities | Two JSONs keyed by class | One structure or one “class manifest” | Add/rename class in one place |

---

*Document generated from analysis of the current codebase and data structures.*
