import React from 'react';

/**
 * Displays spell immunities for high Wisdom characters.
 * Only shows if the character has immunities (WIS 19+).
 * 
 * @param {object} props
 * @param {string[]} props.immunities - Array of spell names
 * @param {number} props.wisdomScore - Character's Wisdom score
 */
export default function SpellImmunitiesDisplay({ immunities, wisdomScore }) {
    // Don't render anything if no immunities
    if (!immunities || immunities.length === 0) {
        return null;
    }

    return (
        <div className="area-box details-box">
            <h3 className="title">Spell Immunities</h3>
            <hr className="style13"></hr>
            <p className='immunity-text'> {...immunities.sort().join(', ')} </p>
        </div>
    );
}