import React, { useState, useMemo } from 'react';
import wizardSpells from '../data/spellLists/wizard_spells.json';
import charClasses from '../data/classes/character_classes.json';

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

    // Check if character is a wizard/mage and get their spell slots
    const mageSpells = useMemo(() => {
        if (!characterClass || !characterLevel) return null;
        
        const classKey = characterClass.toLowerCase();
        const classData = charClasses[classKey];
        
        if (!classData || !classData.levelProg) return null;
        
        const levelData = classData.levelProg[characterLevel];
        if (!levelData || !levelData.mageSpells) return null;
        
        return levelData.mageSpells; // Array of 9 elements (spell levels 1-9)
    }, [characterClass, characterLevel]);

    // Get available spell levels based on wizard level and Intelligence
    const availableSpellLevels = useMemo(() => {
        if (!mageSpells || intSpellLevel === undefined || intSpellLevel === null || intSpellLevel === 0) {
            return [];
        }
        
        const levels = [];
        // mageSpells array: index 0 = 1st level, index 1 = 2nd level, etc.
        for (let i = 0; i < mageSpells.length; i++) {
            const spellLevel = i + 1; // Convert index to spell level (1-9)
            const hasSlots = mageSpells[i] > 0; // Wizard has slots for this level
            const withinIntLimit = spellLevel <= intSpellLevel; // Within Intelligence limit
            
            if (hasSlots && withinIntLimit) {
                levels.push(spellLevel);
            }
        }
        
        return levels;
    }, [mageSpells, intSpellLevel]);

    // Get all available spells grouped by level (NO filtering by maxSpellsPerLevel)
    const allSpellsByLevel = useMemo(() => {
        if (availableSpellLevels.length === 0) return {};
        
        const spellsByLevel = {};
        
        availableSpellLevels.forEach(level => {
            const spells = wizardSpells
                .filter(spell => spell["Spell Level"] === level)
                .sort((a, b) => a.Name.localeCompare(b.Name));
            
            spellsByLevel[level] = spells;
        });
        
        return spellsByLevel;
    }, [availableSpellLevels]);

    // Get spell book spells grouped by level
    const spellBookByLevel = useMemo(() => {
        const bookByLevel = {};
        spellBook.forEach(spell => {
            const level = spell["Spell Level"];
            if (!bookByLevel[level]) {
                bookByLevel[level] = [];
            }
            bookByLevel[level].push(spell);
        });
        // Sort each level's spells
        Object.keys(bookByLevel).forEach(level => {
            bookByLevel[level].sort((a, b) => a.Name.localeCompare(b.Name));
        });
        return bookByLevel;
    }, [spellBook]);

    // Count spell book spells per level
    const spellBookCountByLevel = useMemo(() => {
        const countByLevel = {};
        spellBook.forEach(spell => {
            const level = spell["Spell Level"];
            countByLevel[level] = (countByLevel[level] || 0) + 1;
        });
        return countByLevel;
    }, [spellBook]);

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

    // Handle modal backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleCloseModal();
        }
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
                                
                                <label className="spell-book-add-label">
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const spell = allSpells.find(s => s.Name === e.target.value);
                                                if (spell) handleAddToSpellBook(spell);
                                                e.target.value = '';
                                            }
                                        }}
                                        className="spell-book-add-dropdown"
                                        disabled={isAtBookLimit}
                                    >
                                        <option value="">-- Add spell to book --</option>
                                        {allSpells.map((spell, index) => {
                                            const inBook = isInSpellBook(spell);
                                            return (
                                                <option
                                                    key={`add-${spell.Name}-${index}`}
                                                    value={spell.Name}
                                                    disabled={inBook || isAtBookLimit}
                                                >
                                                    {spell.Name} {inBook ? '(in book)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </label>

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
                                    
                                    return (
                                        <label key={`mem-dropdown-${level}-${index}`} className="memorized-dropdown-label">
                                            <select
                                                value={currentSpellName}
                                                onChange={(e) => handleMemorizationChange(level, e.target.value, index)}
                                                className={`memorized-dropdown ${isAtLimit && !currentSpellName ? 'at-limit' : ''}`}
                                                disabled={isAtLimit && !currentSpellName}
                                            >
                                                <option value="">-- Select from book --</option>
                                                {bookSpells.map((spell, spellIndex) => {
                                                    const memorized = isMemorized(spell);
                                                    // Disable if: already memorized in another slot, OR level is at limit and this dropdown is empty
                                                    const disabled = (memorized && currentSpellName !== spell.Name) || (isAtLimit && !currentSpellName);
                                                    
                                                    return (
                                                        <option
                                                            key={`mem-${spell.Name}-${spellIndex}`}
                                                            value={spell.Name}
                                                            disabled={disabled}
                                                        >
                                                            {spell.Name} {memorized && currentSpellName !== spell.Name ? '(memorized)' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </label>
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
            {modalSpell && (
                <div className="spell-modal-backdrop" onClick={handleBackdropClick}>
                    <div className="spell-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="spell-modal-close"
                            onClick={handleCloseModal}
                            aria-label="Close modal"
                        >
                            ×
                        </button>
                        
                        <h2 className="spell-modal-name">{modalSpell.Name}</h2>
                        
                        <div className="spell-modal-info-grid">
                            <div className="spell-modal-info-item">
                                <span className="spell-modal-info-label">Level:</span>
                                <span className="spell-modal-info-value">{formatOrdinal(modalSpell["Spell Level"])}</span>
                            </div>
                            
                            <div className="spell-modal-info-item">
                                <span className="spell-modal-info-label">School:</span>
                                <span className="spell-modal-info-value">{modalSpell.School}</span>
                            </div>
                            
                            <div className="spell-modal-info-item">
                                <span className="spell-modal-info-label">Range:</span>
                                <span className="spell-modal-info-value">{modalSpell.Range}</span>
                            </div>
                            
                            {modalSpell.Damage && (
                                <div className="spell-modal-info-item">
                                    <span className="spell-modal-info-label">Damage:</span>
                                    <span className="spell-modal-info-value">{modalSpell.Damage}</span>
                                </div>
                            )}
                            
                            <div className="spell-modal-info-item">
                                <span className="spell-modal-info-label">Duration:</span>
                                <span className="spell-modal-info-value">{modalSpell.Duration}</span>
                            </div>
                            
                            <div className="spell-modal-info-item">
                                <span className="spell-modal-info-label">Area of Effect:</span>
                                <span className="spell-modal-info-value">{modalSpell.AOE}</span>
                            </div>
                            
                            <div className="spell-modal-info-item">
                                <span className="spell-modal-info-label">Casting Time:</span>
                                <span className="spell-modal-info-value">{modalSpell["Casting Time"]}</span>
                            </div>
                            
                            <div className="spell-modal-info-item">
                                <span className="spell-modal-info-label">Saving Throw:</span>
                                <span className="spell-modal-info-value">{modalSpell.Save}</span>
                            </div>
                            
                            <div className="spell-modal-info-item spell-modal-info-full">
                                <span className="spell-modal-info-label">Components:</span>
                                <span className="spell-modal-info-value">{modalSpell.Components.join(', ')}</span>
                            </div>
                        </div>

                        <div className="spell-modal-description">
                            <h4 className="spell-modal-description-title">Description:</h4>
                            <p className="spell-modal-description-text">{modalSpell.Description}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
