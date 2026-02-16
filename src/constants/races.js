/**
 * Consolidated race data.
 * Merges stat requirements, racial modifiers, and level limits into a single source of truth.
 *
 * Each race entry contains:
 *   requirements - per-stat min/max bounds for character creation eligibility
 *   statAdj      - racial adjustments applied to raw scores
 *   saveBonus    - racial saving throw bonus, or null if none
 *   levelLimits  - maximum level attainable per class; 30 = unlimited, omitted = unavailable
 *
 * Note: requirements min/max values always fall within the global STAT_MIN/STAT_MAX
 * bounds defined in characterLimits.js.
 */

export const RACES = {
    dwarf: {
        requirements: {
            str: { min: 8,  max: 18 },
            dex: { min: 3,  max: 17 },
            con: { min: 11, max: 18 },
            int: { min: 3,  max: 18 },
            wis: { min: 3,  max: 18 },
            cha: { min: 3,  max: 17 }
        },
        statAdj: { con: 1, cha: -1 },
        saveBonus: {
            source: "con",
            appliesTo: ["poison", "rsw", "spell"]
        },
        levelLimits: {
            cleric:  10,
            fighter: 15,
            thief:   12
        }
    },

    elf: {
        requirements: {
            str: { min: 3, max: 18 },
            dex: { min: 6, max: 18 },
            con: { min: 7, max: 18 },
            int: { min: 8, max: 18 },
            wis: { min: 3, max: 18 },
            cha: { min: 8, max: 18 }
        },
        statAdj: { dex: 1, con: -1 },
        saveBonus: null,
        levelLimits: {
            cleric:  12,
            fighter: 15,
            mage:    15,
            ranger:  15,
            thief:   12
        }
    },

    gnome: {
        requirements: {
            str: { min: 6, max: 18 },
            dex: { min: 3, max: 18 },
            con: { min: 8, max: 18 },
            int: { min: 6, max: 18 },
            wis: { min: 3, max: 18 },
            cha: { min: 3, max: 18 }
        },
        statAdj: { int: 1, wis: -1 },
        saveBonus: {
            source: "con",
            appliesTo: ["rsw", "spell"]
        },
        levelLimits: {
            cleric:      9,
            fighter:     11,
            illusionist: 15,
            thief:       13
        }
    },

    "half-elf": {
        requirements: {
            str: { min: 3, max: 18 },
            dex: { min: 6, max: 18 },
            con: { min: 6, max: 18 },
            int: { min: 4, max: 18 },
            wis: { min: 3, max: 18 },
            cha: { min: 3, max: 18 }
        },
        statAdj: {},
        saveBonus: null,
        levelLimits: {
            bard:    30,
            cleric:  14,
            druid:   9,
            fighter: 14,
            mage:    12,
            ranger:  16,
            thief:   12
        }
    },

    "half-orc": {
        requirements: {
            str: { min: 6, max: 18 },
            dex: { min: 3, max: 17 },
            con: { min: 8, max: 18 },
            int: { min: 3, max: 17 },
            wis: { min: 3, max: 14 },
            cha: { min: 3, max: 12 }
        },
        statAdj: { str: 1, con: 1, cha: -2 },
        saveBonus: null,
        levelLimits: {
            cleric:  4,
            fighter: 10,
            thief:   8
        }
    },

    "half-ogre": {
        requirements: {
            str: { min: 14, max: 18 },
            dex: { min: 3,  max: 12 },
            con: { min: 14, max: 18 },
            int: { min: 3,  max: 12 },
            wis: { min: 3,  max: 12 },
            cha: { min: 3,  max: 8  }
        },
        statAdj: { str: 1, con: 1, int: -1, cha: -1 },
        saveBonus: null,
        levelLimits: {
            fighter: 12
        }
    },

    halfling: {
        requirements: {
            str: { min: 7,  max: 18 },
            dex: { min: 7,  max: 18 },
            con: { min: 10, max: 18 },
            int: { min: 6,  max: 18 },
            wis: { min: 3,  max: 17 },
            cha: { min: 3,  max: 18 }
        },
        statAdj: { dex: 1, str: -1 },
        saveBonus: {
            source: "con",
            appliesTo: ["poison", "rsw", "spell"]
        },
        levelLimits: {
            cleric:  4,
            fighter: 9,
            thief:   15
        }
    },

    human: {
        requirements: {
            str: { min: 3, max: 18 },
            dex: { min: 3, max: 18 },
            con: { min: 3, max: 18 },
            int: { min: 3, max: 18 },
            wis: { min: 3, max: 18 },
            cha: { min: 3, max: 18 }
        },
        statAdj: {},
        saveBonus: null,
        levelLimits: {
            bard:        30,
            cleric:      30,
            druid:       30,
            fighter:     30,
            illusionist: 30,
            mage:        30,
            paladin:     30,
            ranger:      30,
            thief:       30
        }
    }
};