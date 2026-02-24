import React, { useMemo, useState } from 'react';
import { THIEF_SKILL_ORDER, getThiefPointRules } from '../constants/thief.js';

/**
 * Converts camelCase skill key to a display label (e.g. "findRemoveTraps" -> "Find/Remove Traps").
 */
function skillKeyToLabel(key) {
    if (!key || typeof key !== 'string') return '';
    const withSpaces = key.replace(/([A-Z])/g, ' $1').trim();
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase();
}

/**
 * Displays thief skill percentages with base, allocated points, and adjustments from race, armour, and dexterity.
 * Allocated column is editable; total skill points available is shown.
 *
 * @param {object} props
 * @param {object} props.thiefSkills - From derivedStats.thiefSkills
 * @param {number} [props.characterLevel] - Thief level (1–20)
 * @param {object} props.thiefSkillPoints - { pickPockets: n, ... } total points allocated per skill
 * @param {function} props.onThiefSkillPoints - (skill, value) => void
 */
export default function ThiefAbilitiesDisplay({
    thiefSkills,
    characterLevel = 1,
    thiefSkillPoints = {},
    onThiefSkillPoints
}) {
    // All hooks must run unconditionally at the top (Rules of Hooks)
    const { startingSkillPoints, skillPointsPerLevel } = useMemo(getThiefPointRules, []);
    const totalPointsSpent = useMemo(() => {
        return THIEF_SKILL_ORDER.reduce((sum, skill) => sum + (typeof thiefSkillPoints[skill] === 'number' ? thiefSkillPoints[skill] : 0), 0);
    }, [thiefSkillPoints]);
    const [allocationModalOpen, setAllocationModalOpen] = useState(false);

    if (!thiefSkills || !thiefSkills.skills) {
        return null;
    }

    const { skills, backstabMulti } = thiefSkills;
    const totalPointsAvailable = startingSkillPoints + (characterLevel - 1) * skillPointsPerLevel;
    const hasUnallocatedPoints = totalPointsSpent < totalPointsAvailable;

    const maxPerSkillFromRule = Math.floor(totalPointsAvailable * 0.5);

    const handleAllocatedChange = (skill, e) => {
        const raw = e.target.value;
        const requested = raw === '' ? 0 : parseInt(raw, 10) || 0;
        const currentSkillVal = typeof thiefSkillPoints[skill] === 'number' ? thiefSkillPoints[skill] : 0;
        const otherSkillsTotal = totalPointsSpent - currentSkillVal;
        const maxFromTotal = Math.max(0, totalPointsAvailable - otherSkillsTotal);
        const maxForSkill = Math.min(maxFromTotal, maxPerSkillFromRule);
        const num = Math.max(0, Math.min(maxForSkill, requested));
        onThiefSkillPoints(skill, num);
    };

    return (
        <div className="thief-abilities-block area-box details-box">
            <h3 className="title">Thief Skills</h3>
            <hr className="style14" />
            <div className="thief-backstab">
                <strong>Backstab multiplier:</strong> ×{backstabMulti} 
            </div>
            <div className="thief-points-total">
                <strong>Skill points:</strong>{' '}
                <span className={totalPointsSpent <= totalPointsAvailable ? 'thief-points-ok' : 'thief-points-warn'}>
                    {totalPointsSpent} / {totalPointsAvailable}
                </span>
                {hasUnallocatedPoints && (
                    <span className="thief-points-unallocated"> ({totalPointsAvailable - totalPointsSpent} unallocated)</span>
                )}
            </div>
            <div className="thief-allocation-actions">
                <button
                    type="button"
                    className="thief-allocation-btn"
                    disabled={!hasUnallocatedPoints}
                    onClick={() => setAllocationModalOpen(true)}
                >
                    Allocate skill points
                </button>
            </div>


            <div className="table-wrap">
                <table className="thief-skills-table">
                    <thead>
                        <tr>
                            {THIEF_SKILL_ORDER.map((key) => (
                                <th key={key}>{skillKeyToLabel(key)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {THIEF_SKILL_ORDER.map((key) => {
                                const row = skills[key];
                                if (!row) return <td key={key}>—</td>;
                                return (
                                    <td key={key}>{row.total}%</td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>            {allocationModalOpen && (
                <div
                    className="thief-allocation-modal-backdrop"
                    onClick={() => setAllocationModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="thief-allocation-modal-title"
                >
                    <div className="thief-allocation-modal" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="thief-allocation-modal-close"
                            onClick={() => setAllocationModalOpen(false)}
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <h2 id="thief-allocation-modal-title" className="thief-allocation-modal-title">
                            Thief skill point allocation
                        </h2>
                        <p className="thief-allocation-modal-total">
                            Points: <strong>{totalPointsSpent} / {totalPointsAvailable}</strong>
                            {hasUnallocatedPoints && (
                                <span className="thief-points-unallocated"> — {totalPointsAvailable - totalPointsSpent} to allocate (max {maxPerSkillFromRule} per skill)</span>
                            )}
                        </p>
                        <div className="thief-allocation-modal-inputs">
                            {THIEF_SKILL_ORDER.map((key) => {
                                const allocated = typeof thiefSkillPoints[key] === 'number' ? thiefSkillPoints[key] : 0;
                                const otherTotal = totalPointsSpent - allocated;
                                const maxFromTotal = Math.max(0, totalPointsAvailable - otherTotal);
                                const maxForSkill = Math.min(maxFromTotal, maxPerSkillFromRule);
                                return (
                                    <label key={key} className="thief-allocation-modal-row input-row">
                                        <span className="thief-allocation-modal-label input-label">{skillKeyToLabel(key)}</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={maxForSkill}
                                            value={allocated}
                                            onChange={(e) => handleAllocatedChange(key, e)}
                                            className="number-input thief-allocated-input"
                                        />
                                    </label>
                                );
                            })}
                        </div>
                        <div className="thief-allocation-modal-actions">
                            <button
                                type="button"
                                className="thief-allocation-done-btn"
                                onClick={() => setAllocationModalOpen(false)}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
