import React, { useState, useMemo } from 'react';
import wizardSpells from '../data/spellLists/wizard_spells.json';
import priestSpells from '../data/spellLists/priest_spells.json';
import charClasses from '../data/classes/character_classes.json';
import SpellModal from './SpellModal';
import SpellDropdown from './SpellDropdown';

/**
 * Generic spell display component that handles both Wizard and Priest spells.
 * 
 * @param {object} props
 * @param {string} props.characterClass - The character's class
 * @param {number} props.characterLevel - The character's level
 * @param {string} props.spellType - 'wizard' or 'priest'
 * @param {number} props.intSpellLevel - Maximum spell level from Intelligence (wizards only, 0-9)
 * @param {number|string} props.intMaxSpellsPerLevel - Maximum known spells per level from Intelligence (wizards only, 0-18 or "all")
 * @param {number} props.wisBonusSpells - Bonus spells from Wisdom (priests only)
 */
export default function SpellDisplay({ 
    characterClass, 
    characterLevel, 
    spellType = 'wizard',
    intSpellLevel,
    intMaxSpellsPerLevel,
    wisBonusSpells
}) {
    const [spellBook, setSpellBook] = useState([]); // Array of known spell objects (wizards only)
    const [preparedSpells, setPreparedSpells] = useState([]); // Array of prepared/memorized spell objects
    const [modalSpell, setModalSpell] = useState(null); // Currently displayed spell in modal
    const [spellSearchQuery, setSpellSearchQuery] = useState(''); // Search query for priest spell reference

    // Determine which spell list and slot array to use
    const spellList = spellType === 'priest' ? priestSpells : wizardSpells;
    // For priest spells, check both priestSpells and clericSpells properties
    const slotArrayKey = spellType === 'priest' ? 'priestSpells' : 'mageSpells';
    const altSlotArrayKey = spellType === 'priest' ? 'clericSpells' : null;
    const maxSpellLevel = spellType === 'priest' ? 7 : 9;
    const isWizard = spellType === 'wizard';

    // Combined calculation: Get spell slots, available levels, and spells by level in one pass
    const spellData = useMemo(() => {
        if (!characterClass || !characterLevel) {
            return { spellSlots: null, availableSpellLevels: [], allSpellsByLevel: {} };
        }
        
        const classKey = characterClass.toLowerCase();
        const classData = charClasses[classKey];
        
        if (!classData || !classData.levelProg) {
            return { spellSlots: null, availableSpellLevels: [], allSpellsByLevel: {} };
        }
        
        const levelData = classData.levelProg[characterLevel];
        if (!levelData) {
            return { spellSlots: null, availableSpellLevels: [], allSpellsByLevel: {} };
        }
        
        // Get spell slots - for priest spells, try priestSpells, clericSpells, and druidSpells
        let spellSlots = levelData[slotArrayKey];
        if (!spellSlots && altSlotArrayKey) {
            spellSlots = levelData[altSlotArrayKey];
        }
        if (!spellSlots && levelData.druidSpells) {
            spellSlots = levelData.druidSpells;
        }
        
        // Ensure spellSlots is a valid array
        if (!spellSlots || !Array.isArray(spellSlots)) {
            return { spellSlots: null, effectiveSpellSlots: null, availableSpellLevels: [], allSpellsByLevel: {} };
        }
        
        // For priest spells, add Wisdom bonus spells to base slots
        // wisBonusSpells is an array: [bonus for 1st, bonus for 2nd, ..., bonus for 7th]
        // Only add bonus if base slot is greater than 0
        let effectiveSpellSlots = [...spellSlots]; // Copy base slots
        
        if (!isWizard && wisBonusSpells && Array.isArray(wisBonusSpells)) {
            // Add bonus spells to each level (up to 7th level for priests)
            // Only add bonus if the base slot for that level is greater than 0
            for (let i = 0; i < Math.min(effectiveSpellSlots.length, wisBonusSpells.length, 7); i++) {
                const base = effectiveSpellSlots[i] || 0;
                if (base > 0) {
                    const bonus = wisBonusSpells[i] || 0;
                    effectiveSpellSlots[i] = base + bonus;
                }
            }
        }
        
        // For wizards, calculate maximum knowable spell level
        // It's the minimum of Intelligence-based limit and character level-based limit
        let maxKnowableSpellLevel = maxSpellLevel;
        if (isWizard) {
            if (intSpellLevel === undefined || intSpellLevel === null || intSpellLevel === 0) {
                return { spellSlots, effectiveSpellSlots, availableSpellLevels: [], allSpellsByLevel: {} };
            }
            
            // Character level determines max spell level: roughly level/2, capped at 9
            // Level 1-2: 1st, 3-4: 2nd, 5-6: 3rd, 7-8: 4th, 9-10: 5th, 11-12: 6th, 13-14: 7th, 15-16: 8th, 17+: 9th
            const levelBasedMaxSpellLevel = Math.min(Math.ceil(characterLevel / 2), 9);
            
            // Use the minimum of Intelligence limit and character level limit
            maxKnowableSpellLevel = Math.min(intSpellLevel, levelBasedMaxSpellLevel);
        }
        
        const availableSpellLevels = [];
        const allSpellsByLevel = {};
        
        // Process each spell level using effective slots (base + bonus)
        for (let i = 0; i < effectiveSpellSlots.length && i < maxSpellLevel; i++) {
            const spellLevel = i + 1;
            const hasSlots = effectiveSpellSlots[i] > 0;
            
            // For wizards, check both Intelligence limit and character level limit (use minimum)
            const withinLimit = isWizard 
                ? spellLevel <= maxKnowableSpellLevel 
                : true; // Priests have no Intelligence-based limit
            
            if (hasSlots && withinLimit) {
                availableSpellLevels.push(spellLevel);
                
                // Filter and sort spells for this level
                const spells = spellList
                    .filter(spell => spell["Spell Level"] === spellLevel)
                    .sort((a, b) => a.Name.localeCompare(b.Name));
                
                allSpellsByLevel[spellLevel] = spells;
            }
        }
        
        return { spellSlots, effectiveSpellSlots, availableSpellLevels, allSpellsByLevel };
    }, [characterClass, characterLevel, spellType, intSpellLevel, slotArrayKey, altSlotArrayKey, maxSpellLevel, isWizard, spellList, wisBonusSpells]);
    
    const { spellSlots, effectiveSpellSlots, availableSpellLevels, allSpellsByLevel } = spellData;

    // Combined calculation: Get spell book grouped by level and counts in one pass (wizards only)
    const spellBookData = useMemo(() => {
        if (!isWizard) {
            return { spellBookByLevel: {}, spellBookCountByLevel: {} };
        }
        
        const bookByLevel = {};
        const countByLevel = {};
        
        spellBook.forEach(spell => {
            const level = spell["Spell Level"];
            
            if (!bookByLevel[level]) {
                bookByLevel[level] = [];
            }
            bookByLevel[level].push(spell);
            
            countByLevel[level] = (countByLevel[level] || 0) + 1;
        });
        
        Object.keys(bookByLevel).forEach(level => {
            bookByLevel[level].sort((a, b) => a.Name.localeCompare(b.Name));
        });
        
        return { spellBookByLevel: bookByLevel, spellBookCountByLevel: countByLevel };
    }, [spellBook, isWizard]);
    
    const { spellBookByLevel, spellBookCountByLevel } = spellBookData;

    // Count prepared spells per level
    const preparedSpellsByLevel = useMemo(() => {
        const countByLevel = {};
        preparedSpells.forEach(spell => {
            const level = spell["Spell Level"];
            countByLevel[level] = (countByLevel[level] || 0) + 1;
        });
        return countByLevel;
    }, [preparedSpells]);

    // Filter spells for priest reference search
    const filteredSpellsForReference = useMemo(() => {
        if (isWizard || !spellSearchQuery.trim()) {
            return allSpellsByLevel;
        }
        
        const query = spellSearchQuery.toLowerCase().trim();
        const filtered = {};
        
        Object.keys(allSpellsByLevel).forEach(level => {
            const spells = allSpellsByLevel[level] || [];
            const matching = spells.filter(spell => 
                spell.Name.toLowerCase().includes(query) ||
                (spell.School && spell.School.toLowerCase().includes(query))
            );
            if (matching.length > 0) {
                filtered[level] = matching;
            }
        });
        
        return filtered;
    }, [allSpellsByLevel, spellSearchQuery, isWizard]);

    // Check if spell book level has reached its limit (wizards only)
    const isSpellBookAtLimit = (level) => {
        if (!isWizard) return false;
        if (intMaxSpellsPerLevel === 'all') return false;
        if (!intMaxSpellsPerLevel || typeof intMaxSpellsPerLevel !== 'number' || intMaxSpellsPerLevel === 0) {
            return false;
        }
        const currentCount = spellBookCountByLevel[level] || 0;
        return currentCount >= intMaxSpellsPerLevel;
    };

    // Check if a level has reached its preparation slot limit
    // Use effective slots (base + bonus) for the limit check
    const isPreparationAtLimit = (level) => {
        if (!effectiveSpellSlots) return false;
        const slotsAvailable = effectiveSpellSlots[level - 1] || 0;
        const preparedCount = preparedSpellsByLevel[level] || 0;
        return preparedCount >= slotsAvailable;
    };

    // Check if a spell is in the spell book (wizards only)
    const isInSpellBook = (spell) => {
        if (!isWizard) return false;
        return spellBook.some(s => 
            s.Name === spell.Name && s["Spell Level"] === spell["Spell Level"]
        );
    };

    // Check if a spell is prepared
    const isPrepared = (spell) => {
        return preparedSpells.some(s => 
            s.Name === spell.Name && s["Spell Level"] === spell["Spell Level"]
        );
    };

    // Handle adding spell to spell book (wizards only)
    const handleAddToSpellBook = (spell) => {
        if (!isWizard) return;
        if (isInSpellBook(spell)) return;
        if (isSpellBookAtLimit(spell["Spell Level"])) return;
        setSpellBook([...spellBook, spell]);
    };

    // Handle removing spell from spell book (wizards only)
    const handleRemoveFromSpellBook = (spellToRemove) => {
        if (!isWizard) return;
        const newSpellBook = spellBook.filter(spell => 
            !(spell.Name === spellToRemove.Name && spell["Spell Level"] === spellToRemove["Spell Level"])
        );
        setSpellBook(newSpellBook);
        
        // Remove from prepared if it was prepared
        setPreparedSpells(preparedSpells.filter(spell => 
            !(spell.Name === spellToRemove.Name && spell["Spell Level"] === spellToRemove["Spell Level"])
        ));
    };

    // Handle dropdown selection for preparation
    const handlePreparationChange = (level, spellName, dropdownIndex) => {
        if (!spellName || spellName === '') {
            // Empty selection - remove the spell at this dropdown index if it exists
            const spellsForLevel = preparedSpells.filter(s => s["Spell Level"] === level);
            if (dropdownIndex < spellsForLevel.length) {
                const spellToRemove = spellsForLevel[dropdownIndex];
                setPreparedSpells(preparedSpells.filter(spell => 
                    !(spell.Name === spellToRemove.Name && spell["Spell Level"] === spellToRemove["Spell Level"])
                ));
            }
            return;
        }

        // For wizards, get spells from spell book; for priests, get from all available spells
        const availableSpells = isWizard 
            ? (spellBookByLevel[level] || [])
            : (allSpellsByLevel[level] || []);
        
        const selectedSpell = availableSpells.find(s => s.Name === spellName);
        
        if (!selectedSpell) return;

        // Check if level is at limit and this is a new selection
        if (isPreparationAtLimit(level) && !isPrepared(selectedSpell)) {
            return;
        }

        // If replacing an existing selection at this dropdown index
        const spellsForLevel = preparedSpells.filter(s => s["Spell Level"] === level);
        if (dropdownIndex < spellsForLevel.length) {
            const spellToReplace = spellsForLevel[dropdownIndex];
            setPreparedSpells(preparedSpells.map(spell => 
                (spell.Name === spellToReplace.Name && spell["Spell Level"] === spellToReplace["Spell Level"])
                    ? selectedSpell
                    : spell
            ));
        } else {
            // Adding a new preparation
            if (!isPrepared(selectedSpell)) {
                setPreparedSpells([...preparedSpells, selectedSpell]);
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

    // Don't show component if no spell slots
    if (!effectiveSpellSlots || availableSpellLevels.length === 0) {
        return null;
    }

    const spellTypeLabel = isWizard ? 'Wizard' : 'Priest';
    const spellTypeLabelLower = spellTypeLabel.toLowerCase();

    return (
        <>
            <div className={`${spellTypeLabelLower}-spells-block area-box details-box`}>
                <h2 className="title">{spellTypeLabel} Spells</h2>
                <hr className="style14"></hr>

                {/* Show limits */}
                {isWizard && (
                    <div className="spell-limits-info">
                        <p className="spell-limits-text">
                            <strong>Intelligence Limits:</strong> Max spell level: {intSpellLevel > 0 ? formatOrdinal(intSpellLevel) : 'None'} | 
                            Max known spells per level: {intMaxSpellsPerLevel === 'all' ? 'All' : intMaxSpellsPerLevel || 0}
                        </p>
                    </div>
                )}

                {wisBonusSpells && !isWizard && Array.isArray(wisBonusSpells) && (
                    <div className="spell-limits-info">
                        <p className="spell-limits-text">
                            <strong>Wisdom Bonus Spells:</strong> {
                                (() => {
                                    // Determine maximum spell level based on priestSpells array length
                                    const maxSpellLevelForClass = spellSlots ? spellSlots.length : 0;
                                    
                                    // Only show bonuses up to the maximum level the class can use
                                    return wisBonusSpells
                                        .slice(0, maxSpellLevelForClass)
                                        .map((bonus, index) => {
                                            if (bonus === 0) return null;
                                            return `${bonus} ${formatOrdinal(index + 1)} level`;
                                        })
                                        .filter(Boolean)
                                        .join(', ') || 'None';
                                })()
                            }
                        </p>
                    </div>
                )}

                {/* Prepared Spells Section */}
                <div className={`memorized-spells-section ${'with-reference'}`}>
                    <hr className="style14"></hr>
                    <div className="prepared-spells-layout">
                        <div className="prepared-spells-main">
                            <h3 className="memorized-spells-heading">
                                {isWizard ? 'Memorized Spells (Spell Slots)' : 'Prepared Spells (Spell Slots)'}
                            </h3>
                    {availableSpellLevels.map(level => {
                        // For wizards, use spell book; for priests, use all available spells
                        const availableSpells = isWizard 
                            ? (spellBookByLevel[level] || [])
                            : (allSpellsByLevel[level] || []);

                        // Use effective slots (base + bonus) for display and dropdowns
                        const slotsAvailable = effectiveSpellSlots[level - 1] || 0;
                        const baseSlots = spellSlots[level - 1] || 0;
                        const bonusSlots = slotsAvailable - baseSlots;
                        const preparedCount = preparedSpellsByLevel[level] || 0;
                        const isAtLimit = isPreparationAtLimit(level);
                        const remainingSlots = slotsAvailable - preparedCount;
                        const preparedSpellsForLevel = preparedSpells.filter(s => s["Spell Level"] === level);

                        return (
                            <div key={`prep-${level}`} className="memorized-level-section">
                                <div className="memorized-level-header">
                                    <span className="memorized-level-heading">
                                        {formatOrdinal(level)} Level Spells
                                        <span className="memorized-slots-badge">
                                            ({preparedCount}/{slotsAvailable} {isWizard ? 'memorized' : 'prepared'})
                                            {bonusSlots > 0 && !isWizard && (
                                                <span className="bonus-slots-indicator" title={`Base: ${baseSlots}, Bonus: +${bonusSlots}`}>
                                                    {' '}(+{bonusSlots} bonus)
                                                </span>
                                            )}
                                        </span>
                                    </span>
                                </div>
                                
                                {/* Create one dropdown per available slot */}
                                {Array.from({ length: slotsAvailable }, (_, index) => {
                                    const currentSelection = preparedSpellsForLevel[index];
                                    const currentSpellName = currentSelection ? currentSelection.Name : '';
                                    const placeholder = isWizard ? 'Select from book' : 'Select spell';
                                    const prepOptions = availableSpells.length > 0
                                        ? availableSpells.map((spell) => {
                                            const prepared = isPrepared(spell);
                                            return {
                                                value: spell.Name,
                                                label: spell.Name + (prepared && currentSpellName !== spell.Name ? ` (${isWizard ? 'memorized' : 'prepared'})` : ''),
                                                disabled: (prepared && currentSpellName !== spell.Name) || (isAtLimit && !currentSpellName),
                                            };
                                        })
                                        : [{ value: '', label: 'No spells in book for this level', disabled: true }];
                                    const options = [{ value: '', label: `-- ${placeholder} --` }, ...prepOptions];
                                    return (
                                        <div key={`prep-dropdown-${level}-${index}`} className="input-row memorized-dropdown-label">
                                            <span className="input-label">Slot {index + 1}:</span>
                                            <SpellDropdown
                                                value={currentSpellName}
                                                onChange={(val) => handlePreparationChange(level, val, index)}
                                                options={options}
                                                placeholder={`-- ${placeholder} --`}
                                                className={`memorized-dropdown ${isAtLimit && !currentSpellName ? 'at-limit' : ''}`}
                                                disabled={isAtLimit && !currentSpellName || (isWizard && availableSpells.length === 0)}
                                            />
                                        </div>
                                    );
                                })}
                                
                                {isAtLimit && (
                                    <p className="memorized-limit-message">
                                        All slots filled ({slotsAvailable} slot{slotsAvailable > 1 ? 's' : ''}). Remove a spell to {isWizard ? 'memorize' : 'prepare'} another.
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
                        
                        {/* Spell Book Section (Wizards only) - Right side */}
                        {isWizard && (
                            <div className="spell-book-sidebar">
                                <h3 className="spell-book-heading">Spell Book (Known Spells)</h3>
                                {availableSpellLevels.map(level => {
                                    const allSpells = allSpellsByLevel[level] || [];
                                    const bookSpells = spellBookByLevel[level] || [];
                                    const bookCount = spellBookCountByLevel[level] || 0;
                                    const maxKnown = intMaxSpellsPerLevel === 'all' ? Infinity : (intMaxSpellsPerLevel || 0);
                                    const isAtBookLimit = isSpellBookAtLimit(level);

                                    return (
                                        <div key={`book-${level}`} className="spell-book-level-compact">
                                            <div className="spell-book-level-header-compact">
                                                <span className="spell-book-level-heading-compact">
                                                    {formatOrdinal(level)}
                                                </span>
                                                <span className="spell-book-count-badge-compact">
                                                    ({bookCount}{maxKnown !== Infinity ? `/${maxKnown}` : ''})
                                                </span>
                                            </div>
                                            
                                            <div className="input-row spell-book-add-label-compact">
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
                                                        { value: '', label: '-- Add spell --' },
                                                        ...allSpells.map((spell) => ({
                                                            value: spell.Name,
                                                            label: spell.Name + (isInSpellBook(spell) ? ' (in book)' : ''),
                                                            disabled: isInSpellBook(spell) || isAtBookLimit,
                                                        })),
                                                    ]}
                                                    placeholder="-- Add spell --"
                                                    className="spell-book-add-dropdown-compact"
                                                    disabled={isAtBookLimit}
                                                />
                                            </div>

                                            {bookSpells.length > 0 && (
                                                <ul className="spell-book-list-compact">
                                                    {bookSpells.map((spell, index) => (
                                                        <li key={`book-${spell.Name}-${index}`} className="spell-book-item-compact">
                                                            <button
                                                                type="button"
                                                                className="spell-book-link-compact"
                                                                onClick={() => handleSpellClick(spell)}
                                                                title="Click to view details"
                                                            >
                                                                {spell.Name}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="spell-book-remove-btn-compact"
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
                                                <p className="spell-book-limit-message-compact">
                                                    Limit reached ({maxKnown})
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* Spell Reference Section (Priests only) - Searchable, compact, right side */}
                        {!isWizard && (
                            <div className="spell-reference-sidebar">
                                <h3 className="spell-reference-heading">Spell Reference</h3>
                                <div className="spell-reference-search-container">
                                    <label className="input-row">
                                        <span className="input-label">Search:</span>
                                        <input
                                            type="text"
                                            placeholder="Search by name or school..."
                                            value={spellSearchQuery}
                                            onChange={(e) => setSpellSearchQuery(e.target.value)}
                                            className="text-input spell-reference-search-input"
                                        />
                                    </label>
                                </div>
                                <div className="spell-reference-content">
                                    {availableSpellLevels.map(level => {
                                        const spells = filteredSpellsForReference[level] || [];
                                        if (spells.length === 0 && spellSearchQuery.trim()) return null;

                                        return (
                                            <div key={`ref-${level}`} className="spell-reference-level-compact">
                                                <div className="spell-reference-level-header-compact">
                                                    <span className="spell-reference-level-heading-compact">
                                                        {formatOrdinal(level)}
                                                    </span>
                                                    <span className="spell-reference-count-badge-compact">
                                                        ({spells.length})
                                                    </span>
                                                </div>
                                                
                                                {spells.length > 0 && (
                                                    <ul className="spell-reference-list-compact">
                                                        {spells.map((spell, index) => (
                                                            <li key={`ref-${spell.Name}-${index}`} className="spell-reference-item-compact">
                                                                <button
                                                                    type="button"
                                                                    className="spell-reference-link-compact"
                                                                    onClick={() => handleSpellClick(spell)}
                                                                    title="Click to view details"
                                                                >
                                                                    {spell.Name} {"(" + spell.School + ")"}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {spellSearchQuery.trim() && Object.keys(filteredSpellsForReference).length === 0 && (
                                        <p className="spell-reference-no-results">No spells found matching "{spellSearchQuery}"</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Spell Details Modal */}
            <SpellModal spell={modalSpell} onClose={handleCloseModal} />
        </>
    );
}
