import React from "react";

//reusable statblock function
/**
 * Renders the score and derived statistics for a single D&D Attribute.
 * @param {object} props
 * @param {string} props.statName - The full name of the stat (e.g., "Strength").
 * @param {number} props.score - The final adjusted score.
 * @param {object} props.derivedData - The full object of calculated results.
 */
export default function StatBlock({ statName, score, derivedData }) {

    // Helper to get the first three letters of the stat name for key prefixing
    // e.g., 'Strength' -> 'str', 'Constitution' -> 'con'
    const statPrefix = statName.toLowerCase().slice(0, 3);
    
    // Check if derivedData is available before attempting lookups
    if (!derivedData) return null;

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
            { label: 'Poison Save', value: derivedData.conPoisonSave },
            { label: 'Regen', value: derivedData.conRegeneration },
            // Note: Add conditional logic to block the display of this to non-Dwarfs
            { label: 'Dwarf Save Bonus', value: `+${derivedData.conSaveBonus}` }, 
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
            { label: 'Mag Def Adj', value: derivedData.wisMagicalDefenseAdj },
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

    return (
        <div className="inner-border stat-block">
            <div id={statPrefix}>
                <h3 className="">{statName}: {score}</h3>
                <hr className="style14"></hr>
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