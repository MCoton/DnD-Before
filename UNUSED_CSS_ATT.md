# Unused CSS Attributes Analysis

**Generated:** After codebase analysis  
**Purpose:** Document CSS class names used in JSX components but not defined in `src/index.css`

---

## Summary

This document lists CSS class names that are referenced in JSX/React components but do not have corresponding style definitions in `src/index.css`. These classes will not have any styling applied, which may result in unstyled or incorrectly styled elements.

**Total Unused Classes Found:** 29

---

## Categories of Unused Classes

### 1. Form Input Classes (7 classes)
These classes are used for form elements but lack CSS definitions:

- `input-row` - Used in App.jsx for form label/input rows
- `input-label` - Used in App.jsx for input labels
- `text-input` - Used in App.jsx for text input fields
- `select-input` - Used in App.jsx for select dropdowns
- `number-input` - Used in App.jsx for number input fields
- `level-readonly` - Used in App.jsx for read-only level input
- `input-note` - Used in App.jsx for helper text below inputs

**Impact:** Form inputs may not have consistent styling, spacing, or visual appearance.

**Locations:**
- `src/App.jsx` - Lines 202, 203, 209, 215, 216, 221, 233, 234, 239, 260, 261, 268, 273, 274, 280, 282, 286, 287, 294, 296

---

### 2. Layout/Utility Classes (6 classes)
These appear to be utility classes (possibly intended for Tailwind CSS or similar):

- `flex` - Used in App.jsx line 310
- `flex-col` - Used in App.jsx line 310
- `p-1` - Used in App.jsx line 316
- `border` - Used in App.jsx line 316
- `rounded` - Used in App.jsx line 316

**Note:** These look like Tailwind CSS utility classes, but Tailwind is not configured in this project. They will have no effect.

**Impact:** Elements using these classes will not have the intended flexbox layout, padding, border, or border-radius styling.

**Locations:**
- `src/App.jsx` - Lines 310, 316

---

### 3. Component-Specific Classes (8 classes)

- `calculated-stat` - Used in App.jsx line 300 for calculated statistics display
- `check-box` - Used in App.jsx line 325 for checkbox labels
- `main-stats` - Used in App.jsx line 359 for main stats container
- `details-box` - Used in multiple components (SpellImmunitiesDisplay, SpellSlotDisplay, WeaponProficienciesDisplay, ClassAbilitiesDisplay)
- `inner-border` - Used in statBlock.jsx line 115
- `stat-score-input` - Used in statBlock.jsx line 129 for stat score input fields
- `class-abilities` - Used in ClassAbilitiesDisplay.jsx line 17 (note: `class-abilities-block` is also used but not defined)
- `class-abilities-block` - Used in ClassAbilitiesDisplay.jsx line 34

**Impact:** These components may lack proper styling, spacing, borders, or visual hierarchy.

**Locations:**
- `src/App.jsx` - Lines 300, 325, 359
- `src/components/statBlock.jsx` - Lines 115, 129
- `src/components/ClassAbilitiesDisplay.jsx` - Lines 17, 34
- `src/components/SpellImmunitiesDisplay.jsx` - Line 18
- `src/components/SpellSlotDisplay.jsx` - Line 61
- `src/components/WeaponProficienciesDisplay.jsx` - Lines 34, 51, 65, 112

---

### 4. Saving Throws Related Classes (4 classes)

- `save-entry` - Used in SavingThrowsDisplay.jsx line 74
- `save-label` - Used in SavingThrowsDisplay.jsx line 75
- `save-value` - Used in SavingThrowsDisplay.jsx line 76
- `subcategory-list` - Used in SavingThrowsDisplay.jsx line 72

**Note:** While `saving-throws-block` is defined (as `div.saving-throws-block`), these sub-classes are not.

**Impact:** Saving throw entries may not have proper styling, spacing, or visual formatting.

**Locations:**
- `src/components/SavingThrowsDisplay.jsx` - Lines 72, 74, 75, 76

---

### 5. Class Abilities Related Classes (3 classes)

- `abilities-list` - Used in ClassAbilitiesDisplay.jsx line 53
- `ability-item` - Used in ClassAbilitiesDisplay.jsx line 55
- `current-proficiencies` - Used in WeaponProficienciesDisplay.jsx line 134

**Impact:** Class abilities and proficiencies lists may lack proper list styling, spacing, or item formatting.

**Locations:**
- `src/components/ClassAbilitiesDisplay.jsx` - Lines 53, 55
- `src/components/WeaponProficienciesDisplay.jsx` - Line 134

---

### 6. Special Cases

#### Classes Defined with Element Selectors (Not Truly Missing)
These classes ARE defined in CSS but with element-specific selectors. They work correctly:

- `style13` - Defined as `hr.style13` (line 202)
- `style14` - Defined as `hr.style14` (line 209)
- `saving-throws-block` - Defined as `div.saving-throws-block` (line 330)
- `bonus` - Defined as `.spec-bonuses .bonus` (line 605)

**Status:** ✅ These are correctly defined and will work as intended.

---

## Recommendations

### High Priority
1. **Form Input Classes** - Add styling for all 7 form-related classes to ensure consistent form appearance
2. **Component-Specific Classes** - Add styling for `details-box`, `inner-border`, `stat-score-input`, and other component classes

### Medium Priority
3. **Saving Throws Classes** - Add styling for `save-entry`, `save-label`, `save-value`, `subcategory-list`
4. **Class Abilities Classes** - Add styling for `abilities-list`, `ability-item`, `current-proficiencies`

### Low Priority
5. **Utility Classes** - Either:
   - Remove `flex`, `flex-col`, `p-1`, `border`, `rounded` if not needed, OR
   - Add CSS definitions for these utility classes, OR
   - Configure Tailwind CSS if these were intended to be Tailwind classes

---

## Complete List of Unused Classes

```
abilities-list
ability-item
border
calculated-stat
check-box
class-abilities
class-abilities-block
current-proficiencies
details-box
flex
flex-col
inner-border
input-label
input-note
input-row
level-readonly
main-stats
number-input
p-1
rounded
save-entry
save-label
save-value
subcategory-list
stat-score-input
text-input
select-input
```

**Total:** 27 truly unused classes (excluding the 4 special cases that are defined with element selectors)

---

## How to Fix

1. **Review each unused class** to determine if styling is needed
2. **Add CSS definitions** in `src/index.css` following the existing pattern
3. **Consider using CSS variables** for colors, spacing, etc. to maintain consistency
4. **Test visually** to ensure elements render as expected after adding styles
5. **Remove unused classes** from JSX if they're not needed (e.g., the Tailwind-like utilities)

---

## Notes

- Some classes may be intentionally left unstyled (e.g., utility classes that rely on browser defaults)
- The `details-box` class is used in multiple components and should likely have consistent styling
- Form input classes should follow the existing form element styling patterns in the CSS file
- Consider creating a CSS variable system for consistent spacing, colors, and typography
