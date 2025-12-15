import React from 'react';

/**
 * Displays THAC0 and combat-related statistics.
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
                {/* THAC0 Section */}
                <div className="combat-section">
                    <h3 className="section-title">THAC0 (To Hit AC 0)</h3>
                    
                    <div className="stat-row">
                        <span className="stat-label">Base THAC0:</span>
                        <span className="stat-value">{combat.baseThac0}</span>
                    </div>

                    <div className="stat-row">
                        <span className="stat-label">Melee THAC0:</span>
                        <span className="stat-value">
                            {combat.meleeThac0}
                            {combat.strBonus !== 0 && (
                                <span className="modifier"> (STR: {combat.strBonus >= 0 ? '+' : ''}{combat.strBonus})</span>
                            )}
                        </span>
                    </div>

                    <div className="stat-row">
                        <span className="stat-label">Missile THAC0:</span>
                        <span className="stat-value">
                            {combat.missileThac0}
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