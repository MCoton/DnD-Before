import React from 'react';
import nonWeaponProficiencies from '../data/nonWeaponProficiencies.json';
import charClasses from '../data/classes/character_classes.json';

/**
 * Displays non-weapon proficiencies and allows managing them
 * 
 * @param {object} props
 * @param {string} props.characterClass - The character's class
 * @param {number} props.characterLevel - The character's level
 * @param {object} props.abilityScores - Object with ability scores (str, dex, con, int, wis, cha)
 * @param {array} props.proficiencies - Array of proficiency names the character has
 * @param {function} props.onProficiencyChange - Called when a proficiency is added/removed (index, proficiencyName)
 */
export default function NonWeapProfDisplay({
    characterClass,
    characterLevel,
    abilityScores = {},
    proficiencies = [],
    onProficiencyChange
}) {
    // Check if a class has been selected
    if (!characterClass) {
        return (
            <div className="non-weapon-proficiencies-block area-box details-box">
                <h2 className="title">Non-Weapon Proficiencies</h2>
                <hr className="style14"></hr>
                <p className="no-class-message">
                    Please select a character class.
                </p>
            </div>
        );
    }

    // Get class data
    const classKey = characterClass.toLowerCase();
    const classData = charClasses[classKey];

    // Conditional if no data available
    if (!classData || !classData.levelProg) {
        return (
            <div className="non-weapon-proficiencies-block area-box details-box">
                <h2 className="title">Non-Weapon Proficiencies</h2>
                <hr className="style14"></hr>
                <p className="no-data-message">
                    No proficiency data available for {characterClass}.
                </p>
            </div>
        );
    }

    // Get level data
    const levelData = classData.levelProg[characterLevel];
    if (!levelData) {
        return (
            <div className="non-weapon-proficiencies-block area-box details-box">
                <h2 className="title">Non-Weapon Proficiencies</h2>
                <hr className="style14"></hr>
                <p className="no-data-message">
                    Level {characterLevel} data not available.
                </p>
            </div>
        );
    }

    // Get non-weapon proficiency slots
    const totalSlots = levelData.nonWeaponSlots || 0;
    
    // Calculate slots used based on proficiency slot costs
    const currentProficiencies = proficiencies.filter(p => p && p !== '');
    const slotsUsed = currentProficiencies.reduce((total, profName) => {
        const profData = nonWeaponProficiencies.find(p => p.name === profName);
        if (profData && typeof profData.slots === 'number') {
            return total + profData.slots;
        }
        return total + 1; // Default to 1 slot if not found
    }, 0);
    
    const remainingSlots = totalSlots - slotsUsed;

    // Get available proficiencies (filter by class restrictions if needed)
    // For now, show all GENERAL proficiencies plus class-specific ones
    const availableProficiencies = nonWeaponProficiencies.filter(prof => {
        // Check if proficiency is available to this class
        const category = prof.category || '';
        const categories = category.split(',').map(c => c.trim());
        
        // GENERAL proficiencies are available to all
        if (categories.includes('GENERAL')) {
            return true;
        }
        
        // Check class-specific categories (simplified - would need more complex logic for full implementation)
        // For now, include all proficiencies
        return true;
    });

    // Helper function to get ability score value
    const getAbilityScore = (statName) => {
        const statMap = {
            'Strength': 'str',
            'Dexterity': 'dex',
            'Constitution': 'con',
            'Intelligence': 'int',
            'Wisdom': 'wis',
            'Charisma': 'cha'
        };
        const statKey = statMap[statName] || statName.toLowerCase();
        return abilityScores[statKey] || 0;
    };

    // Helper function to calculate proficiency value
    const calculateProficiencyValue = (proficiency) => {
        if (!proficiency || proficiency === '') return null;
        
        const profData = nonWeaponProficiencies.find(p => p.name === proficiency);
        if (!profData) return null;
        
        const statValue = getAbilityScore(profData.stat);
        const modifier = typeof profData.modifier === 'number' ? profData.modifier : 0;
        
        return statValue + modifier;
    };

    // Handle proficiency selection change
    const handleProficiencyChange = (index, proficiencyName) => {
        if (onProficiencyChange) {
            onProficiencyChange(index, proficiencyName);
        }
    };

    return (
        <div className="non-weapon-proficiencies-block area-box details-box">
            <h2 className="title">Non-Weapon Proficiencies</h2>
            <hr className="style14"></hr>

            {/* Slots Summary */}
            <div className="proficiency-summary">
                <p>
                    <strong>Proficiency Slots:</strong> {slotsUsed} / {totalSlots} used
                    {remainingSlots > 0 && (
                        <span className="remaining-slots"> ({remainingSlots} remaining)</span>
                    )}
                    {remainingSlots <= 0 && (
                        <span className="slots-full"> (All slots used)</span>
                    )}
                </p>
            </div>

            {/* Proficiency Selection Dropdowns */}
            {remainingSlots > 0 && (
                <div className="proficiency-selection">
                    {Array.from({ length: remainingSlots }, (_, index) => {
                        // Find the next available index in the proficiencies array
                        const arrayIndex = currentProficiencies.length + index;
                        
                        return (
                            <div key={`prof-slot-${arrayIndex}`} className="proficiency-slot">
                                <label className="input-row proficiency-dropdown-label">
                                    <span className="input-label proficiency-slot-number">Select proficiency:</span>
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleProficiencyChange(-1, e.target.value);
                                            }
                                        }}
                                        className="proficiency-dropdown"
                                    >
                                        <option value="">-- Select proficiency --</option>
                                        {availableProficiencies.map((prof) => {
                                            // Check if this proficiency would fit in remaining slots
                                            const wouldFit = prof.slots <= remainingSlots;
                                            const isSelected = currentProficiencies.includes(prof.name);
                                            
                                            return (
                                                <option
                                                    key={prof.name}
                                                    value={prof.name}
                                                    disabled={!wouldFit || isSelected}
                                                >
                                                    {prof.name} ({prof.slots} slot{prof.slots !== 1 ? 's' : ''})
                                                    {isSelected ? ' (already selected)' : !wouldFit ? ' (not enough slots)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </label>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Show message when all slots are used */}
            {remainingSlots <= 0 && currentProficiencies.length > 0 && (
                <p className="slots-full">
                    All proficiency slots have been allocated.
                </p>
            )}

            {/* Selected Proficiencies Table */}
            {currentProficiencies.length > 0 && (
                <div className="proficiencies-table-container">
                    <h3 className="proficiencies-table-title">Selected Proficiencies</h3>
                    <table className="proficiencies-table table-responsive">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Stat</th>
                                <th>Modifier</th>
                                <th>Value</th>
                                <th>Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentProficiencies
                                .filter(prof => prof && prof !== '')
                                .map((proficiencyName, index) => {
                                    const profData = nonWeaponProficiencies.find(p => p.name === proficiencyName);
                                    if (!profData) return null;
                                    
                                    const statValue = getAbilityScore(profData.stat);
                                    const modifier = typeof profData.modifier === 'number' ? profData.modifier : 0;
                                    const totalValue = statValue + modifier;
                                    
                                    return (
                                        <tr key={`prof-row-${index}`}>
                                            <td>
                                                {profData.name}
                                                <button
                                                    type="button"
                                                    className="remove-proficiency-btn"
                                                    onClick={() => handleProficiencyChange(index, '')}
                                                    title="Remove proficiency"
                                                >
                                                    ×
                                                </button>
                                            </td>
                                            <td>{profData.stat}</td>
                                            <td>{modifier >= 0 ? `+${modifier}` : modifier}</td>
                                            <td className="proficiency-value">{totalValue}</td>
                                            <td className="proficiency-slots-cost">({profData.slots} slot{profData.slots !== 1 ? 's' : ''})</td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
