import react from 'react';
import weapons from "../data/equipment/weapons.json";
import charClasses from "../data/classes/character_classes.json";
import specialisation from "../data/equipment/weapon_specialisation.json";

/**
 * Displays weapon proficiencies and allows managing them
 * 
 * @param {object} props
 * @param {string} props.characterClass - The character's class
 * @param {number} props.characterLevel - The character's level
 * @param {array} props.proficiencies - Array of weapon keys the character is proficient with
 * @param {function} props.onAddProficiency - Called when adding a weapon
 * @param {function} props.onRemoveProficiency - Called when removing a weapon
 * @param {number} props.baseThac0 - Base THAC0 from class level
 * @param {number} props.strHitProb - Strength hit probability bonus
 * @param {number} props.dexMissileAdj - Dexterity missile adjustment
 */

const SPECIALISATION_LEVELS = {
    0: 'non-proficient',
    1: 'proficient',
    2: 'expert',
    3: 'master',
};

// Helper function to determine damage type from weapon name/type
const getDamageType = (weapon) => {
    const name = (weapon?.name || '').toLowerCase();
    const type = (weapon?.type || '').toLowerCase();
    
    // Bludgeoning weapons
    if (name.includes('mace') || name.includes('club') || name.includes('hammer') || 
        name.includes('flail') || name.includes('staff') || name.includes('sling')) {
        return 'B';
    }
    // Piercing weapons
    if (name.includes('dagger') || name.includes('dirk') || name.includes('spear') || 
        name.includes('lance') || name.includes('pike') || name.includes('arrow') ||
        name.includes('bolt') || name.includes('javelin') || name.includes('dart') ||
        name.includes('pick') || name.includes('trident') || name.includes('harpoon') ||
        name.includes('rapier')) {
        return 'P';
    }
    // Slashing weapons (default for swords, axes, etc.)
    if (name.includes('sword') || name.includes('axe') || name.includes('scimitar') ||
        name.includes('sickle') || name.includes('scourge') || name.includes('whip') ||
        name.includes('khopesh')) {
        return 'S';
    }
    // Default based on type
    return type === 'ranged' ? 'P' : 'S';
};

export default function WeaponProficiencies({
    characterClass,
    characterLevel,
    proficiencies = {},
    onAddProficiency,
    onRemoveProficiency,
    baseThac0,
    strHitProb = 0,
    dexMissileAdj = 0
}) {
    // Check if a class has been selected, display message top choose
    if(!characterClass) {
        return (
            <div className="weapon-proficiencies-block area-box details-box">
                <h2 className="title">Weapon Proficiencies</h2>
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

    // Get weapon specialization settings from class data
    const canSpecializeData = classData.canSpecialize || [false, null];
    const canSpecialise = canSpecializeData[0] === true;
    const maxSlotsPerWeapon = canSpecializeData[1] !== null ? canSpecializeData[1] : 1;

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
    
    // Calculate THACO for a weapon
    const calculateWeaponThac0 = (weapon, slots, specData) => {
        if (!baseThac0) return null;
        
        let thac0 = baseThac0;
        
        // Add specialization attack bonus
        if (specData?.bonuses?.attackBonus) {
            thac0 -= specData.bonuses.attackBonus;
        }
        
        // Add stat bonus based on weapon type
        if (weapon?.type === 'Melee') {
            thac0 -= (strHitProb || 0);
        } else if (weapon?.type === 'Ranged') {
            thac0 -= (dexMissileAdj || 0);
        }
        
        return thac0;
    };

    //Get proficient weapons with their details
    const proficientWeapons = Object.entries(proficiencies)
        .map(([weaponKey, slots]) => {
            const weapon = weapons[weaponKey];
            const specLevel = getSpecialisationLevel(slots);
            const specData = specialisation[specLevel];
            const calculatedThac0 = calculateWeaponThac0(weapon, slots, specData);
            const damageType = getDamageType(weapon);
            
            return {
                key: weaponKey,
                weapon,
                slots,
                specLevel,
                specData,
                calculatedThac0,
                damageType
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
                    <table className="weapon-proficiency-table">
                        <thead>
                            <tr>
                                <th>Weapon</th>
                                <th>Level</th>
                                <th>THAC0</th>
                                <th>Damage (S-M)</th>
                                <th>Damage (L)</th>
                                <th>Range</th>
                                <th>Type</th>
                                <th>Speed</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proficientWeapons.map(({ key, weapon, slots, specLevel, specData, calculatedThac0, damageType }) => (
                                <tr key={key} className="proficiency-row">
                                    <td className="weapon-name-cell">
                                        <strong>{weapon?.name || key}</strong>
                                    </td>
                                    <td className="spec-level-cell">
                                        <span className={`spec-level spec-${specLevel}`}>
                                            {specData.name}
                                        </span>
                                        <span className="slots-used">({slots} slot{slots !== 1 ? 's' : ''})</span>
                                    </td>
                                    <td className="thac0-cell">
                                        {calculatedThac0 !== null ? (
                                            <span className="thac0-value">
                                                {calculatedThac0}
                                                {specData.bonuses.attackBonus > 0 && (
                                                    <span className="thac0-breakdown">
                                                        <br />
                                                        <small>
                                                            Base: {baseThac0}
                                                            {weapon?.type === 'Melee' && strHitProb !== 0 && (
                                                                <> + STR({strHitProb >= 0 ? '+' : ''}{strHitProb})</>
                                                            )}
                                                            {weapon?.type === 'Ranged' && dexMissileAdj !== 0 && (
                                                                <> + DEX({dexMissileAdj >= 0 ? '+' : ''}{dexMissileAdj})</>
                                                            )}
                                                            {specData.bonuses.attackBonus > 0 && (
                                                                <> + Spec({specData.bonuses.attackBonus})</>
                                                            )}
                                                        </small>
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            <span className="thac0-na">N/A</span>
                                        )}
                                    </td>
                                    <td className="damage-cell">{weapon?.['damageS-M'] || '-'}</td>
                                    <td className="damage-cell">{weapon?.damageL || '-'}</td>
                                    <td className="range-cell">
                                        {weapon?.range || (weapon?.type === 'Melee' ? 'Melee' : '-')}
                                    </td>
                                    <td className="damage-type-cell">{damageType}</td>
                                    <td className="speed-cell">{weapon?.speed || '-'}</td>
                                    <td className="actions-cell">
                                        <div className="proficiency-actions">
                                            {/* Upgrade button (if can specialise and has slots) */}
                                            {canSpecialise && slots < maxSlotsPerWeapon && remainingSlots > 0 && (
                                                <button 
                                                    onClick={() => onAddProficiency(key, slots + 1)}
                                                    className="upgrade-btn"
                                                    title={`Upgrade to ${slots === 1 ? 'Expert' : 'Master'}`}
                                                >
                                                    ↑
                                                </button>
                                            )}
                                            
                                            {/* Downgrade button */}
                                            {slots > 1 && (
                                                <button 
                                                    onClick={() => onAddProficiency(key, slots - 1)}
                                                    className="downgrade-btn"
                                                    title="Remove one slot"
                                                >
                                                    ↓
                                                </button>
                                            )}
                                            
                                            {/* Remove button */}
                                            <button 
                                                onClick={() => onRemoveProficiency(key)}
                                                className="remove-btn"
                                                title="Remove proficiency"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {/* Show specialization bonuses summary */}
                    {proficientWeapons.some(p => p.specLevel !== 'proficient') && (
                        <div className="spec-bonuses-summary">
                            <h4>Specialization Bonuses:</h4>
                            {proficientWeapons
                                .filter(p => p.specLevel !== 'proficient')
                                .map(({ key, weapon, specData }) => (
                                    <div key={key} className="spec-bonus-item">
                                        <strong>{weapon?.name}:</strong>
                                        {specData.bonuses.attackBonus > 0 && (
                                            <span className="bonus"> +{specData.bonuses.attackBonus} to hit</span>
                                        )}
                                        {specData.bonuses.damageBonus > 0 && (
                                            <span className="bonus"> +{specData.bonuses.damageBonus} damage</span>
                                        )}
                                        {specData.bonuses.attacksPerRound && (
                                            <span className="bonus"> {specData.bonuses.attacksPerRound}</span>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}
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