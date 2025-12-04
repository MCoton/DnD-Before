import React from 'react';

/**
 * Renders the expanded saving throws (10 subcategories) for a character.
 * @param {object} props
 * @param {object} props.savingThrows - Object with 10 subcategory values
 * @param {string} props.characterClass - The character's class name
 * @param {number} props.characterLevel - The character's level
 */
export default function SavingThrowsDisplay({ savingThrows, characterClass, characterLevel }) {
    // Check if saves are calculated (savingThrows is an object, not null/undefined)
    const isCalculated = savingThrows && typeof savingThrows === 'object';

    // Define the structure for displaying the 10 subcategories grouped by category
    const saveCategories = [
        {
            name: "Paralyzation, Poison, or Death Magic",
            subcategories: [
                { key: "paralyzation", label: "Paralyzation" },
                { key: "poison", label: "Poison" },
                { key: "deathMagic", label: "Death Magic" }
            ]
        },
        {
            name: "Rod, Staff, or Wand",
            subcategories: [
                { key: "rod", label: "Rod" },
                { key: "staff", label: "Staff" },
                { key: "wand", label: "Wand" }
            ]
        },
        {
            name: "Petrification or Polymorph",
            subcategories: [
                { key: "petrification", label: "Petrification" },
                { key: "polymorph", label: "Polymorph" }
            ]
        },
        {
            name: "Breath Weapon",
            subcategories: [
                { key: "breathWeapon", label: "Breath Weapon" }
            ]
        },
        {
            name: "Spell",
            subcategories: [
                { key: "spell", label: "Spell" }
            ]
        }
    ];

    return (
        <div className="saving-throws-block">
            <h2 className="title">Saving Throws</h2>
            <hr className="style14"></hr>
            
            {!isCalculated ? (
                <p className="no-class-message">
                    Select a class (and level) to calculate your base saving throws.
                </p>
            ) : (
                <div className="saves-grid">
                    {saveCategories.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="save-category">
                            {/* Category header */}
                            <h3 className="category-name">{category.name}</h3>
                            
                            {/* Subcategories */}
                            <ul className="subcategory-list">
                                {category.subcategories.map((sub) => (
                                    <li key={sub.key} className="save-entry hori-list">
                                        <span className="save-label">{sub.label}: </span>
                                        <span className="save-value">{savingThrows[sub.key]}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}