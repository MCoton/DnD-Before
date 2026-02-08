import React from 'react';

/**
 * Reusable select/dropdown input component.
 * 
 * @param {object} props
 * @param {string} props.label - Label text for the select
 * @param {string} props.value - Current selected value
 * @param {array} props.options - Array of {value, label} objects
 * @param {function} props.onChange - Change handler function
 * @param {string} props.placeholder - Placeholder text (default: "Choose {label}")
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.name - Input name attribute
 */
export default function SelectInput({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder, 
  className = "select-input",
  name 
}) {
  const defaultPlaceholder = placeholder || `Choose ${label?.toLowerCase() || 'option'}`;
  
  return (
    <label className="input-row">
      <span className="input-label">{label}:</span>
      <select
        name={name || label?.toLowerCase()}
        value={value || ""}
        onChange={onChange}
        className={className}
      >
        <option value="">{defaultPlaceholder}</option>
        {options.map(option => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}
