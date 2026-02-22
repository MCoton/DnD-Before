import React from 'react';

/**
 * Displays THACO and combat-related statistics.
 * 
 * @param {object} props
 * @param {object} props.combat - Combat stats from derivedStats
 * @param {string} props.characterClass - Character's class name
 * @param {number} props.characterLevel - Character's level
 */
export default function CombatStatsDisplay({ combat, characterClass, characterLevel }) {
    // Don't render if no combat data
    if (!combat) {
        return (
            <div className="">
                <h2 className="title">Combat Statistics</h2>
                <hr className="style14"></hr>
                <p className="no-class-message">
                    Select a class and level to view combat statistics.
                </p>
            </div>
        );
    }

    return (
        <div className="">
            <h3 className="title">Combat Statistics</h3>
            <hr className="style14"></hr>

            <div className="combat-grid">
                {/* THACO Section */}
                <div className="combat-section">
                    <h3 className="section-title">THACO (To Hit AC 0)</h3>
                    
                    <div className="stat-row">
                        <span className="stat-label">Base THACO:</span>
                        <span className="stat-value">{combat.baseThaco}</span>
                    </div>

                    <div className="stat-row">
                        <span className="stat-label">Melee THACO:</span>
                        <span className="stat-value">
                            {combat.meleeThaco}
                            {combat.strBonus !== 0 && (
                                <span className="modifier"> (STR: {combat.strBonus >= 0 ? '+' : ''}{combat.strBonus})</span>
                            )}
                        </span>
                    </div>

                    <div className="stat-row">
                        <span className="stat-label">Missile THACO:</span>
                        <span className="stat-value">
                            {combat.missileThaco}
                            {combat.dexBonus !== 0 && (
                                <span className="modifier"> (DEX: {combat.dexBonus >= 0 ? '+' : ''}{combat.dexBonus})</span>
                            )}
                        </span>
                    </div>
                </div>

                {/* Attacks and Damage Section */}
                <div className="combat-section">
                    <h3 className="section-title">Attacks & Damage</h3>
                    
                    <div className="stat-row">
                        <span className="stat-label">Attacks per Round:</span>
                        <span className="stat-value">{combat.attacksPerRound}</span>
                    </div>

                    <div className="stat-row">
                        <span className="stat-label">Damage Adjustment:</span>
                        <span className="stat-value">
                            {combat.strDamage >= 0 ? '+' : ''}{combat.strDamage}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}