import React from 'react';

/**
 * Renders the five standard Saving Throws for a character.
 * @param {object} props
 * @param {number[]} props.savingThrows - An array of 5 calculated target numbers.
 * @param {string} props.characterClass - The character's class name.
 */
export default function SavingThrowsDisplay({ savingThrows, characterClass }) {
    // Labels corresponding to the 5 saving throw indices
    const labels = [
        "Paralyze, Poison, Death Magic", // Index 0 (Affected by CON Poison Save)
        "Rod, Staff, Wand",             // Index 1
        "Petrification, Polymorph",     // Index 2
        "Breath Weapon",                // Index 3
        "Spell",                        // Index 4
    ];

    // Check if the throws are calculated (i.e., not the initial [0, 0, 0, 0, 0] state)
    const isCalculated = savingThrows && savingThrows.length === 5 && savingThrows[0] !== 0;

    return (
        <div className="area-box details-box saving-throws-block">
            <h2 className="title">Saving Throws</h2>
            <hr className="style14"></hr>
            
            {!isCalculated ? (
                <p className="no-class-message">
                    Select a class (and level) to calculate your base saving throws.
                </p>
            ) : (
                <div className="saves-grid">
                    {labels.map((label, index) => (
                        <div key={index} className="save-entry">
                            <span className="save-label">{label}</span>
                            {/* Lower numbers are better, so we display the required target number */}
                            <span className="save-value">{savingThrows[index]}</span>
                        </div>
                    ))}
                </div>
            )}
            
            <p className="caption">
                Target rolls are for level {isCalculated ? '1' : 'X'} {characterClass}. Lower is better.
            </p>
        </div>
    );
}