import React, { useEffect } from "react";
import raceMods from '../data/races/race_mods.json';
import { clamp } from '../utils';
import { useNumericInput } from '../hooks/useNumericInput';
import { STAT_MIN, STAT_MAX } from '../constants/characterLimits';

import charClasses from '../data/classes/character_classes.json';

/**
 * Renders the score and derived statistics for a single D&D Attribute.
 * @param {object} props
 * @param {string} props.statName - The full name of the stat (e.g., "Strength").
 * @param {number} props.score - The RAW score (before racial adjustments).
 * @param {number} props.adjustedScore - The ADJUSTED score (after racial adjustments).
 * @param {object} props.derivedData - The full object of calculated results.
 * @param {function} props.onScoreChange - Handler for score changes
 * @param {string} props.race - The character's race
 * @param {string} props.characterClass - The character's class (for exceptional strength check)
 * @param {string} props.exceptionalStrength - The exceptional strength value (e.g., "18/01")
 * @param {function} props.onExceptionalStrengthChange - Handler for exceptional strength changes
 * @param {boolean} props.statOverride - Whether stat override is enabled for this stat
 * @param {function} props.onStatOverrideChange - Handler for stat override changes
 */

export default function StatBlock({ statName, score, adjustedScore, derivedData, onScoreChange, race, characterClass, exceptionalStrength, onExceptionalStrengthChange, statOverride, onStatOverrideChange }) {

    // Helper to get the first three letters of the stat name for key prefixing
    // e.g., 'Strength' -> 'str', 'Constitution' -> 'con'
    const statPrefix = statName.toLowerCase().slice(0, 3);
    
    // Check if derivedData is available before attempting lookups
    if (!derivedData) return null;
    
    // Use custom hook for numeric input handling
    const { inputValue, handleChange, handleBlur } = useNumericInput(adjustedScore, {
        min: STAT_MIN,
        max: STAT_MAX,
        onUpdate: (clampedAdjustedValue) => {
        // Calculate what the raw score should be to achieve this adjusted score
        const racialAdjustment = adjustedScore - score;
            const newRawScore = clampedAdjustedValue - racialAdjustment;
            const clampedRawScore = clamp(newRawScore, STAT_MIN, STAT_MAX);

            if (onScoreChange) {
                onScoreChange(statPrefix, clampedRawScore);
            }
        }
    });

    // Check if Race gets CON-based save bonuses by looking at race_mods data
    const raceKey = race?.toLowerCase() || 'human';
    const raceData = raceMods[raceKey];
    const showConSaveBonus = raceData?.saveBonus?.source === 'con';

    // Check if Race gets high CON bonus to Poison save


    // --- Data Lookup ---
    // This allows us to dynamically map the generic component to specific derived stats
    // Example: if statPrefix is 'str', we look up derivedData.strHitProb
    
    const derivedStatsMap = {
        // --- STRENGTH ---
        str: [
            { label: 'Hit Probability', value: derivedData.strHitProb },
            { label: 'Damage Adj', value: derivedData.strDamAdj },
            { label: 'Weight Allow', value: `${derivedData.strWeightAllow}lbs` },
            { label: 'Max Press (Lift)', value: `${derivedData.strMaxPress}lbs` },
            { label: 'Bend Bars/Lift Gates', value: `${derivedData.strBendBars}%` },
        ],
        // --- DEXTERITY ---
        dex: [
            { label: 'Reaction Adj', value: derivedData.dexReactionAdj },
            { label: 'Missile Adj', value: derivedData.dexMissileAdj },
            { label: 'Def Adj', value: derivedData.dexDefensiveAdj },
        ],
        // --- CONSTITUTION ---
        con: [
            { label: 'Hitpoint Adj', value: derivedData.conHitPointAdj },
            { label: 'Sys Shock', value: `${derivedData.conSystemShock}%` },
            { label: 'Resurrection Surv', value: `${derivedData.conResSurvival}%` },
            //  Conditionally show or hide Poison Save only when the value is not ZERO
            ...(derivedData.conPoisonSave !== 0 ? [
                { 
                    label: 'Poison Save', 
                    value: derivedData.conPoisonSave > 0 
                        ? `+${derivedData.conPoisonSave}`   // positive
                        : `${derivedData.conPoisonSave}`    // negative
                }
            ] : []),
            // Conditionally formatting the Regeneration entry
            ...(derivedData.conRegeneration !== 0 ? [
                { label: 'Regen', value: `1/${derivedData.conRegeneration} turn` },
            ] : []),
            // Conditionally add CON save bonus if race has it and value > 0
            ...(showConSaveBonus && derivedData.conSaveBonus > 0 ? [
                { label: 'Racial Save Bonus', value: `+${derivedData.conSaveBonus}` }
            ] : [])
        ],
        // --- INTELLIGENCE ---
        int: [
            { label: 'No. of Languages', value: derivedData.intLanguages },
            { label: 'Max Spell Lvl', value: derivedData.intSpellLevel },
            { label: 'Chance to Learn', value: `${derivedData.intChanceLearnSpell}%` },
            { label: 'Max Spells/Lvl', value: derivedData.intMaxSpellsPerLevel },
            { label: 'Illusion Immunity', value: derivedData.intIllusionImmunity },
        ],
        // --- WISDOM ---
        wis: [
            { label: 'Mag Def Adj', value: `+${derivedData.wisMagicalDefenseAdj}` },
            { label: 'Bonus Spells', value: derivedData.wisBonusSpells?.join(', ') || 'None' },
            { label: 'Spell Fail', value: `${derivedData.wisSpellFailureChance}%` },
        ],
        // --- CHARISMA ---
        cha: [
            { label: 'Max Henchmen', value: derivedData.chaMaxHench },
            { label: 'Loyalty Base', value: derivedData.chaLoyaltyBase },
            { label: 'Reaction Adj', value: derivedData.chaReactionAdj },
        ],
    };

    const statsToDisplay = derivedStatsMap[statPrefix] || [];

    // Check if exceptional strength should be shown (only for Strength stat)
    const isStrength = statPrefix === 'str';
    const showExceptionalStrength = isStrength && characterClass && race;
    
    let canHaveExceptionalStrength = false;
    if (showExceptionalStrength) {
        const classKey = characterClass.toLowerCase();
        const classData = charClasses[classKey];
        const isWarrior = classData?.group === 'warrior';
        const isHalfling = race?.toLowerCase() === 'halfling';
        const isNatural18 = score === 18; // Natural (raw) strength must be 18
        
        canHaveExceptionalStrength = isWarrior && !isHalfling && isNatural18;
    }
    
    // Clear exceptional strength if conditions are no longer met
    useEffect(() => {
        if (isStrength && exceptionalStrength && !canHaveExceptionalStrength && onExceptionalStrengthChange) {
            onExceptionalStrengthChange(null);
        }
    }, [isStrength, exceptionalStrength, canHaveExceptionalStrength, onExceptionalStrengthChange]);

    // Use numeric input hook for exceptional strength (allows 0-100, where 0 or 100 = 00 percentile)
    // Convert stored value to number for display: "00" → 100, others → parseInt
    // Handle null/empty as empty string for the hook
    const exceptionalStrengthDisplayValue = exceptionalStrength 
        ? (exceptionalStrength === '00' ? 100 : parseInt(exceptionalStrength, 10))
        : '';
    
    const exceptionalStrengthInput = useNumericInput(
        exceptionalStrengthDisplayValue || null,
        {
            min: 0,
            max: 100,
            onUpdate: (value) => {
                if (onExceptionalStrengthChange) {
                    // Convert number back to percentile string format
                    if (value === null || value === '' || isNaN(value)) {
                        onExceptionalStrengthChange(null);
                    } else {
                        const numValue = parseInt(value, 10);
                        // 0 or 100 both represent percentile "00" (100)
                        if (numValue === 0 || numValue === 100) {
                            onExceptionalStrengthChange('00');
                        } else if (numValue >= 1 && numValue <= 99) {
                            // Pad to 2 digits: "01", "47", "99", etc.
                            onExceptionalStrengthChange(numValue.toString().padStart(2, '0'));
                        } else {
                            onExceptionalStrengthChange(null);
                        }
                    }
                }
            }
        }
    );

    return (
        <div className="inner-border stat-block">
            <div id={statPrefix}>
                {/* Editable Score Input */}
                <div className="stat-header">
                    <label htmlFor={`${statPrefix}-input`}>
                        <h3>{statName}: </h3>
                    </label>
                    <div className="stat-input-wrapper">
                        <input
                            id={`${statPrefix}-input`}
                            type="text"
                            inputMode="numeric"
                            value={inputValue}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            min={STAT_MIN}
                            max={STAT_MAX}
                            className="stat-score-input"
                        />
                        {onStatOverrideChange && (
                            <label className="stat-override-checkbox" title="Override racial maximum">
                                <input
                                    type="checkbox"
                                    checked={statOverride || false}
                                    onChange={(e) => onStatOverrideChange(e.target.checked)}
                                />
                                <span>Override</span>
                            </label>
                        )}
                    </div>
                </div>
                
                {/* Exceptional Strength Input (only for Strength, warriors, natural 18, not halfling) */}
                {canHaveExceptionalStrength && (
                    <div className="stat-header exceptional-strength-header">
                        <label htmlFor={`${statPrefix}-exceptional-input`}>
                            <span className="exceptional-strength-label">Exceptional Strength:</span>
                        </label>
                        <input
                            id={`${statPrefix}-exceptional-input`}
                            type="text"
                            inputMode="numeric"
                            value={exceptionalStrengthInput.inputValue}
                            onChange={exceptionalStrengthInput.handleChange}
                            onBlur={exceptionalStrengthInput.handleBlur}
                            min={0}
                            max={100}
                            placeholder="00-100"
                            className="stat-score-input exceptional-strength-input"
                        />
                    </div>
                )}
                
                <hr className="style14"></hr>
                
                {/* Derived Stats (read-only) */}
                <ul className="no-disc-list">
                    {statsToDisplay.map((stat, index) => (
                        <li key={index}>
                            {stat.label}: {stat.value}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}