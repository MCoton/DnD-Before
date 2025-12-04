import React, { useState, useMemo } from "react";
import './App.css'

// Rules Engine Imports
import strTable from './data/strength_table.json';
import dexTable from "./data/dexterity_table.json";
import conTable from "./data/constitution_table.json";
import intTable from "./data/intelligence_table.json";
import wisTable from "./data/wisdom_table.json";
import chaTable from "./data/charisma_table.json";

// Initial data model for a new character
const initialCharacterState = {
    // Identity
    name: "New Hero",
    class: "",
    race: "",
    gender: "",

    // CORE stats (Raw user input)
    scores: {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10
    },

    // Progressional stats
    level: 1,
    xp: 0,
    hp: {
        base: 0, // The manually rolled numbers
        bonus: 0, // Will be the "con" modifier
        current: 0, // HP minus any damage
        hpMax: 0 // Maximum HP if uninjured, lus and "con" bonus
    },

    // Gear stats
    ac: {
        base: 10,
        armourType: "",
        shield: false
    }
}

export default function CharacterSheet() {
    // Use the useState hook to manage the character's data.
    // 'character' is the current state object.
    // 'setCharacter' is the function we call to change the state.
    const [character, setCharacter] = useState(initialCharacterState);

    // START: Rules engine (derived stats)
    const derivedStats = useMemo(() => {
        //This function runs to calculate all derived stats

        const results = {}; // Object to hold the calculated stats

        // Pulling the raw scores for clean code accesss
        const str = character.scores.str;
        const dex = character.scores.dex;
        const con = character.scores.con;
        const int = character.scores.int;
        const wis = character.scores.wis;
        const cha = character.scores.cha;

        // STRENGTH items
        // 1. Instantaneous lookup using the STR score as the key
        const strMods = strTable.str[str] || {}; //Using {} for safe access in ase score is missing

        // 2. Store the result for use in the display
        results.strHitProb = strMods.hitProb;
        results.strDamAdj = strMods.damageAdj;
        results.strWeightAllow = strMods.weightAllow;
        results.strMaxPress = strMods.maxPress;
        results.strOpenDoors = strMods.openDoors;
        results.strBendBars = strMods.bendBars;
        
        // and so-on for the other stats
        // DEXTERITY items
        const dexMods = dexTable[dex] || {};

        results.dexReactionAdj = dexMods.reactionAdj;
        results.dexMissileAdj = dexMods.missileAdj;
        results.dexDefensiveAdj = dexMods.defensiveAdj;

        // CONSTITUTION items
        const conMods = conTable[con] || {};

        results.conHitPointAdj = conMods.hitPointAdj;
        results.conSystemShock = conMods.systemShock;
        results.conResSurvival = conMods.resSurvival;
        results.conPoisonSave = conMods.poisonSave;
        results.conRegeneration = conMods.regeneration;
        results.conSaveBonus = conMods.saveBonus;

        // INTELLIGENCE items
        const intMods = intTable[int] || {};

        results.intLanguages = intMods.languages;
        results.intSpellLevel = intMods.spellLevel;
        results.intChanceLearnSpell = intMods.chanceLearnSpell;
        results.intMaxSpellsPerLevel = intMods.maxSpellsPerLevel;
        results.intIllusionImmunity = intMods.illusionImmunity;

        // WISDOM items
        const wisMods = wisTable[wis] || [];

        results.wisMagicalDefenseAdj = wisMods.magicalDefenseAdj;
        results.wisBonusSpells = wisMods.bonusSpells;
        results.wisSpellFailureChance = wisMods.spellFailureChance;
        results.wisSpellImmunity = wisMods.spellImmunity;

        return results;
    }, [character.scores]);
    //We'll come back to the 'return' statement later
    return(
      <>
        <div>
            {/* For now, a placeholder */}
            <h1>{character.name}</h1>
            <p>Strength: {character.scores.str}</p>
            <h2 className="text-xl font-semibold">Strength Derived Stats</h2>
            <ul className="ml-4 list-disc">
                <li>Hit Probability: **{derivedStats.strHitProb}**</li>
                <li>Damage Adjustment: **{derivedStats.strDamAdj}**</li>
                <li>Max Press (Lift): **{derivedStats.strMaxPress}** lbs</li>
                <li>Bend Bars/Lift Gates Chance: **{derivedStats.strBendBars}**%</li>
            </ul>
        </div>
      </>
    )
}

