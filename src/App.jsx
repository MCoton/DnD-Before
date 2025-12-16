import React, { useState, useMemo } from "react";
import './index.css'

import armourTable from "./data/armour_class.json";
import { calculateDerivedStats } from "./rulesEngine";
import raceMods from "./data/race_mods.json";
import charClass from "./data/character_classes.json";
import StatBlock from "./components/statBlock.jsx";
import SavingThrows from "./components/SavingThrowsDisplay.jsx";
import SpellImmunitiesDisplay from "./components/SpellImmunitiesDisplay.jsx";
import CombatStatsDisplay from "./components/CombatStatsDisplay.jsx";
import ClassAbilitiesDisplay from "./components/ClassAbilitiesDisplay.jsx";
import WeaponProficiencies from "./components/WeaponProficienciesDisplay.jsx";
import SpellSlotDisplay from "./components/SpellSlotDisplay.jsx";
import { capitaliseWords } from "./utils.js";

// Object.keys() pulls all the base armour names directly for the dropdown.
const ARMOUR_OPTIONS = Object.keys(armourTable.armourType);
// Same for races held in raceMods
const RACE_OPTIONS = Object.keys(raceMods);
// And again for class
const CLASS_OPTIONS = Object.keys(charClass);

// Initial data model for a new character
const initialCharacterState = {
    // Identity
    name: "Bozo",
    characterClass: "paladin",
    race: "human",
    gender: "male",

    // CORE stats (Raw user input)
    scores: {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 25,
        cha: 10
    },

    // Progressional stats
    xp: 10000,
    hp: {
        base: 10, // The manually rolled numbers
        bonus: 0, // Will be the "con" modifier
        current: 0, // HP minus any damage
        hpMax: 0 // Maximum HP if uninjured, plus and "con" bonus
    },

    // Weapon proficiencies (key = weaponId, value = slots invested)
    weaponProficiencies: {},

    // Gear stats
    ac: {
        base: 10,
        dexAdj: 0,
        armourType: "",
        shield: false
    }
}

export default function CharacterSheet() {
    // Use the useState hook to manage the character's data.
    // 'character' is the current state object.
    // 'setCharacter' is the function we call to change the state.
    const [character, setCharacter] = useState(initialCharacterState);

    // Function to handle changes in armour set up
    const handleArmourChanges = (e) => {
        const { name, value, type, checked } = e.target;

        setCharacter(prevCharacter => ({
            ...prevCharacter,
            ac: {
                ...prevCharacter.ac,
                [name]: type === 'checkbox' ? checked : value,
            }
        }));
    };

    // Function to handle changes in Race selection
    const handleRaceChanges = (e) => {
        const {value} = e.target;
        setCharacter(prevCharacter => ({
            ...prevCharacter,
            race: value, //Update the race with selection
        }))
    }

    // Function to handle Character Class selection
    const handleClassChanges = (e) => {
        const {value} = e.target;
        setCharacter(prevCharacter => ({
            ...prevCharacter,
            characterClass: value, // Update the Character Class with selection
        }))
    }

    // Function to handle name changes
    const handleNameChange = (e) => {
        const { value } = e.target;
        setCharacter(prevCharacter => ({
            ...prevCharacter,
            name: value
        }));
    };

    // Function to handle ability score changes from stat blocks
    const handleScoreChange = (statAbbrev, newValue) => {
        setCharacter(prevCharacter => ({
            ...prevCharacter,
            scores: {
                ...prevCharacter.scores,
                [statAbbrev]: newValue
            }
        }));
    };

    // Function to handle HP base changes
    const handleHPChange = (e) => {
        const { value } = e.target;
        
        // Allow any positive number for HP
        const newHP = Math.max(1, parseInt(value) || 1);
        
        setCharacter(prevCharacter => ({
            ...prevCharacter,
            hp: {
                ...prevCharacter.hp,
                base: newHP
            }
        }));
    };

    // Function to handle XP changes (auto-calculates level)
    const handleXPChange = (e) => {
        const { value } = e.target;
        const newXP = Math.max(0, parseInt(value) || 0);
        
        // Simply update XP - level will be calculated in rulesEngine
        setCharacter(prevCharacter => ({
            ...prevCharacter,
            xp: newXP
        }));
    };

    // Function to update weapon proficiency (add or change slot count)
    const handleAddProficiency = (weaponKey, slots) => {
        setCharacter(prevCharacter => ({
            ...prevCharacter,
            weaponProficiencies: {
                ...prevCharacter.weaponProficiencies,
                [weaponKey]: slots
            }
        }));
    };

    // Function to remove weapon proficiency
    const handleRemoveProficiency = (weaponKey) => {
        setCharacter(prevCharacter => {
            const newProficiencies = { ...prevCharacter.weaponProficiencies };
            delete newProficiencies[weaponKey];
            return {
                ...prevCharacter,
                weaponProficiencies: newProficiencies
            };
        });
    };


    // Simplified useMemo call
    const derivedStats = useMemo(() => {
        return calculateDerivedStats(character);
    }, [character]);

    // Derive racial adjustment string
    let racialAdjDisplay = 'none';
    const adjustments = derivedStats.raceAdjustments;

    if(adjustments && Object.keys(adjustments).length > 0) {
        racialAdjDisplay = Object.entries(adjustments)
            .map(([stat, value]) => `${stat}: ${value}`)
            .join(' ');
    }

    return(
        <>
            <div className="page-header">
                <h1>D&D Be...fore</h1>
            </div>
            
            <div className="wrapper">

                <div className="container area-box">
                    
                    {/* NAME AND IDENTITY SECTION */}
                    <div className="">
                        <h3>Character Identity</h3>
                        
                        {/* Name Input */}
                        <label className="input-row">
                            <span className="input-label">Name:</span>
                            <input
                                type="text"
                                name="name"
                                value={character.name}
                                onChange={handleNameChange}
                                className="text-input"
                                placeholder="Enter character name"
                            />
                        </label>

                        {/* Character Class Selector */}
                        <label className="input-row">
                            <span className="input-label">Class:</span>
                            <select
                                name="characterClass"
                                value={character.characterClass || ""}
                                onChange={handleClassChanges}
                                className="select-input"
                            >
                                <option value="">Choose class</option>
                                {CLASS_OPTIONS.map(charClass => (
                                    <option key={charClass} value={charClass}>
                                        {capitaliseWords(charClass)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {/* Race Selector */}
                        <label className="input-row">
                            <span className="input-label">Race:</span>
                            <select
                                name="race"
                                value={character.race || ""}
                                onChange={handleRaceChanges}
                                className="select-input"
                            >
                                <option value="">Choose race</option>
                                {RACE_OPTIONS.map(race => (
                                    <option key={race} value={race}>
                                        {capitaliseWords(race)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        
                        {racialAdjDisplay !== 'none' && (
                            <p className="racial-adj-display">Racial Adjustments: {racialAdjDisplay}</p>
                        )}
                    </div>

                    {/* PROGRESSION SECTION */}
                    <div className="">
                        <h3>Experience & Progression</h3>
                        
                        {/* Experience Points */}
                        <label className="input-row">
                            <span className="input-label">Experience Points:</span>
                            <input
                                type="number"
                                name="xp"
                                value={character.xp}
                                onChange={handleXPChange}
                                min=""
                                className="number-input"
                            />
                        </label>

                        {/* Level (calculated from XP - read only) */}
                        <label className="input-row">
                            <span className="input-label">Level:</span>
                            <input
                                type="number"
                                name="level"
                                value={derivedStats.level}  // ← Changed from character.level
                                readOnly  // ← Added read-only attribute
                                className="number-input level-readonly"  // ← Added class for styling
                            />
                            <span className="input-note">(Calculated from XP)</span>
                        </label>

                        {/* Base HP */}
                        <label className="input-row">
                            <span className="input-label">Base Hit Points:</span>
                            <input
                                type="number"
                                name="baseHP"
                                value={character.hp.base}
                                onChange={handleHPChange}
                                min="1"
                                className="number-input"
                            />
                            <span className="input-note">(Rolled HD total)</span>
                        </label>

                        {/* Display calculated max HP */}
                        <div className="calculated-stat">
                            <span className="stat-label">Maximum HP:</span>
                            <span className="stat-value">{derivedStats.hpMax}</span>
                        </div>
                    </div>

                    <div className="">
                        <h3 className="">Equipment & Armour Class (AC)</h3>
                        <div className="">
                            {/* ARMOUR TYPE DROPDOWN */}
                            <label className="flex flex-col">
                                <h3>Armour Type: </h3>
                                <select 
                                    name="armourType"
                                    value={character.ac.armourType}
                                    onChange={handleArmourChanges}
                                    className="p-1 border rounded"
                                >
                                    {ARMOUR_OPTIONS.map(armour => (
                                        <option key={armour} value={armour}>{capitaliseWords(armour)}</option>
                                    ))}
                                </select>
                            </label>

                            {/* SHIELD CHECKBOX */}
                            <label className="check-box">
                                <input 
                                    type="checkbox"
                                    name="shield"
                                    checked={character.ac.shield}
                                    onChange={handleArmourChanges}
                                />
                                <span>Equipped with Shield</span>
                            </label>
                        </div>

                        {/* Display the calculated AC */}
                        <div className="">
                            <p className="no-margin">
                                Front: {derivedStats.acFinal} | 
                                Rear: {derivedStats.acComponents.base} |
                                Dex Adj: {derivedStats.acComponents.dexAdj} |
                                Shield Adj: {derivedStats.acComponents.shieldAdj}
                            </p>
                        </div>
                    </div>

                    <div className="column-span">
                        <h3 className="">Health Points (HP)</h3>
                        <ul className="no-disc-list">
                            <li className="hori-list">Base HP (Rolled): **{character.hp.base}**</li>
                            <li className="hori-list">Con Bonus: **{derivedStats.conHitPointAdj}**</li>
                            <li className="hori-list">Max HP: **{derivedStats.hpMax}**</li>
                            <li className="hori-list">Current HP: **{derivedStats.currentHp}**</li>
                        </ul>
                    </div>
                </div>

                {/* STATS BLOCK */}
                <div className="container main-stats area-box"> 
                    <StatBlock 
                        statName="Strength" 
                        score={character.scores.str}  // ← Changed from derivedStats.adjustedScores.str
                        adjustedScore={derivedStats.adjustedScores.str}  // ← NEW: Pass adjusted for display
                        derivedData={derivedStats}
                        onScoreChange={handleScoreChange}
                    />

                    <StatBlock 
                        statName="Dexterity" 
                        score={character.scores.dex}  // ← Raw score
                        adjustedScore={derivedStats.adjustedScores.dex}  // ← Adjusted score
                        derivedData={derivedStats} 
                        onScoreChange={handleScoreChange}
                    />

                    <StatBlock 
                        statName="Constitution" 
                        score={character.scores.con}  // ← Raw score
                        adjustedScore={derivedStats.adjustedScores.con}  // ← Adjusted score
                        derivedData={derivedStats} 
                        onScoreChange={handleScoreChange}
                        race={character.race}
                    />

                    <StatBlock 
                        statName="Intelligence" 
                        score={character.scores.int}  // ← Raw score
                        adjustedScore={derivedStats.adjustedScores.int}  // ← Adjusted score
                        derivedData={derivedStats} 
                        onScoreChange={handleScoreChange}
                    />

                    <StatBlock 
                        statName="Wisdom" 
                        score={character.scores.wis}  // ← Raw score
                        adjustedScore={derivedStats.adjustedScores.wis}  // ← Adjusted score
                        derivedData={derivedStats} 
                        onScoreChange={handleScoreChange}
                    />

                    <StatBlock 
                        statName="Charisma" 
                        score={character.scores.cha}  // ← Raw score
                        adjustedScore={derivedStats.adjustedScores.cha}  // ← Adjusted score
                        derivedData={derivedStats} 
                        onScoreChange={handleScoreChange}
                    />
                </div>

                <div className= "combat-stats area-box">
                    <CombatStatsDisplay 
                    combat={derivedStats.combat}
                    characterClass={character.characterClass}
                    characterLevel={derivedStats.level}
                    />
                </div>

                <div className="saving-throws-block area-box column-span">
                    {/* SAVING THROWS */}
                    <SavingThrows
                        savingThrows={derivedStats.savingThrows}
                        characterClass={character.characterClass}
                        characterLevel={derivedStats.level}
                        magicalDefenseAdj={derivedStats.wisMagicalDefenseAdj}
                    />
                </div>

                {/* SPELL IMMUNITIES */}
                <div className="spell-immunities-block column-span">
                    {/* Any spell immunities derived from Class, Race or Wisdom score */}
                    <SpellImmunitiesDisplay 
                        immunities={derivedStats.wisSpellImmunity}
                        wisdomScore={derivedStats.adjustedScores.wis}
                    />
                </div>
                
                {/* CLASS ABILITIES */}
                <div className="class-abilities-block column-span">
                    <ClassAbilitiesDisplay
                        characterClass={character.characterClass}
                        characterLevel={derivedStats.level}
                    />
                </div>

                {/* WEAPON PROFICIENCIES */}
                <div>
                    <WeaponProficiencies 
                        characterClass={character.characterClass}
                        characterLevel={derivedStats.level}
                        proficiencies={character.weaponProficiencies}
                        onAddProficiency={handleAddProficiency}
                        onRemoveProficiency={handleRemoveProficiency}
                        />
                </div>
                
                {/* SPELL SLOTS */}
                <div>
                    <SpellSlotDisplay 
                        characterClass={character.characterClass}
                        characterLevel={derivedStats.level}
                        />
                </div>
            </div>
        </>
    )
}