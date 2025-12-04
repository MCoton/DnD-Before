// Rules Engine Imports
import strTable from './data/strength_table.json';
import dexTable from "./data/dexterity_table.json";
import conTable from "./data/constitution_table.json";
import intTable from "./data/intelligence_table.json";
import wisTable from "./data/wisdom_table.json";
import chaTable from "./data/charisma_table.json";
import raceMods from "./data/race_mods.json";
import charClasses from "./data/character_classes.json";
import charAbilities from "./data/character_abilities_text.json"
import armourTable from "./data/armour_class.json";


function getCumulativeImmunties(wisTable, characterWis) {
    const cumulativeImmunities = new Set();
    const startScore = 19;

    for(let score = startScore; score <= characterWis; score++) {
        const entry = wisTable[score];

        if(entry && Array.isArray(entry.spellImmunity)) {
            entry.spellImmunity.forEach(spellGroup => {
                cumulativeImmunities.add(spellGroup);
            });
        }
    }
    // Convert the collected spell SET into a standard array
    const rawSpellArray = Array.from(cumulativeImmunities);

    // Create a capitalised array from the raw array
    // by applying capitalisation logic to each word
    const capitalisedArray = rawSpellArray.map(spellName => {
        // Splits the name by spaces, apsses to MAP to iterate over the word(s) parts
        return spellName.split(' ').map(word => {
            // Gaurd against there being a leading space
            if(word.length === 0) return '';
            // Selects and capitalises the first letter of each word
            // Then concatenate back to the SLICEd word at position 1 to replace the lowercase letter
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' '); // Joins the word pairs back together with a space
    });
    

    return capitalisedArray;
}


export function calculateDerivedStats(character) {
    const results = {}; // Object to hold the calculated stats

    // Get character race
    const race = character.race.toLowerCase();
    // Apply stat mods from raceMods table
    const adjustments = raceMods[race] || {};

    // Get character level
    const level = character.level;
    
    // --- 1. CALCULATE ADJUSTED SCORES (Independent of Class) ---
    // Ensure all scores are clamped between 1 and 25 after applying racial adjustments
    const str = Math.min(25, Math.max(1, character.scores.str + (adjustments.str || 0)));
    const dex = Math.min(25, Math.max(1, character.scores.dex + (adjustments.dex || 0)));
    const con = Math.min(25, Math.max(1, character.scores.con + (adjustments.con || 0)));
    const int = Math.min(25, Math.max(1, character.scores.int + (adjustments.int || 0)));
    const wis = Math.min(25, Math.max(1, character.scores.wis + (adjustments.wis || 0)));
    const cha = Math.min(25, Math.max(1, character.scores.cha + (adjustments.cha || 0)));
    
    // --- 2. INDEPENDENT STAT MODIFIERS LOOKUP ---
    
    // STRENGTH items
    const strMods = strTable.str[str] || {}; 
    results.strHitProb = strMods.hitProb || 0;
    results.strDamAdj = strMods.damageAdj || 0;
    results.strWeightAllow = strMods.weightAllow || 0;
    results.strMaxPress = strMods.maxPress || 0;
    results.strOpenDoors = strMods.openDoors || 0;
    results.strBendBars = strMods.bendBars || 0;
    
    // DEXTERITY items
    const dexMods = dexTable.dex[dex] || {};
    results.dexReactionAdj = dexMods.reactionAdj || 0;
    results.dexMissileAdj = dexMods.missileAdj || 0;
    results.dexDefensiveAdj = dexMods.defensiveAdj || 0;
    // For use in the AC calcs
    const dexACAdj = results.dexDefensiveAdj;

    // CONSTITUTION items
    const conMods = conTable.con[con] || {};
    const conHpAdj = conMods.hitPointAdj || 0; // Derived early for HP/safe return
    results.conHitPointAdj = conHpAdj; 
    results.conSystemShock = conMods.systemShock || 0;
    results.conResSurvival = conMods.resSurvival || 0;
    results.conPoisonSave = conMods.poisonSave || 0;
    results.conRegeneration = conMods.regeneration || 0;
    results.conSaveBonus = conMods.saveBonus || 0;
    

    // INTELLIGENCE items
    const intMods = intTable.int[int] || {};
    results.intLanguages = intMods.languages || 0;
    results.intSpellLevel = intMods.spellLevel || 0;
    results.intChanceLearnSpell = intMods.chanceLearnSpell || 0;
    results.intMaxSpellsPerLevel = intMods.maxSpellsPerLevel || 0;
    results.intIllusionImmunity = intMods.illusionImmunity || 0;

    // WISDOM items
    const wisMods = wisTable.wis[wis] || {}; 
    results.wisMagicalDefenseAdj = wisMods.magicalDefenseAdj || 0;
    results.wisBonusSpells = wisMods.bonusSpells || [];
    results.wisSpellFailureChance = wisMods.spellFailureChance || 0;
    results.wisSpellImmunity = getCumulativeImmunties(wisTable.wis, wis);

    // CHARISMA items
    const chaMods = chaTable.cha[cha] || {}; 
    results.chaMaxHench = chaMods.maxHenchmen || 0;
    results.chaLoyaltyBase = chaMods.loyaltyBase || 0;
    results.chaReactionAdj = chaMods.reactionAdj || 0;
    
    // --- 3. INDEPENDENT AGGREGATE CALCULATIONS ---
    
    // Posting adjusted scores back to the sheet
    results.adjustedScores = { str, dex, con, int, wis, cha }
    results.raceAdjustments = adjustments;

    // Hit points calculator
    const baseHp = character.hp.base;
    const hpBonus = conHpAdj * level;
    results.hpMax = baseHp + hpBonus;

    // Armour Class calculator
    const armourType = character.ac.armourType.trim() || 'none';
    const hasShield = character.ac.shield;
    const shieldBonus = -1;

    //Look up AC by armour type, defaults to 10 if not found
    const baseAC = armourTable.armourType[armourType] || 10 ;

    // Apply any shield bonus
    const shieldAdj = hasShield ? shieldBonus : 0;

    // Calculate the final Armour Class
    // armour type (base AC) + dex adj + shield (if any)
    results.acFinal = baseAC + dexACAdj + shieldAdj;

    // Store AC components for display
    results.acComponents = {
        base: baseAC,
        dexAdj: results.dexDefensiveAdj,
        shieldAdj: shieldAdj
    }
    
    // --- 4. CLASS CHECK (Defensive Guard) ---
    // Now that all independent stats are calculated, we check for a valid class.
    const selectedClass = character.characterClass || "";
    const charClassKey = selectedClass.toLowerCase();
    
    if(!charClassKey || !charClasses[charClassKey]) {
        // If no class is selected, return the safely calculated results,
        // using 0 for the one piece of data that still requires a class (savingThrows).
        results.savingThrows = [0, 0, 0, 0, 0]; 
        return results;
    } 

    // --- 5. CLASS-DEPENDENT CALCULATIONS (Saving Throws) ---
    
    const classData = charClasses[charClassKey];  

    // Look up the base saves (Safe now, as classData is defined)
    const baseSave = classData.levelProg[level].saveThrow;
    // Get any save bonuses for class
    const classSaveBonus = classData.classAbilities.saveVal || 0;
    // THERE NEEDS TO BE ONE FOR DWARVF's CON BONUS <-- Reminder for a future step!

    // Set saving throws
    results.savingThrows = baseSave.map(baseSave => baseSave - classSaveBonus);

    return results;
};