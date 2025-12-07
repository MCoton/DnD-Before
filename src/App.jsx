import React, { useState, useMemo } from "react";
import './index.css'

import armourTable from "./data/armour_class.json";
import { calculateDerivedStats } from "./rulesEngine";
import raceMods from "./data/race_mods.json";
import charClass from "./data/character_classes.json";
import charClassAbilities from "./data/character_abilities_text.json";
import StatBlock from "./components/statBlock.jsx";
import SavingThrows from "./components/SavingThrowsDisplay.jsx";
import SpellImmunitiesDisplay from "./components/SpellImmunitiesDisplay.jsx";
import CombatStatsDisplay from "./components/CombatStatsDisplay.jsx";
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
    characterClass: "",
    race: "Human",
    gender: "Male",

    // CORE stats (Raw user input)
    scores: {
        str: 24,
        dex: 25,
        con: 24,
        int: 24,
        wis: 24,
        cha: 25
    },

    // Progressional stats
    level: 1,
    xp: 0,
    hp: {
        base: 10, // The manually rolled numbers
        bonus: 0, // Will be the "con" modifier
        current: 0, // HP minus any damage
        hpMax: 0 // Maximum HP if uninjured, lus and "con" bonus
    },

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

    // Function to handle level changes
    const handleLevelChange = (e) => {
        const { value } = e.target;
        
        // Convert to number and clamp between 1 and 20
        const newLevel = Math.min(20, Math.max(1, parseInt(value) || 1));
        
        setCharacter(prevCharacter => ({
            ...prevCharacter,
            level: newLevel
        }));
    };


    //Simplified useMemo call
    const derivedStats = useMemo(() => {
        return calculateDerivedStats(character);
    })

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
        <div className="page-header general-box">
            <h1>D&D Be...fore</h1>
        </div>
    <div className="wrapper">

        <div className="container-details details-box">
            <div className="general-box">
                <h2>Name: {character.name}</h2>
                {/* Character class selector */}
                <label className="general-box">
                    <h3>Class: </h3>
                     <select
                        name="characterClass"
                        value={character.characterClass || ""}
                        onChange={handleClassChanges} // Handler set up
                    >
                    <option value= "">Choose class</option>
                    {CLASS_OPTIONS.map(charClass => (
                        <option key={charClass} value={charClass}>{capitaliseWords(charClass)}</option>
                    ))}

                    </select>

                </label>

                {/* RACE selector */}
                <label className="general-box">
                    <h3>Race: </h3>
                    <select
                        name="race"
                        value={character.race || ""}
                        onChange={handleRaceChanges} // Use the new handler
                        >
                        <option value = "">Choose race</option> {/* Default Race value */}
                        {RACE_OPTIONS.map(race => (
                            <option key={race} value={race}>{capitaliseWords(race)}</option>
                        ))}
                    </select>
                </label>
                (Racial Adj: {racialAdjDisplay})

                <label className="general-box">
                    <h3>Level: </h3>
                    <input
                        type="number"
                        name="level"
                        value={character.level}
                        onChange={handleLevelChange}
                        min="1"
                        max="20"
                        className="level-input"
                    />
                </label>
            </div>

            <div className="general-box">
                <h2 className="">Equipment & Armour Class (AC)</h2>
                <div className="general-box">
                    {/* ARMOUR TYPE DROPDOWN */}
                    <label className="flex flex-col">
                        <h3>Armour Type: </h3>
                        <select 
                            name="armourType" // Key used in handleArmourChanges
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
                            name="shield" // Key used in handleArmourChanges
                            checked={character.ac.shield}
                            onChange={handleArmourChanges}
                            />
                        <span>Equipped with Shield</span>
                    </label>
                </div>

                {/* Display the calculated AC */}
                <div className="general-box">
                    <p className="no-margin">
                        Front:  {derivedStats.acFinal} | 
                        Rear: {derivedStats.acComponents.base} |
                        Dex Adj: {derivedStats.acComponents.dexAdj} |
                        Shield Adj: {derivedStats.acComponents.shieldAdj}
                    </p>
                </div>
            </div>

            <div className="general-box">
                <h2 className="">Health Points (HP)</h2>
                <ul className="no-disc-list">
                    <li className="hori-list">Base HP (Rolled): **{character.hp.base}**</li>
                    <li className="hori-list">Con Bonus: **{derivedStats.conHitPointAdj}**</li>
                    <li className="hori-list">Max HP: **{derivedStats.hpMax}**</li>
                    <li className="hori-list">Current HP: **{derivedStats.currentHp}**</li>
                </ul>
            </div>
        </div>

            {/* STATS BLOCK  */}
        <div className="container area-box"> 
            {/* The grid classes are an example to display them nicely */}
            <StatBlock 
                statName="Strength" 
                score={derivedStats.adjustedScores.str} 
                derivedData={derivedStats} 
                />

            <StatBlock 
                statName="Dexterity" 
                score={derivedStats.adjustedScores.dex} 
                derivedData={derivedStats} 
                />

            <StatBlock 
                statName="Constitution" 
                score={derivedStats.adjustedScores.con} 
                derivedData={derivedStats} 
                />

            <StatBlock 
                statName="Intelligence" 
                score={derivedStats.adjustedScores.int} 
                derivedData={derivedStats} 
                />

            <StatBlock 
                statName="Wisdom" 
                score={derivedStats.adjustedScores.wis} 
                derivedData={derivedStats} 
                />

            <StatBlock 
                statName="Charisma" 
                score={derivedStats.adjustedScores.cha} 
                derivedData={derivedStats} 
                />

        </div>
        <div className="saving-throws-block">
            {/* SAVING THROWS - ADD THIS */}
            <SavingThrows
                savingThrows={derivedStats.savingThrows}
                characterClass={character.characterClass}
                characterLevel={character.level}
            />
            
            {/* Any spell immunities derived from Class, Race or Wisdom score */}
            <SpellImmunitiesDisplay 
            immunities={derivedStats.wisSpellImmunity}
            wisdomScore={derivedStats.adjustedScores.wis}
            />

            <CombatStatsDisplay 
            combat={derivedStats.combat}
            characterClass={character.characterClass}
            characterLevel={character.level}
            />

        </div>          
        </div>
      </>
    )
}

