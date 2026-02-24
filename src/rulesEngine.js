// Rules Engine Imports
import strTable from './data/statTables/strength_table.json';
import dexTable from "./data/statTables/dexterity_table.json";
import conTable from "./data/statTables/constitution_table.json";
import intTable from "./data/statTables/intelligence_table.json";
import wisTable from "./data/statTables/wisdom_table.json";
import chaTable from "./data/statTables/charisma_table.json";
import { RACES } from "./constants/races.js";
import charClasses from "./data/classes/character_classes.json";
import charAbilities from "./data/classes/character_abilities_text.json"
import armourTable from "./data/equipment/armour_class.json";
import { SAVE_CATEGORY_MAP, SAVE_CATEGORY_LABELS } from './constants.js';
import { THIEF_SKILL_ORDER, THIEF_SKILL_PERCENT_CAP } from './constants/thief.js';
import { capitaliseWords, clamp } from './utils.js';

/**
 * Calculates racial save bonus for a given race.
 * 
 * @param {object} saveBonusData - The race's saveBonus object from RACES (races.js)
 * @param {object} adjustedScores - The character's adjusted ability scores
 * @param {object} conTable - The constitution table for CON-based lookups
 * @returns {number} The bonus amount (e.g., 3 for a Dwarf with CON 13)
 */
function getRacialSaveBonus(saveBonusData, adjustedScores, conTable) {
    // Safety check: if no save bonus data, return 0
    if (!saveBonusData) {
        return 0;
    }

    // Check if this is a flat bonus (for future use)
    if (saveBonusData.flat !== undefined) {
        return saveBonusData.flat;
    }

    // Check if this is a CON-based bonus (Dwarf, Gnome, Halfling)
    if (saveBonusData.source === "con") {
        const conData = conTable[adjustedScores.con];
        return conData.saveBonus || 0;
    }

    // Default: no bonus
    return 0;
}

/**
 * Expands the 5 base saving throw categories into 10 individual subcategories.
 * Applies racial bonuses to specific subcategories only.
 * 
 * @param {number[]} baseSaves - The 5 base save values [PPDM, RSW, PP, Breath, Spell]
 * @param {object} raceData - The race data including saveBonus info
 * @param {number} racialBonus - The calculated racial bonus amount
 * @returns {object} Object with all 10 subcategory save values
 */
function expandSavingThrows(baseSaves, raceData, racialBonus) {
    // Create the detailed breakdown
    // All subcategories start with their category's base value
    const detailed = {
        // Category 0: Paralyzation, Poison, or Death Magic
        paralyzation: baseSaves[0],
        poison: baseSaves[0],
        deathMagic: baseSaves[0],

        // Category 1: Rod, Staff, or Wand
        rod: baseSaves[1],
        staff: baseSaves[1],
        wand: baseSaves[1],

        // Category 2: Petrification or Polymorph
        petrification: baseSaves[2],
        polymorph: baseSaves[2],

        // Category 3: Breath Weapon (no subcategories)
        breathWeapon: baseSaves[3],

        // Category 4: Spell (no subcategories)
        spell: baseSaves[4]
    };

    // Apply racial bonuses to specific subcategories
    if (raceData.saveBonus && raceData.saveBonus.appliesTo && racialBonus > 0) {
        raceData.saveBonus.appliesTo.forEach(subcategory => {
            // Handle direct subcategory match (e.g., "poison")
            if (detailed[subcategory] !== undefined) {
                detailed[subcategory] -= racialBonus;
            }
            // Handle category-level abbreviations (e.g., "rsw" applies to all three)
            else if (subcategory === "rsw") {
                detailed.rod -= racialBonus;
                detailed.staff -= racialBonus;
                detailed.wand -= racialBonus;
            }
            else if (subcategory === "ppdm") {
                detailed.paralyzation -= racialBonus;
                detailed.poison -= racialBonus;
                detailed.deathMagic -= racialBonus;
            }
            else if (subcategory === "pp") {
                detailed.petrification -= racialBonus;
                detailed.polymorph -= racialBonus;
            }
        });
    }

    return detailed;
}

/**
 * Calculates cumulative spell immunities for high Wisdom characters.
 * 
 * @param {object} wisTable - The wisdom table from wisdom_table.json
 * @param {number} characterWis - The character's Wisdom score
 * @returns {string[]} Array of capitalised spell names the character is immune to
 */
function getCumulativeImmunities(wisTable, characterWis) {
    const cumulativeImmunities = new Set();
    const startScore = 19;

    // Collect all immunities from WIS 19 up to character's WIS
    for (let score = startScore; score <= characterWis; score++) {
        const entry = wisTable[score];

        if (entry && Array.isArray(entry.spellImmunity)) {
            entry.spellImmunity.forEach(spellGroup => {
                cumulativeImmunities.add(spellGroup);
            });
        }
    }

    // Capitalise each word in each spell name
    return Array.from(cumulativeImmunities).map(capitaliseWords);
}

/**
 * Main calculation engine for derived character statistics.
 * Takes raw character data and returns all calculated/derived values.
 * 
 * @param {object} character - The character state object from React
 * @returns {object} All derived statistics
 */
export function calculateDerivedStats(character) {
    const results = {};

    // --- STEP 1: Calculate level from XP
    const charClassKey = character.characterClass.toLowerCase();
    let calculatedLevel = 1;

    if (charClassKey && charClasses[charClassKey]) {
        const levelProg = charClasses[charClassKey].levelProg;
        for (let lvl = 1; lvl<=20; lvl++) {
            if(levelProg[lvl] && character.xp >= levelProg[lvl].xp) {
                calculatedLevel = lvl;
            } else {
                break;
            }
        }
    }

    // Store the calculated level
    results.level = calculatedLevel;
    const level = calculatedLevel;  // Use this throughout the function


    // --- STEP 2: GET RACE DATA ---
    const race = character.race.toLowerCase();
    const raceData = RACES[race] || { statAdj: {}, saveBonus: null };
    const statAdjustments = raceData.statAdj || {};


    // --- STEP 3: CALCULATE ADJUSTED ABILITY SCORES ---
    // Apply racial adjustments and clamp between 1 and 25
    const str = clamp(character.scores.str + (statAdjustments.str || 0), 1, 25);
    const dex = clamp(character.scores.dex + (statAdjustments.dex || 0), 1, 25);
    const con = clamp(character.scores.con + (statAdjustments.con || 0), 1, 25);
    const int = clamp(character.scores.int + (statAdjustments.int || 0), 1, 25);
    const wis = clamp(character.scores.wis + (statAdjustments.wis || 0), 1, 25);
    const cha = clamp(character.scores.cha + (statAdjustments.cha || 0), 1, 25);

    // Store adjusted scores
    results.adjustedScores = { str, dex, con, int, wis, cha };
    results.raceAdjustments = statAdjustments;


    // --- STEP 4: LOOK UP ABILITY SCORE MODIFIERS ---

    // STRENGTH
    // Use exceptional strength if: raw strength is 18, exceptional strength is set, and it's a valid value
    let strengthLookupKey = str.toString();
    if (character.scores.str === 18 && character.exceptionalStrength) {
        const exceptionalValue = character.exceptionalStrength;
        
        // Convert percentile roll to table key based on ranges
        // Handle "00" as 100, otherwise parse as integer
        let roll;
        if (exceptionalValue === '00' || exceptionalValue === '0') {
            roll = 100;
        } else {
            roll = parseInt(exceptionalValue, 10);
        }
        
        // Validate roll is in valid range (1-100)
        if (!isNaN(roll) && roll >= 1 && roll <= 100) {
            let tableKey = null;
            
            // Map percentile ranges to table keys
            // 01-50 → "18/01", 51-75 → "18/51", 76-90 → "18/76", 91-99 → "18/91", 00 (100) → "18/00"
            if (roll >= 1 && roll <= 50) {
                tableKey = '18/01';
            } else if (roll >= 51 && roll <= 75) {
                tableKey = '18/51';
            } else if (roll >= 76 && roll <= 90) {
                tableKey = '18/76';
            } else if (roll >= 91 && roll <= 99) {
                tableKey = '18/91';
            } else if (roll === 100) {
                tableKey = '18/00';
            }
            
            // Validate that the table key exists in the table
            if (tableKey && strTable[tableKey]) {
                strengthLookupKey = tableKey;
            }
        }
    }
    
    const strMods = strTable[strengthLookupKey] || {};
    results.strHitProb = strMods.hitProb || 0;
    results.strDamAdj = strMods.damageAdj || 0;
    results.strWeightAllow = strMods.weightAllow || 0;
    results.strMaxPress = strMods.maxPress || 0;
    results.strOpenDoors = strMods.openDoors || 0;
    results.strBendBars = strMods.bendBars || 0;

    // DEXTERITY
    const dexMods = dexTable[dex] || {};
    results.dexReactionAdj = dexMods.reactionAdj || 0;
    results.dexMissileAdj = dexMods.missileAdj || 0;
    results.dexDefensiveAdj = dexMods.defensiveAdj || 0;

    // CONSTITUTION
    const conMods = conTable[con] || {};
    results.conHitPointAdj = conMods.hitPointAdj || 0;
    results.conSystemShock = conMods.systemShock || 0;
    results.conResSurvival = conMods.resSurvival || 0;
    results.conPoisonSave = conMods.poisonSave || 0;
    results.conRegeneration = conMods.regeneration || 0;
    results.conSaveBonus = conMods.saveBonus || 0;

    // INTELLIGENCE
    const intMods = intTable[int] || {};
    results.intLanguages = intMods.languages || 0;
    results.intSpellLevel = intMods.spellLevel || 0;
    results.intChanceLearnSpell = intMods.chanceLearnSpell || 0;
    results.intMaxSpellsPerLevel = intMods.maxSpellsPerLevel || 0;
    results.intIllusionImmunity = intMods.illusionImmunity || 0;

    // WISDOM
    const wisMods = wisTable[wis] || {};
    results.wisMagicalDefenseAdj = wisMods.magicalDefenseAdj || 0;
    results.wisBonusSpells = wisMods.bonusSpells || null;
    results.wisSpellFailureChance = wisMods.spellFailureChance || 0;
    results.wisSpellImmunity = getCumulativeImmunities(wisTable, wis);

    // CHARISMA
    const chaMods = chaTable[cha] || {};
    results.chaMaxHench = chaMods.maxHenchmen || 0;
    results.chaLoyaltyBase = chaMods.loyaltyBase || 0;
    results.chaReactionAdj = chaMods.reactionAdj || 0;


    // --- STEP 5: CALCULATE HIT POINTS ---
    // Base HP cannot exceed level × class hit die (e.g. 4th level fighter max 40)
    const hitDie = charClasses[charClassKey]?.hitDie;
    const maxBaseHp = (level && hitDie) ? level * hitDie : null;
    const baseHp = maxBaseHp != null ? Math.min(Number(character.hp.base) || 0, maxBaseHp) : (Number(character.hp.base) || 0);
    const hpBonus = results.conHitPointAdj * level;
    results.hpMax = baseHp + hpBonus;
    // Current HP: stored value or default to Max HP, clamped to 0..hpMax
    const rawCurrent = character.hp.current;
    results.currentHp = rawCurrent !== undefined && rawCurrent !== null
        ? Math.min(results.hpMax, Math.max(0, Number(rawCurrent)))
        : results.hpMax;


    // --- STEP 6: CALCULATE ARMOUR CLASS ---
    const armourType = character.ac.armourType.trim() || 'none';
    const hasShield = character.ac.shield;
    const shieldBonus = -1;

    // Look up AC by armour type, defaults to 10 if not found
    const baseAC = armourTable.armourType[armourType] || 10;

    // Apply shield bonus if equipped
    const shieldAdj = hasShield ? shieldBonus : 0;

    // Calculate final AC: base + dex adj + shield
    results.acFinal = baseAC + results.dexDefensiveAdj + shieldAdj;

    // Store AC components for display
    results.acComponents = {
        base: baseAC,
        dexAdj: results.dexDefensiveAdj,
        shieldAdj: shieldAdj
    };


    // --- STEP 7: CLASS CHECK (Defensive Guard) ---
    if (!charClassKey || !charClasses[charClassKey]) {
        // No class selected - return safe defaults
        results.savingThrows = {
            paralyzation: 0,
            poison: 0,
            deathMagic: 0,
            rod: 0,
            staff: 0,
            wand: 0,
            petrification: 0,
            polymorph: 0,
            breathWeapon: 0,
            spell: 0
        };
        return results;
    }


    // --- STEP 8: CALCULATE SAVING THROWS (Class-dependent) ---
    const classData = charClasses[charClassKey];

        // LAYER 1: Get base saves from class progression
        const baseSaves = classData.levelProg[level].saveThrow;

        // LAYER 2: Apply class save bonus (Paladin: 2, Fighter: 0)
        const classSaveBonus = classData.classAbilities.saveVal || 0;
        const savesWithClassBonus = baseSaves.map(save => save - classSaveBonus);

        // LAYER 3: Calculate racial save bonus amount (if any)
        let racialBonus = 0;
        if (raceData.saveBonus && raceData.saveBonus.appliesTo) {
            racialBonus = getRacialSaveBonus(
                raceData.saveBonus,
                { str, dex, con, int, wis, cha },
                conTable
            );
        }

        // LAYER 4: Expand to detailed subcategories and apply racial bonuses
        results.savingThrows = expandSavingThrows(
            savesWithClassBonus,
            raceData,
            racialBonus
        );


    // --- STEP 9: CALCULATE THACO AND ATTACKS ---

    // Get base THACO from class progression
    const baseThaco = classData.levelProg[level].thaco;

    // Calculate modified THACO for melee (with STR bonus)
    const meleeThaco = baseThaco - results.strHitProb;

    // Calculate modified THACO for missile (with DEX bonus)
    const missileThaco = baseThaco - results.dexMissileAdj;

    // Get attacks per round
    const attacksPerRound = classData.levelProg[level].attacksPerRound;

    // Store combat stats
    results.combat = {
        baseThaco,
        meleeThaco,
        missileThaco,
        attacksPerRound,
        strBonus: results.strHitProb,
        strDamage: results.strDamAdj,
        dexBonus: results.dexMissileAdj
    };

    // --- STEP 10: THIEF SKILLS (class-specific) ---
    if (charClassKey === 'thief') {
        const thiefAbilities = charAbilities.thief;
        const baseSkill = thiefAbilities?.baseThiefSkill || {};
        const raceMods = raceData?.thiefSkills || {};
        const armourMods = (armourTable.armourThiefSkills && armourTable.armourThiefSkills[armourType]) || {};
        const dexRow = dexTable[dex] || {};
        const thiefSkillPoints = character.thiefSkillPoints || {};
        const allocatedPerSkill = {};
        THIEF_SKILL_ORDER.forEach(skill => {
            allocatedPerSkill[skill] = typeof thiefSkillPoints[skill] === 'number' ? thiefSkillPoints[skill] : 0;
        });
        const skills = {};
        THIEF_SKILL_ORDER.forEach(skill => {
            const base = baseSkill[skill] ?? 0;
            const allocated = allocatedPerSkill[skill] ?? 0;
            const race = raceMods[skill] ?? 0;
            const armour = armourMods[skill] ?? 0;
            const dexVal = dexRow[skill] ?? 0;
            const total = clamp(base + allocated + race + armour + dexVal, 0, THIEF_SKILL_PERCENT_CAP);
            skills[skill] = { base, allocated, race, armour, dex: dexVal, total };
        });
        results.thiefSkills = {
            skills,
            backstabMulti: classData.levelProg[level]?.backstabMulti?.[0] ?? 2
        };
    }

    return results;
}