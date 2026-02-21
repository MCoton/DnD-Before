/**
 * Thief-specific constants and derived config.
 * Single source of truth for skill keys/order and point rules.
 */

import thiefAbilitiesData from '../data/classes/character_abilities_text.json';

/** Display order and full list of thief skill keys (used by rulesEngine and ThiefAbilitiesDisplay). */
export const THIEF_SKILL_ORDER = [
    'pickPockets',
    'openLocks',
    'findRemoveTraps',
    'moveSilently',
    'hideInShadows',
    'detectNoise',
    'climbWalls',
    'readLanguages'
];

/**
 * Thief skill point rules from character_abilities_text.json.
 * @returns {{ startingSkillPoints: number, skillPointsPerLevel: number }}
 */
export function getThiefPointRules() {
    const thief = thiefAbilitiesData?.thief || {};
    return {
        startingSkillPoints: thief.startingSkillPoints ?? 60,
        skillPointsPerLevel: thief.skillPointsPerLevel ?? 30
    };
}

/** Max thief skill percentage (0–99). */
export const THIEF_SKILL_PERCENT_CAP = 99;
