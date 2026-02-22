# CSS refactor analysis

Analysis of `src/index.css` (~2,300 lines) for responsiveness and redundancy. Use this as a guide for refactoring.

---

## 1. What’s working well

- **Design tokens in `:root`** – Colors, spacing (`--spacing-xs` through `--spacing-xl`), typography scale (`--font-size-xs` through `--font-size-3xl`), and `--container-max-width` are already centralized.
- **Mobile-first layout** – Base styles are for small screens; media queries generally use `min-width` to step up.
- **Section comments** – Clear block headers (e.g. ROOT & RESET, TYPOGRAPHY, LAYOUT GRID) make the file easier to navigate.

---

## 2. Breakpoint inconsistencies

**Current breakpoints in use:**

| Value   | Used as        | Occurrences |
|--------|-----------------|------------|
| 480px  | min-width       | 2 (saves-grid, spell-slots-grid) |
| 640px  | min-width       | 2 (container, spell-modal-info-grid) |
| 768px  | min-width       | 5 (wrapper, container, saves, combat, proficiencies, spell-slots) |
| 768px  | max-width       | 1 (wrapper force single column) |
| 767px  | max-width       | 3 (proficiencies, weapon table, proficiencies-table) |
| 1024px | min-width       | 5 (wrapper, container, saves, spell-modal, etc.) |
| 1024px | max-width       | 1 (prepared-spells-layout) |

**Issues:**

- **768 vs 767** – Both used for “below tablet”: one rule uses `max-width: 768px`, three use `max-width: 767px`. That creates a 1px gap and duplicated logic. Pick one (e.g. `768px`) and use it everywhere.
- **No single source of truth** – Breakpoints are magic numbers. Responsiveness would be clearer and easier to change if they lived in one place.

**Recommendation:** Add breakpoint custom properties and use them everywhere:

```css
:root {
  /* Breakpoints (for reference in media queries) */
  --bp-sm: 480px;
  --bp-md: 640px;
  --bp-lg: 768px;
  --bp-xl: 1024px;
}
```

Then use them in media queries, e.g. `@media (min-width: var(--bp-lg)) { ... }`. Optionally keep a small comment listing the intended device ranges (phone / tablet / desktop) next to these variables.

---

## 3. Redundant patterns

### 3.1 Modal backdrops (duplicate blocks)

**`.spell-modal-backdrop`** and **`.thief-allocation-modal-backdrop`** are effectively the same:

- `position: fixed; top/left/right/bottom: 0`
- `background-color: rgba(0, 0, 0, 0.7)`
- `display: flex; align-items: center; justify-content: center`
- `z-index: 1000`
- `padding: var(--spacing-md); overflow-y: auto`

**Refactor:** Introduce a shared class, e.g. `.modal-backdrop`, and use it for both modals. Keep spell/thief-specific classes only for overrides (e.g. thief modal max-width) if needed.

### 3.2 Modal panels

**`.spell-modal`** and **`.thief-allocation-modal`** share:

- `position: relative`
- `background-color: var(--color-bg-primary)`
- `border-radius: 8px`
- `padding: var(--spacing-lg)`
- `width: 100%; max-height: 90vh; overflow-y: auto`
- `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3)`
- `border: 2px solid var(--color-accent-primary)`

Only real difference: `max-width` (600px vs 420px).

**Refactor:** Use a base class, e.g. `.modal-panel`, and a modifier or custom property for max-width (e.g. `.modal-panel--wide` or `--modal-max-width`).

### 3.3 Modal close buttons

**`.spell-modal-close`** and **`.thief-allocation-modal-close`** are almost identical (position, reset, size, hover). Unify under something like `.modal-close` and adjust size/position with a variable or modifier if needed.

### 3.4 Border radius

- **4px** – Used many times (area-box, buttons, inputs, cards, tables, modals).
- **8px** – Used for main buttons, form controls, and modal panels.

**Refactor:** In `:root`, add e.g. `--radius-sm: 4px;` and `--radius-md: 8px;` and replace raw `4px`/`8px` with these variables. Easier to tune globally and keeps the design system consistent.

### 3.5 Repeated responsive grid pattern

Same progression appears in several places:

- Base: 1 column
- At 640px or 768px: `repeat(2, 1fr)`
- At 1024px: `repeat(3, 1fr)` (or `repeat(5, 1fr)` for saves, or `repeat(auto-fit, minmax(120px, 1fr))`)

**Refactor options:**

- Add a small set of layout utility classes, e.g. `.grid-responsive` that applies this 1 → 2 → 3 column behaviour using the same breakpoint variables.
- Or keep component-specific grids but define the breakpoints and column counts in one place (e.g. a short “Layout” section) so changes are consistent.

### 3.6 Number input styling

`input[type="number"]` is styled in three separate blocks (general form styling, `text-align: center`, spinner removal). **Refactor:** Group all `input[type="number"]` rules in one block (or one “Form elements – number” subsection) to avoid duplication and make overrides clearer.

### 3.7 Scrollable tables on small screens

Weapon proficiency table and proficiencies table both use:

- `@media (max-width: 767px)` (or 768px after unifying)
- `font-size: 0.85em; display: block; overflow-x: auto` (and sometimes `-webkit-overflow-scrolling: touch`)

**Refactor:** Introduce a shared class, e.g. `.table-scroll-wrap` or `.table-responsive`, and apply it to the wrapper or the table so this behaviour is defined once.

---

## 4. Responsiveness improvements

### 4.1 Wrapper and single-column override

Currently:

- Default: `grid-template-columns: 1fr`
- `@media (max-width: 768px)`: `grid-template-columns: 1fr !important` and children forced to full width

The “max-width 768px” rule repeats the same single-column layout that is already the default. So on small screens the layout doesn’t actually change unless you have a different default elsewhere.

**Refactor:** If the only goal is “below 768px, force one column and full-width children”, consider:

- Dropping the `!important` and the duplicate `1fr` if the base layout is already one column.
- Or documenting why the override is needed (e.g. to override a more complex default) and keeping a single, well-named media query (e.g. “Force single column below tablet”) with one breakpoint variable.

### 4.2 Central breakpoint usage

After introducing `--bp-sm`, `--bp-md`, `--bp-lg`, `--bp-xl`:

- Replace every raw `480px`, `640px`, `768px`, `767px`, `1024px` in media queries with the corresponding variable.
- Use one convention for “below tablet” (e.g. `max-width: 767px` or `max-width: 768px`) and stick to it everywhere.

This will make the layout easier to tweak (e.g. “tablet” = 768 vs 800) and to reason about.

### 4.3 Touch and small viewports

- `min-width: 314px` on `body` is good; consider documenting why (e.g. minimum supported width).
- For scrollable tables, `-webkit-overflow-scrolling: touch` is already used in at least one place; apply the same pattern anywhere else that has horizontal scroll on touch devices.

---

## 5. Suggested refactor order

1. **Low risk**
   - Add `--radius-sm`, `--radius-md` (and optionally `--radius-lg`) and replace literal 4px/8px.
   - Add `--bp-*` variables and use them in every media query; unify 767/768 to one value.
   - Consolidate `input[type="number"]` rules into one block.

2. **Medium risk (test modals and layout)**
   - Introduce `.modal-backdrop`, `.modal-panel`, `.modal-close`; refactor spell and thief modals to use them plus minimal overrides.
   - Introduce a shared “scrollable table” pattern and use it for weapon and non-weapon proficiency tables.

3. **Optional / larger change**
   - Add a small set of layout utilities (e.g. `.grid-1-2-3`) if you find yourself repeating the same grid breakpoints in new components.
   - Consider splitting `index.css` into logical partials (e.g. `variables.css`, `layout.css`, `modals.css`, `tables.css`) and `@import` in `index.css` if the file grows or you want clearer ownership of sections.

---

## 6. Quick reference: breakpoints and tokens to add

```css
/* In :root, add or confirm: */
--bp-sm: 480px;
--bp-md: 640px;
--bp-lg: 768px;
--bp-xl: 1024px;

--radius-sm: 4px;
--radius-md: 8px;
```

Use `var(--bp-lg)` (and similar) in media queries and `var(--radius-sm)` / `var(--radius-md)` for border-radius to reduce magic numbers and make future tweaks easier.
