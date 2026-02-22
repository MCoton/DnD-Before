import React, { useState, useMemo } from 'react';
import wizardSpells from '../data/spellLists/wizard_spells.json';
import charClasses from '../data/classes/character_classes.json';
import SpellModal from './SpellModal';
import SpellDropdown from './SpellDropdown';

/**
 * Displays wizard spells with a Spell Book for known spells and slots for memorized spells
 * 
 * @param {object} props
 * @param {string} props.characterClass - The character's class
 * @param {number} props.characterLevel - The character's level
 * @param {number} props.intSpellLevel - Maximum spell level from Intelligence (0-9)
 * @param {number|string} props.intMaxSpellsPerLevel - Maximum known spells per level from Intelligence (0-18 or "all")
 */
export default function WizardSpellsDisplay({ 
    characterClass, 
    characterLevel, 
    intSpellLevel, 
    intMaxSpellsPerLevel 
}) {
    const [spellBook, setSpellBook] = useState([]); // Array of known spell objects
    const [memorizedSpells, setMemorizedSpells] = useState([]); // Array of memorized spell objects
    const [modalSpell, setModalSpell] = useState(null); // Currently displayed spell in modal

    // Combined calculation: Get mage spells, available levels, and spells by level in one pass
    // This reduces re-renders and improves performance with large spell lists
    const spellData = useMemo(() => {
        // Step 1: Get mage spells from class data
        if (!characterClass || !characterLevel) {
            return { mageSpells: null, availableSpellLevels: [], allSpellsByLevel: {} };
        }
        
        const classKey = characterClass.toLowerCase();
        const classData = charClasses[classKey];
        
        if (!classData || !classData.levelProg) {
            return { mageSpells: null, availableSpellLevels: [], allSpellsByLevel: {} };
        }
        
        const levelData = classData.levelProg[characterLevel];
        if (!levelData || !levelData.mageSpells) {
            return { mageSpells: null, availableSpellLevels: [], allSpellsByLevel: {} };
        }
        
        const mageSpells = levelData.mageSpells; // Array of 9 elements (spell levels 1-9)
        
        // Step 2: Calculate available spell levels and spells by level in one pass
        if (intSpellLevel === undefined || intSpellLevel === null || intSpellLevel === 0) {
            return { mageSpells, availableSpellLevels: [], allSpellsByLevel: {} };
        }
        
        const availableSpellLevels = [];
        const allSpellsByLevel = {};
        
        // mageSpells array: index 0 = 1st level, index 1 = 2nd level, etc.
        for (let i = 0; i < mageSpells.length; i++) {
            const spellLevel = i + 1; // Convert index to spell level (1-9)
            const hasSlots = mageSpells[i] > 0; // Wizard has slots for this level
            const withinIntLimit = spellLevel <= intSpellLevel; // Within Intelligence limit
            
            if (hasSlots && withinIntLimit) {
                availableSpellLevels.push(spellLevel);
                
                // Filter and sort spells for this level
                const spells = wizardSpells
                    .filter(spell => spell["Spell Level"] === spellLevel)
                    .sort((a, b) => a.Name.localeCompare(b.Name));
                
                allSpellsByLevel[spellLevel] = spells;
            }
        }
        
        return { mageSpells, availableSpellLevels, allSpellsByLevel };
    }, [characterClass, characterLevel, intSpellLevel]);
    
    // Destructure for easier access
    const { mageSpells, availableSpellLevels, allSpellsByLevel } = spellData;

    // Combined calculation: Get spell book grouped by level and counts in one pass
    const spellBookData = useMemo(() => {
        const bookByLevel = {};
        const countByLevel = {};
        
        spellBook.forEach(spell => {
            const level = spell["Spell Level"];
            
            // Group by level
            if (!bookByLevel[level]) {
                bookByLevel[level] = [];
            }
            bookByLevel[level].push(spell);
            
            // Count by level
            countByLevel[level] = (countByLevel[level] || 0) + 1;
        });
        
        // Sort each level's spells
        Object.keys(bookByLevel).forEach(level => {
            bookByLevel[level].sort((a, b) => a.Name.localeCompare(b.Name));
        });
        
        return { spellBookByLevel: bookByLevel, spellBookCountByLevel: countByLevel };
    }, [spellBook]);
    
    // Destructure for easier access
    const { spellBookByLevel, spellBookCountByLevel } = spellBookData;

    // Count memorized spells per level
    const memorizedSpellsByLevel = useMemo(() => {
        const countByLevel = {};
        memorizedSpells.forEach(spell => {
            const level = spell["Spell Level"];
            countByLevel[level] = (countByLevel[level] || 0) + 1;
        });
        return countByLevel;
    }, [memorizedSpells]);

    // Check if spell book level has reached its limit
    const isSpellBookAtLimit = (level) => {
        if (intMaxSpellsPerLevel === 'all') return false;
        if (!intMaxSpellsPerLevel || typeof intMaxSpellsPerLevel !== 'number' || intMaxSpellsPerLevel === 0) {
            return false;
        }
        const currentCount = spellBookCountByLevel[level] || 0;
        return currentCount >= intMaxSpellsPerLevel;
    };

    // Check if a level has reached its memorization slot limit
    const isMemorizationAtLimit = (level) => {
        if (!mageSpells) return false;
        const slotsAvailable = mageSpells[level - 1] || 0;
        const memorizedCount = memorizedSpellsByLevel[level] || 0;
        return memorizedCount >= slotsAvailable;
    };

    // Check if a spell is in the spell book
    const isInSpellBook = (spell) => {
        return spellBook.some(s => 
            s.Name === spell.Name && s["Spell Level"] === spell["Spell Level"]
        );
    };

    // Check if a spell is memorized
    const isMemorized = (spell) => {
        return memorizedSpells.some(s => 
            s.Name === spell.Name && s["Spell Level"] === spell["Spell Level"]
        );
    };

    // Handle adding spell to spell book
    const handleAddToSpellBook = (spell) => {
        if (isInSpellBook(spell)) return;
        if (isSpellBookAtLimit(spell["Spell Level"])) return;
        setSpellBook([...spellBook, spell]);
    };

    // Handle removing spell from spell book
    const handleRemoveFromSpellBook = (spellToRemove) => {
        // Also remove from memorized spells if it's memorized
        const newSpellBook = spellBook.filter(spell => 
            !(spell.Name === spellToRemove.Name && spell["Spell Level"] === spellToRemove["Spell Level"])
        );
        setSpellBook(newSpellBook);
        
        // Remove from memorized if it was memorized
        setMemorizedSpells(memorizedSpells.filter(spell => 
            !(spell.Name === spellToRemove.Name && spell["Spell Level"] === spellToRemove["Spell Level"])
        ));
    };

    // Handle dropdown selection for memorization
    const handleMemorizationChange = (level, spellName, dropdownIndex) => {
        if (!spellName || spellName === '') {
            // Empty selection - remove the spell at this dropdown index if it exists
            const spellsForLevel = memorizedSpells.filter(s => s["Spell Level"] === level);
            if (dropdownIndex < spellsForLevel.length) {
                const spellToRemove = spellsForLevel[dropdownIndex];
                setMemorizedSpells(memorizedSpells.filter(spell => 
                    !(spell.Name === spellToRemove.Name && spell["Spell Level"] === spellToRemove["Spell Level"])
                ));
            }
            return;
        }

        const spells = spellBookByLevel[level] || [];
        const selectedSpell = spells.find(s => s.Name === spellName);
        
        if (!selectedSpell) return;

        // Check if level is at limit and this is a new selection
        if (isMemorizationAtLimit(level) && !isMemorized(selectedSpell)) {
            return; // Level is at limit, cannot memorize more
        }

        // If replacing an existing selection at this dropdown index
        const spellsForLevel = memorizedSpells.filter(s => s["Spell Level"] === level);
        if (dropdownIndex < spellsForLevel.length) {
            const spellToReplace = spellsForLevel[dropdownIndex];
            setMemorizedSpells(memorizedSpells.map(spell => 
                (spell.Name === spellToReplace.Name && spell["Spell Level"] === spellToReplace["Spell Level"])
                    ? selectedSpell
                    : spell
            ));
        } else {
            // Adding a new memorization
            if (!isMemorized(selectedSpell)) {
                setMemorizedSpells([...memorizedSpells, selectedSpell]);
            }
        }
    };

    // Handle spell name click - open modal
    const handleSpellClick = (spell) => {
        setModalSpell(spell);
    };

    // Handle modal close
    const handleCloseModal = () => {
        setModalSpell(null);
    };

    // Format ordinal numbers (1st, 2nd, 3rd, etc.)
    const formatOrdinal = (num) => {
        if (num === 1) return '1st';
        if (num === 2) return '2nd';
        if (num === 3) return '3rd';
        return `${num}th`;
    };

    // Don't show component if not a wizard or no spell slots
    if (!mageSpells || availableSpellLevels.length === 0) {
        return null;
    }

    return (
        <>
            <div className="wizard-spells-block area-box details-box">
                <h2 className="title">Wizard Spells</h2>
                <hr className="style14"></hr>

                {/* Show Intelligence-based limits */}
                <div className="spell-limits-info">
                    <p className="spell-limits-text">
                        <strong>Intelligence Limits:</strong> Max spell level: {intSpellLevel > 0 ? formatOrdinal(intSpellLevel) : 'None'} | 
                        Max known spells per level: {intMaxSpellsPerLevel === 'all' ? 'All' : intMaxSpellsPerLevel || 0}
                    </p>
                </div>

                {/* Spell Book Section */}
                <div className="spell-book-section">
                    <h3 className="spell-book-heading">Spell Book (Known Spells)</h3>
                    {availableSpellLevels.map(level => {
                        const allSpells = allSpellsByLevel[level] || [];
                        const bookSpells = spellBookByLevel[level] || [];
                        const bookCount = spellBookCountByLevel[level] || 0;
                        const maxKnown = intMaxSpellsPerLevel === 'all' ? Infinity : (intMaxSpellsPerLevel || 0);
                        const isAtBookLimit = isSpellBookAtLimit(level);

                        return (
                            <div key={`book-${level}`} className="spell-book-level-section">
                                <div className="spell-book-level-header">
                                    <span className="spell-book-level-heading">
                                        {formatOrdinal(level)} Level
                                        <span className="spell-book-count-badge">
                                            ({bookCount}{maxKnown !== Infinity ? `/${maxKnown}` : ''} known)
                                        </span>
                                    </span>
                                </div>
                                
                                <div className="input-row spell-book-add-label">
                                    <span className="input-label">Add:</span>
                                    <SpellDropdown
                                        value=""
                                        onChange={(val) => {
                                            if (val) {
                                                const spell = allSpells.find(s => s.Name === val);
                                                if (spell) handleAddToSpellBook(spell);
                                            }
                                        }}
                                        options={[
                                            { value: '', label: '-- Add spell to book --' },
                                            ...allSpells.map((spell) => ({
                                                value: spell.Name,
                                                label: spell.Name + (isInSpellBook(spell) ? ' (in book)' : ''),
                                                disabled: isInSpellBook(spell) || isAtBookLimit,
                                            })),
                                        ]}
                                        placeholder="-- Add spell to book --"
                                        className="spell-book-add-dropdown"
                                        disabled={isAtBookLimit}
                                    />
                                </div>

                                {bookSpells.length > 0 && (
                                    <ul className="spell-book-list">
                                        {bookSpells.map((spell, index) => (
                                            <li key={`book-${spell.Name}-${index}`} className="spell-book-item">
                                                <button
                                                    type="button"
                                                    className="spell-book-link"
                                                    onClick={() => handleSpellClick(spell)}
                                                >
                                                    {spell.Name}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="spell-book-remove-btn"
                                                    onClick={() => handleRemoveFromSpellBook(spell)}
                                                    title="Remove from spell book"
                                                >
                                                    ×
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {isAtBookLimit && (
                                    <p className="spell-book-limit-message">
                                        Book limit reached ({maxKnown} spell{maxKnown > 1 ? 's' : ''}). Remove a spell to add another.
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Memorized Spells Section */}
                <div className="memorized-spells-section">
                    <hr className="style14"></hr>
                    <h3 className="memorized-spells-heading">Memorized Spells (Spell Slots)</h3>
                    {availableSpellLevels.map(level => {
                        const bookSpells = spellBookByLevel[level] || [];
                        if (bookSpells.length === 0) return null;

                        const slotsAvailable = mageSpells[level - 1] || 0;
                        const memorizedCount = memorizedSpellsByLevel[level] || 0;
                        const isAtLimit = isMemorizationAtLimit(level);
                        const remainingSlots = slotsAvailable - memorizedCount;
                        const memorizedSpellsForLevel = memorizedSpells.filter(s => s["Spell Level"] === level);

                        return (
                            <div key={`mem-${level}`} className="memorized-level-section">
                                <div className="memorized-level-header">
                                    <span className="memorized-level-heading">
                                        {formatOrdinal(level)} Level Spells
                                        <span className="memorized-slots-badge">
                                            ({memorizedCount}/{slotsAvailable} memorized)
                                        </span>
                                    </span>
                                </div>
                                
                                {/* Create one dropdown per available slot */}
                                {Array.from({ length: slotsAvailable }, (_, index) => {
                                    const currentSelection = memorizedSpellsForLevel[index];
                                    const currentSpellName = currentSelection ? currentSelection.Name : '';
                                    const memOptions = bookSpells.map((spell) => {
                                        const memorized = isMemorized(spell);
                                        return {
                                            value: spell.Name,
                                            label: spell.Name + (memorized && currentSpellName !== spell.Name ? ' (memorized)' : ''),
                                            disabled: (memorized && currentSpellName !== spell.Name) || (isAtLimit && !currentSpellName),
                                        };
                                    });
                                    const options = [{ value: '', label: '-- Select from book --' }, ...memOptions];
                                    return (
                                        <div key={`mem-dropdown-${level}-${index}`} className="input-row memorized-dropdown-label">
                                            <span className="input-label">Slot {index + 1}:</span>
                                            <SpellDropdown
                                                value={currentSpellName}
                                                onChange={(val) => handleMemorizationChange(level, val, index)}
                                                options={options}
                                                placeholder="-- Select from book --"
                                                className={`memorized-dropdown ${isAtLimit && !currentSpellName ? 'at-limit' : ''}`}
                                                disabled={isAtLimit && !currentSpellName}
                                            />
                                        </div>
                                    );
                                })}
                                
                                {isAtLimit && (
                                    <p className="memorized-limit-message">
                                        All slots filled ({slotsAvailable} slot{slotsAvailable > 1 ? 's' : ''}). Remove a spell to memorize another.
                                    </p>
                                )}
                                
                                {!isAtLimit && remainingSlots > 0 && (
                                    <p className="memorized-remaining-message">
                                        {remainingSlots} slot{remainingSlots > 1 ? 's' : ''} remaining
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Spell Details Modal */}
            <SpellModal spell={modalSpell} onClose={handleCloseModal} />
        </>
    );
}
