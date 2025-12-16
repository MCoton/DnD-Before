import React from 'react';
import weapons from "../data/weapons.json";
import charClasses from "../data/character_classes.json";
import specialisation from "../data/weapon_specialisation.json";

/**
 * Displays weapon proficiencies and allows managing them
 * 
 * @param {object} props
 * @param {string} props.characterClass - The character's class
 * @param {number} props.characterLevel - The character's level
 * @param {array} props.proficiencies - Array of weapon keys the character is proficient with
 * @param {function} props.onAddProficiency - Called when adding a weapon
 * @param {function} props.onRemoveProficiency - Called when removing a weapon
 */

const SPECIALISATION_LEVELS = {
    0: 'non-proficient',
    1: 'proficient',
    2: 'expert',
    3: 'master',
};

export default function WeaponProficiencies({
    characterClass,
    characterLevel,
    proficiencies = {},
    onAddProficiency,
    onRemoveProficiency
}) {
    // Check if a class has been selected, display message top choose
    if(!characterClass) {
        return (
            <div className="weapon-proficiencies-block area-box details-box">
                <h2 classNam="title">Weapon Proficiencies</h2>
                <hr className="style14"></hr>
                <p className="no-class-message">
                    Pick a class you raging numpty.
                </p>
            </div>
        );
    }

    // Getting Classs data
    const classKey = characterClass.toLowerCase();
    const classData = charClasses[classKey];

    // Conditional if no data available
    if(!classData || !classData.levelProg) {
        return (
            <div className="weapon-proficiencies-block area-box details-box">
                <h2 className="title">Weapon Proficiencies</h2>
                <hr className="style14"></hr>
                <p className="no-data-message">
                    No proficiency data available for {characterClass}.
                </p>
            </div>
        );
    }
    
    // Get weapon slots for current level
    const levelData = classData.levelProg[characterLevel];
    if(!levelData) {
        return (
            <div className="weapon-proficiencies-block area-box details-box">
                <h2 className="title">Weapon Proficiencies</h2>
                <hr className="style14"></hr>
                <p className="no-data-message">
                    Level {characterLevel} data not available.
                </p>
            </div>
        );
    }

    // Get list of weapons not yet proficient with
    const classGroup = classData.group;
    const canSpecialise = classGroup === "warrior";
    const maxSlotsPerWeapon = classKey === "fighter" ? 3 : (canSpecialise ? 2 : 1);

    // Calculate slots
    const usedSlots = Object.values(proficiencies).reduce((sum, slots) => sum + slots, 0);
    const totalSlots = levelData.weaponSlots;
    const remainingSlots = totalSlots - usedSlots;

    // Get specialised level for a weapon
    const getSpecialisationLevel = (slots) => {
        return SPECIALISATION_LEVELS[slots] ?? SPECIALISATION_LEVELS[0];
    };

    // Get list of weapons not yet proficient with
    const availableWeapons = Object.entries(weapons)
        .filter(([key]) => !proficiencies[key])
        .sort((a, b) => a[1].name.localeCompare(b[1].name));
    
    //Get proficient weapons with their details
    const proficientWeapons = Object.entries(proficiencies)
        .map(([weaponKey, slots]) => {
            const weapon = weapons[weaponKey];
            const specLevel = getSpecialisationLevel(slots);
            const specData = specialisation[specLevel];
            return {
                key: weaponKey,
                weapon,
                slots,
                specLevel,
                specData
            };
        })
        .sort((a, b) => a.weapon.name.localeCompare(b.weapon.name));

    return (
        <div className="weapon-proficiencies-block area-box details-box">
            <h2 className="title">Weapon Proficiencies</h2>
            <hr className="style14"></hr>

            {/* Slots Summary */}
            <div className="proficiency-summary">
                <p>
                    <strong>Proficiency Slots:</strong> {usedSlots} / {totalSlots} used
                    {remainingSlots > 0 && (
                        <span className="remaining-slots"> ({remainingSlots} remaining)</span>
                    )}
                </p>
                {canSpecialise && (
                    <p className="specialisation-note">
                        As a {characterClass}, you can specialise in weapons 
                        (max {maxSlotsPerWeapon} slots per weapon).
                    </p>
                )}
            </div>

            {/* Current Proficiencies */}
            {proficientWeapons.length > 0 ? (
                <div className="current-proficiencies">
                    <h3>Current Proficiencies:</h3>
                    <ul className="proficiency-list">
                        {proficientWeapons.map(({ key, weapon, slots, specLevel, specData }) => (
                            <li key={key} className="proficiency-item">
                                <div className="weapon-info">
                                    <span className="weapon-name">
                                        {weapon?.name || key}
                                    </span>
                                    <span className={`spec-level spec-${specLevel}`}>
                                        {specData.name}
                                    </span>
                                    <span className="slots-used">
                                        ({slots} {slots === 1 ? 'slot' : 'slots'})
                                    </span>
                                </div>
                                
                                {/* Show bonuses */}
                                {specLevel !== 'proficient' && (
                                    <div className="spec-bonuses">
                                        {specData.bonuses.attackBonus > 0 && (
                                            <span className="bonus">+{specData.bonuses.attackBonus} to hit</span>
                                        )}
                                        {specData.bonuses.damageBonus > 0 && (
                                            <span className="bonus">+{specData.bonuses.damageBonus} damage</span>
                                        )}
                                        {specData.bonuses.attacksPerRound && (
                                            <span className="bonus">Attacks:{specData.bonuses.attacksPerRound}</span>
                                        )}
                                    </div>
                                )}
                                
                                {/* Action buttons */}
                                <div className="proficiency-actions">
                                    {/* Upgrade button (if can specialise and has slots) */}
                                    {canSpecialise && slots < maxSlotsPerWeapon && remainingSlots > 0 && (
                                        <button 
                                            onClick={() => onAddProficiency(key, slots + 1)}
                                            className="upgrade-btn"
                                            title={`Upgrade to ${slots === 1 ? 'Expert' : 'Master'}`}
                                        >
                                            Upgrade
                                        </button>
                                    )}
                                    
                                    {/* Downgrade button */}
                                    {slots > 1 && (
                                        <button 
                                            onClick={() => onAddProficiency(key, slots - 1)}
                                            className="downgrade-btn"
                                            title="Remove one slot"
                                        >
                                            -
                                        </button>
                                    )}
                                    
                                    {/* Remove button */}
                                    <button 
                                        onClick={() => onRemoveProficiency(key)}
                                        className="remove-btn"
                                        title="Remove proficiency"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="no-proficiencies">No weapon proficiencies yet. Add some below!</p>
            )}

            {/* Add New Proficiency */}
            {remainingSlots > 0 && availableWeapons.length > 0 && (
                <div className="add-proficiency">
                    <h3>Add Proficiency:</h3>
                    <select 
                        onChange={(e) => {
                            if (e.target.value) {
                                onAddProficiency(e.target.value, 1);
                                e.target.value = ''; // Reset dropdown
                            }
                        }}
                        className="weapon-select"
                    >
                        <option value="">Choose a weapon...</option>
                        {availableWeapons.map(([key, weapon]) => (
                            <option key={key} value={key}>
                                {weapon.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {remainingSlots === 0 && (
                <p className="slots-full">All proficiency slots are used!</p>
            )}
        </div>
    );        
}