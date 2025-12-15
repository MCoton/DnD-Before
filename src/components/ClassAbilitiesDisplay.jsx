import React from 'react';
import charClassAbilities from '../data/character_abilities_text.json';
import { capitaliseWords } from '../utils';

/**
 * Displays class-specific abilities and features.
 * 
 * @param {object} props
 * @param {string} props.characterClass - The character's class name
 * @param {number} props.characterLevel - The character's level
 */

export default function ClassAbilitiesDisplay({ characterClass, characterLevel }) {
    // If no class selected, show message
    if (!characterClass) {
        return (
            <div className="class-abilities area-box details-box">
                <h3 className="title">Class Abilities</h3>
                <hr className="style14"></hr>
                <p className="no-class-message">
                    Abilities and features show here when you select a class. (So get on with it)
                </p>
            </div>
        );
    }

    // Get abilities for the selected class
    const classKey = characterClass.toLowerCase();
    const classData = charClassAbilities[classKey];

    // If no data found for this class
    if (!classData) {
        return (
            <div className="class-abilities-block area-box details-box">
                <h3 className="title">Class Abilities</h3>
                <hr className="style14"></hr>
                <p className="no-data-message">
                    No ability data available - yet - for {capitaliseWords(characterClass)}.
                </p>
            </div>
        );
    }

    // Filter out numeric values (like saveVal, layOnVal) and keep only text descriptions
    const abilityEntries = Object.entries(classData)
        .filter(([key, value]) => typeof value === 'string' && value.length > 0);

    return (
        <div className="class-abilities-block area-box details-box">
            <h3 className="title">{capitaliseWords(characterClass)} Abilities</h3>
            <hr className="style14"></hr>
                {abilityEntries.length > 0 ? (
                    <ul className="abilities-list">
                        {abilityEntries.map(([key, text]) => (
                            <li key={key} className="ability-item">
                                <p>{text}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-data-message">No ability data available - yet - for {capitaliseWords(characterClass)}</p>
                )}
        </div>
    );
}