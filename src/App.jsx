import React, { useState, useMemo, useEffect } from "react";
import './index.css'

import { calculateDerivedStats } from "./rulesEngine";
import StatBlock from "./components/statBlock.jsx";
import SavingThrows from "./components/SavingThrowsDisplay.jsx";
import SpellImmunitiesDisplay from "./components/SpellImmunitiesDisplay.jsx";
import CombatStatsDisplay from "./components/CombatStatsDisplay.jsx";
import ClassAbilitiesDisplay from "./components/ClassAbilitiesDisplay.jsx";
import WeaponProficiencies from "./components/WeaponProficienciesDisplay.jsx";
import NonWeapProfDisplay from "./components/NonWeapProfDisplay.jsx";
import SpellSlotDisplay from "./components/SpellSlotDisplay.jsx";
import SpellDisplay from "./components/SpellDisplay.jsx";
import charClasses from "./data/classes/character_classes.json";
import SelectInput from "./components/SelectInput.jsx";
import { capitaliseWords } from "./utils.js";
import { useNumericInput } from "./hooks/useNumericInput.js";
import { updateNestedState } from "./utils/stateHelpers.js";
import { ARMOUR_OPTIONS, RACE_OPTIONS, CLASS_OPTIONS } from "./constants/characterOptions.js";
import { HP_MIN, XP_MIN } from "./constants/characterLimits.js";
import { RACES } from "./constants/races.js";

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
        wis: 10,
        cha: 10
    },
    
    // Stat override flags (bypass racial maximums)
    statOverrides: {
        str: false,
        dex: false,
        con: false,
        int: false,
        wis: false,
        cha: false
    },
    
    // Exceptional Strength (for warriors with natural 18 Strength)
    exceptionalStrength: null, // Can be "18/01", "18/51", "18/76", or "18/00"
    
    // Race and Class override flags (bypass filtering rules)
    raceOverride: false,
    classOverride: false,

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

    // Non-weapon proficiencies (array of proficiency names)
    nonWeaponProficiencies: [],

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
    
    // Use custom hook for numeric input handling
    const hpInput = useNumericInput(character.hp.base, {
        min: HP_MIN,
        onUpdate: (value) => updateNestedState(setCharacter, ['hp', 'base'], value)
    });
    
    const xpInput = useNumericInput(character.xp, {
        min: XP_MIN,
        onUpdate: (value) => updateNestedState(setCharacter, 'xp', value)
    });

    // Function to handle changes in armour set up
    const handleArmourChanges = (e) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;
        updateNestedState(setCharacter, ['ac', name], fieldValue);
    };

    // Function to handle changes in Race selection
    const handleRaceChanges = (e) => {
        updateNestedState(setCharacter, 'race', e.target.value);
    };

    // Filter available races: stat requirements + race must be allowed for selected class (RACES[race].levelLimits)
    const availableRaces = useMemo(() => {
        if (character.raceOverride) {
            return RACE_OPTIONS;
        }

        const classKey = character.characterClass?.toLowerCase();

        return RACE_OPTIONS.filter(race => {
            const raceData = RACES[race];
            // If a class is selected, race can only be chosen if it can take that class (present in levelLimits)
            if (classKey && raceData?.levelLimits && !Object.prototype.hasOwnProperty.call(raceData.levelLimits, classKey)) {
                return false;
            }

            const requirements = raceData?.requirements;
            if (!requirements) return true;

            const scores = character.scores;
            const statKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

            return statKeys.every(stat => {
                const statRequirements = requirements[stat];
                if (!statRequirements) return true;

                const minRequired = statRequirements.min;
                const maxAllowed = statRequirements.max;
                const score = scores[stat];

                if (score === undefined) return true;

                if (minRequired !== undefined && score < minRequired) {
                    return false;
                }
                if (maxAllowed !== undefined && score > maxAllowed) {
                    if (!character.statOverrides[stat]) {
                        return false;
                    }
                }
                return true;
            });
        });
    }, [character.scores, character.statOverrides, character.raceOverride, character.characterClass]);

    // Filter available classes: race's levelLimits (race can only adopt classes listed there) + min stat requirements
    const availableClasses = useMemo(() => {
        if (character.classOverride) {
            return CLASS_OPTIONS;
        }

        const raceKey = character.race?.toLowerCase() || 'human';
        const raceData = RACES[raceKey];
        const levelLimits = raceData?.levelLimits || {};

        return CLASS_OPTIONS.filter(classKey => {
            const classData = charClasses[classKey];
            if (!classData) return true;

            // Race can only adopt classes present in its levelLimits; absence means class is prohibited
            if (!Object.prototype.hasOwnProperty.call(levelLimits, classKey)) {
                return false;
            }

            const minStatreqs = classData.minStatreqs;
            if (!minStatreqs) return true;

            const statAdjustments = raceData?.statAdj || {};
            const scores = character.scores;

            return Object.entries(minStatreqs).every(([stat, minRequired]) => {
                const rawScore = scores[stat];
                if (rawScore === undefined) return false;
                const adjustment = statAdjustments[stat] || 0;
                const adjustedScore = rawScore + adjustment;
                return adjustedScore >= minRequired;
            });
        });
    }, [character.scores, character.race, character.classOverride]);

    // When override is off, keep race/class in sync with filtered lists so we never show an invalid combination
    useEffect(() => {
        if (character.raceOverride && character.classOverride) return;
        setCharacter(prev => {
            let next = { ...prev };
            let changed = false;
            if (!character.classOverride && prev.characterClass && availableClasses.length > 0) {
                const classKey = prev.characterClass?.toLowerCase();
                if (!availableClasses.includes(classKey)) {
                    next.characterClass = availableClasses[0];
                    changed = true;
                }
            }
            if (!character.raceOverride && prev.race && availableRaces.length > 0) {
                const raceKey = prev.race?.toLowerCase();
                if (!availableRaces.includes(raceKey)) {
                    next.race = availableRaces[0];
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [character.raceOverride, character.classOverride, character.race, character.characterClass, availableRaces, availableClasses]);

    // Function to handle Character Class selection
    const handleClassChanges = (e) => {
        updateNestedState(setCharacter, 'characterClass', e.target.value);
    };

    // Function to handle name changes
    const handleNameChange = (e) => {
        updateNestedState(setCharacter, 'name', e.target.value);
    };

    // Function to handle ability score changes from stat blocks
    const handleScoreChange = (statAbbrev, newValue) => {
        updateNestedState(setCharacter, ['scores', statAbbrev], newValue);
    };

    // Function to update weapon proficiency (add or change slot count)
    const handleAddProficiency = (weaponKey, slots) => {
        updateNestedState(setCharacter, ['weaponProficiencies', weaponKey], slots);
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

    // Function to handle non-weapon proficiency changes
    const handleNonWeaponProficiencyChange = (index, proficiencyName) => {
        setCharacter(prevCharacter => {
            const newProficiencies = [...(prevCharacter.nonWeaponProficiencies || [])];
            
            if (proficiencyName && proficiencyName !== '') {
                // Adding a new proficiency - append to array
                newProficiencies.push(proficiencyName);
            } else if (index < newProficiencies.length) {
                // Removing a proficiency at a specific index
                newProficiencies.splice(index, 1);
            }
            
            return {
                ...prevCharacter,
                nonWeaponProficiencies: newProficiencies
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
                        <div className="input-row">
                            <SelectInput
                                label="Class"
                                name="characterClass"
                                value={character.characterClass}
                                onChange={handleClassChanges}
                                options={availableClasses.map(cls => ({
                                    value: cls,
                                    label: capitaliseWords(cls)
                                }))}
                            />
                            <label className="override-checkbox">
                                <input
                                    type="checkbox"
                                    checked={character.classOverride || false}
                                    onChange={(e) => updateNestedState(setCharacter, 'classOverride', e.target.checked)}
                                />
                                <span>Override</span>
                            </label>
                        </div>

                        {/* Race Selector */}
                        <div className="input-row">
                            <SelectInput
                                label="Race"
                                name="race"
                                value={character.race}
                                onChange={handleRaceChanges}
                                options={availableRaces.map(race => ({
                                    value: race,
                                    label: capitaliseWords(race)
                                }))}
                            />
                            <label className="override-checkbox">
                                <input
                                    type="checkbox"
                                    checked={character.raceOverride || false}
                                    onChange={(e) => updateNestedState(setCharacter, 'raceOverride', e.target.checked)}
                                />
                                <span>Override</span>
                            </label>
                        </div>
                        
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
                                type="text"
                                inputMode="numeric"
                                name="xp"
                                value={xpInput.inputValue}
                                onChange={xpInput.handleChange}
                                onBlur={xpInput.handleBlur}
                                min={XP_MIN}
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
                                type="text"
                                inputMode="numeric"
                                name="baseHP"
                                value={hpInput.inputValue}
                                onChange={hpInput.handleChange}
                                onBlur={hpInput.handleBlur}
                                min={HP_MIN}
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
                                    <option value="">Choose armour type</option>
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
                        characterClass={character.characterClass}
                        race={character.race}
                        exceptionalStrength={character.exceptionalStrength}
                        onExceptionalStrengthChange={(value) => updateNestedState(setCharacter, 'exceptionalStrength', value)}
                        statOverride={character.statOverrides.str}
                        onStatOverrideChange={(value) => updateNestedState(setCharacter, ['statOverrides', 'str'], value)}
                    />

                    <StatBlock 
                        statName="Dexterity" 
                        score={character.scores.dex}  // ← Raw score
                        adjustedScore={derivedStats.adjustedScores.dex}  // ← Adjusted score
                        derivedData={derivedStats} 
                        onScoreChange={handleScoreChange}
                        statOverride={character.statOverrides.dex}
                        onStatOverrideChange={(value) => updateNestedState(setCharacter, ['statOverrides', 'dex'], value)}
                    />

                    <StatBlock 
                        statName="Constitution" 
                        score={character.scores.con}  // ← Raw score
                        adjustedScore={derivedStats.adjustedScores.con}  // ← Adjusted score
                        derivedData={derivedStats} 
                        onScoreChange={handleScoreChange}
                        race={character.race}
                        statOverride={character.statOverrides.con}
                        onStatOverrideChange={(value) => updateNestedState(setCharacter, ['statOverrides', 'con'], value)}
                    />

                    <StatBlock 
                        statName="Intelligence" 
                        score={character.scores.int}  // ← Raw score
                        adjustedScore={derivedStats.adjustedScores.int}  // ← Adjusted score
                        derivedData={derivedStats} 
                        onScoreChange={handleScoreChange}
                        statOverride={character.statOverrides.int}
                        onStatOverrideChange={(value) => updateNestedState(setCharacter, ['statOverrides', 'int'], value)}
                    />

                    <StatBlock 
                        statName="Wisdom" 
                        score={character.scores.wis}  // ← Raw score
                        adjustedScore={derivedStats.adjustedScores.wis}  // ← Adjusted score
                        derivedData={derivedStats} 
                        onScoreChange={handleScoreChange}
                        statOverride={character.statOverrides.wis}
                        onStatOverrideChange={(value) => updateNestedState(setCharacter, ['statOverrides', 'wis'], value)}
                    />

                    <StatBlock 
                        statName="Charisma" 
                        score={character.scores.cha}  // ← Raw score
                        adjustedScore={derivedStats.adjustedScores.cha}  // ← Adjusted score
                        derivedData={derivedStats} 
                        onScoreChange={handleScoreChange}
                        statOverride={character.statOverrides.cha}
                        onStatOverrideChange={(value) => updateNestedState(setCharacter, ['statOverrides', 'cha'], value)}
                    />
                </div>

                <div className= "container combat-stats area-box">
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

                {/* PROFICIENCIES CONTAINER */}
                <div className="proficiencies-container">
                    {/* WEAPON PROFICIENCIES */}
                    <div className="proficiency-section">
                        <WeaponProficiencies
                            characterClass={character.characterClass}
                            characterLevel={derivedStats.level}
                            proficiencies={character.weaponProficiencies}
                            onAddProficiency={handleAddProficiency}
                            onRemoveProficiency={handleRemoveProficiency}
                            baseThac0={derivedStats.combat?.baseThac0}
                            strHitProb={derivedStats.strHitProb}
                            dexMissileAdj={derivedStats.dexMissileAdj}
                        />
                    </div>

                    {/* NON-WEAPON PROFICIENCIES */}
                    <div className="proficiency-section">
                        <NonWeapProfDisplay
                            characterClass={character.characterClass}
                            characterLevel={derivedStats.level}
                            abilityScores={derivedStats.adjustedScores}
                            proficiencies={character.nonWeaponProficiencies || []}
                            onProficiencyChange={handleNonWeaponProficiencyChange}
                        />
                    </div>
                </div>
                
                {/* SPELL SLOTS */}
                <div>
                    <SpellSlotDisplay 
                        characterClass={character.characterClass}
                        characterLevel={derivedStats.level}
                        intSpellLevel={derivedStats.intSpellLevel}
                        />
                </div>

                {/* SPELLS BROWSER */}
                {(() => {
                    // Determine which spell types this class uses
                    if (!character.characterClass || !derivedStats.level) return null;
                    
                    const classKey = character.characterClass.toLowerCase();
                    const classData = charClasses[classKey];
                    if (!classData?.levelProg) return null;
                    
                    const levelData = classData.levelProg[derivedStats.level];
                    if (!levelData) return null;
                    
                    // Check for wizard/mage spells
                    const hasWizardSpells = levelData.mageSpells && 
                        Array.isArray(levelData.mageSpells) && 
                        levelData.mageSpells.some(s => s > 0);
                    
                    // Check for priest/cleric/druid spells - handle all priest-type property names
                    const priestSpellArray = levelData.priestSpells || levelData.clericSpells || levelData.druidSpells;
                    const hasPriestSpells = priestSpellArray && 
                        Array.isArray(priestSpellArray) && 
                        priestSpellArray.some(s => s > 0);
                    
                    return (
                        <div className="column-span">
                            {hasWizardSpells && (
                                <SpellDisplay 
                                    characterClass={character.characterClass}
                                    characterLevel={derivedStats.level}
                                    spellType="wizard"
                                    intSpellLevel={derivedStats.intSpellLevel}
                                    intMaxSpellsPerLevel={derivedStats.intMaxSpellsPerLevel}
                                />
                            )}
                            {hasPriestSpells && (
                                <SpellDisplay 
                                    characterClass={character.characterClass}
                                    characterLevel={derivedStats.level}
                                    spellType="priest"
                                    wisBonusSpells={derivedStats.wisBonusSpells}
                                />
                            )}
                        </div>
                    );
                })()}
            </div>
        </>
    )
}