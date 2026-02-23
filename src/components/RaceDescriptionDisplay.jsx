import React from 'react';
import raceDescriptions from '../data/races/race_descriptions.json';
import { capitaliseWords } from '../utils';

/**
 * Displays race description and racial effects (traits that alter dice rolls).
 *
 * @param {object} props
 * @param {string} props.race - The character's race (e.g. "human", "half-elf")
 */
export default function RaceDescriptionDisplay({ race }) {
    if (!race) {
        return (
            <div className="race-description-block area-box details-box">
                <h3 className="title">Race</h3>
                <hr className="style14" />
                <p className="no-data-message">Select a race to see description and racial effects.</p>
            </div>
        );
    }

    const raceKey = race.toLowerCase().trim();
    const raceData = raceDescriptions[raceKey];

    if (!raceData) {
        return (
            <div className="race-description-block area-box details-box">
                <h3 className="title">Race</h3>
                <hr className="style14" />
                <p className="no-data-message">No description data yet for {capitaliseWords(race)}.</p>
            </div>
        );
    }

    const { description, effects } = raceData;
    const hasEffects = Array.isArray(effects) && effects.length > 0;

    return (
        <div className="race-description-block area-box details-box">
            <h3 className="title">{capitaliseWords(race)}</h3>
            <hr className="style14" />
            {description && (
                <p className="race-description-text">{description}</p>
            )}
            {hasEffects && (
                <>
                    <h4 className="race-effects-heading">Racial effects</h4>
                    <ul className="race-effects-list no-disc-list">
                        {effects.map((effect) => (
                            <li key={effect.id || effect.label} className="race-effect-item">
                                <span className="race-effect-label">{effect.label}:</span>
                                {' '}
                                <span className="race-effect-detail">
                                    {effect.modifier}
                                    {effect.condition ? ` — ${effect.condition}` : ''}
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
