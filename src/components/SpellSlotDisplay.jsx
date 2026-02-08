import React from 'react';
import charClasses from '../data/classes/character_classes.json';


/**
 * Displays spell slots for spellcasting classes
 * 
 * @param {object} props
 * @param {string} props.characterClass - The character's class
 * @param {number} props.characterLevel - The character's level
 * @param {number} props.intSpellLevel - Maximum spell level from Intelligence (wizards only, 0-9)
 */
export default function SpellSlotsDisplay({ characterClass, characterLevel, intSpellLevel }) {
    
    // If no class selected
    if (!characterClass) {
        return null; // Don't show anything if no class
    }

    // Get class data
    const classKey = characterClass.toLowerCase();
    const classData = charClasses[classKey];

    // If no data for this class
    if (!classData || !classData.levelProg) {
        return null;
    }

    // Get level data
    const levelData = classData.levelProg[characterLevel];
    if (!levelData) {
        return null;
    }

    // Determine which spell slot array to use
    // Check for mageSpells, clericSpells, etc.
    let spellSlots = null;
    let spellType = null;

    if (levelData.mageSpells) {
        spellSlots = levelData.mageSpells;
        spellType = 'Arcane';
    } else if (levelData.clericSpells) {
        spellSlots = levelData.clericSpells;
        spellType = 'Divine';
    } else if (levelData.druidSpells) {
        spellSlots = levelData.druidSpells;
        spellType = 'Druidic';
    }

    // If no spell slots, this class doesn't cast spells
    if (!spellSlots || spellSlots.every(slot => slot === 0)) {
        return null;
    }

    // Filter out spell levels with 0 slots
    let availableSpellLevels = spellSlots
        .map((slots, index) => ({ level: index + 1, slots }))
        .filter(item => item.slots > 0);
    
    // For Arcane spells (wizards), apply Intelligence and character level limits
    // Maximum knowable spell level is the minimum of Intelligence limit and character level limit
    if (spellType === 'Arcane' && intSpellLevel !== undefined && intSpellLevel !== null && intSpellLevel > 0) {
        // Character level determines max spell level: roughly level/2, capped at 9
        // Level 1-2: 1st, 3-4: 2nd, 5-6: 3rd, 7-8: 4th, 9-10: 5th, 11-12: 6th, 13-14: 7th, 15-16: 8th, 17+: 9th
        const levelBasedMaxSpellLevel = Math.min(Math.ceil(characterLevel / 2), 9);
        
        // Use the minimum of Intelligence limit and character level limit
        const maxKnowableSpellLevel = Math.min(intSpellLevel, levelBasedMaxSpellLevel);
        
        // Filter to only show spell levels up to the maximum knowable level
        availableSpellLevels = availableSpellLevels.filter(item => item.level <= maxKnowableSpellLevel);
    }

    return (
        <div className="spell-slots-block area-box details-box">
            <h2 className="title">{spellType} Spell Slots</h2>
            <hr className="style14"></hr>

            <div className="spell-slots-grid">
                {availableSpellLevels.map(({ level, slots }) => (
                    <div key={level} className="spell-level-box">
                        <div className="spell-level-header">
                            <span className="spell-level-number">{level}</span>
                            <span className="spell-level-label">
                                {level === 1 ? '1st' : level === 2 ? '2nd' : level === 3 ? '3rd' : `${level}th`} Level
                            </span>
                        </div>
                        <div className="spell-slots-count">
                            <span className="slots-number">{slots}</span>
                            <span className="slots-label">{slots === 1 ? 'slot' : 'slots'}</span>
                        </div>
                    </div>
                ))}
            </div>

            <p className="caption">
                Spells per day for level {characterLevel} {characterClass}
            </p>
        </div>
    );
}