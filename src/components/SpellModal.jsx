import React from 'react';

/**
 * Reusable modal component for displaying spell details.
 * 
 * @param {object} props
 * @param {object} props.spell - The spell object to display
 * @param {function} props.onClose - Function to call when modal should close
 */
export default function SpellModal({ spell, onClose }) {
  if (!spell) return null;

  // Format ordinal numbers (1st, 2nd, 3rd, etc.)
  const formatOrdinal = (num) => {
    if (num === 1) return '1st';
    if (num === 2) return '2nd';
    if (num === 3) return '3rd';
    return `${num}th`;
  };

  // Handle modal backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="spell-modal-backdrop" onClick={handleBackdropClick}>
      <div className="spell-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="spell-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        
        <h2 className="spell-modal-name">{spell.Name}</h2>
        
        <div className="spell-modal-info-grid">
          <div className="spell-modal-info-item">
            <span className="spell-modal-info-label">Level:</span>
            <span className="spell-modal-info-value">{formatOrdinal(spell["Spell Level"])}</span>
          </div>
          
          <div className="spell-modal-info-item">
            <span className="spell-modal-info-label">School:</span>
            <span className="spell-modal-info-value">{spell.School}</span>
          </div>
          
          <div className="spell-modal-info-item">
            <span className="spell-modal-info-label">Range:</span>
            <span className="spell-modal-info-value">{spell.Range}</span>
          </div>
          
          {spell.Damage && (
            <div className="spell-modal-info-item">
              <span className="spell-modal-info-label">Damage:</span>
              <span className="spell-modal-info-value">{spell.Damage}</span>
            </div>
          )}
          
          <div className="spell-modal-info-item">
            <span className="spell-modal-info-label">Duration:</span>
            <span className="spell-modal-info-value">{spell.Duration}</span>
          </div>
          
          <div className="spell-modal-info-item">
            <span className="spell-modal-info-label">Area of Effect:</span>
            <span className="spell-modal-info-value">{spell.AOE}</span>
          </div>
          
          <div className="spell-modal-info-item">
            <span className="spell-modal-info-label">Casting Time:</span>
            <span className="spell-modal-info-value">{spell["Casting Time"]}</span>
          </div>
          
          <div className="spell-modal-info-item">
            <span className="spell-modal-info-label">Saving Throw:</span>
            <span className="spell-modal-info-value">{spell.Save}</span>
          </div>
          
          <div className="spell-modal-info-item spell-modal-info-full">
            <span className="spell-modal-info-label">Components:</span>
            <span className="spell-modal-info-value">{spell.Components.join(', ')}</span>
          </div>
        </div>

        <div className="spell-modal-description">
          <h4 className="spell-modal-description-title">Description:</h4>
          <p className="spell-modal-description-text">{spell.Description}</p>
        </div>
      </div>
    </div>
  );
}
