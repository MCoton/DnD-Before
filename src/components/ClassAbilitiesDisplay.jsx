import React from 'react';
import charClassAbilities from '../data/classes/character_abilities_text.json';
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

    // Top-level string abilities (exclude levelAbilities and numeric keys like saveVal, layOnVal)
    const abilityEntries = Object.entries(classData)
        .filter(([key, value]) => key !== 'levelAbilities' && typeof value === 'string' && value.length > 0);

    // Level-gated abilities (e.g. druid levelAbilities: { "3": [...], "7": [...], "15": [...] })
    const levelAbilities = classData.levelAbilities;
    const levelGatedEntries = [];
    if (levelAbilities && typeof levelAbilities === 'object' && characterLevel != null) {
        Object.entries(levelAbilities)
            .filter(([levelStr]) => {
                const level = parseInt(levelStr, 10);
                return !isNaN(level) && characterLevel >= level;
            })
            .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
            .forEach(([levelStr, texts]) => {
                const arr = Array.isArray(texts) ? texts : [texts];
                arr.forEach((text, i) => {
                    levelGatedEntries.push({ level: levelStr, text: String(text), key: `${levelStr}-${i}` });
                });
            });
    }

    const hasAnyAbilities = abilityEntries.length > 0 || levelGatedEntries.length > 0;

    return (
        <div className="class-abilities-block area-box details-box">
            <h3 className="title">{capitaliseWords(characterClass)} Abilities</h3>
            <hr className="style14"></hr>
            {hasAnyAbilities ? (
                <ul className="abilities-list">
                    {abilityEntries.map(([key, text]) => (
                        <li key={key} className="ability-item">
                            <p>{text}</p>
                        </li>
                    ))}
                    {levelGatedEntries.map(({ key, level, text }) => (
                        <li key={key} className="ability-item level-ability">
                            <p><strong>Level {level}:</strong> {text}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-data-message">No ability data available - yet - for {capitaliseWords(characterClass)}</p>
            )}
        </div>
    );
}