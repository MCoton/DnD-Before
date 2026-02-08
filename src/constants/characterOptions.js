/**
 * Character option constants derived from data files.
 * These are computed once and reused throughout the application.
 */

import armourTable from '../data/equipment/armour_class.json';
import raceMods from '../data/races/race_mods.json';
import charClass from '../data/classes/character_classes.json';

// Object.keys() pulls all the base armour names directly for the dropdown
export const ARMOUR_OPTIONS = Object.keys(armourTable.armourType);

// Same for races held in raceMods
export const RACE_OPTIONS = Object.keys(raceMods);

// And again for class
export const CLASS_OPTIONS = Object.keys(charClass);
