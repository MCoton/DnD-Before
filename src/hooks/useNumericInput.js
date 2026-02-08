import { useState, useEffect } from 'react';

/**
 * Custom hook for managing numeric input fields with empty string support.
 * Allows users to clear the field temporarily while maintaining validation.
 * 
 * @param {number} initialValue - The initial numeric value
 * @param {object} options - Configuration options
 * @param {number} options.min - Minimum allowed value (default: 0)
 * @param {number} options.max - Maximum allowed value (default: Infinity)
 * @param {function} options.onUpdate - Callback when valid value is entered
 * @param {function} options.onBlur - Optional callback on blur event
 * @returns {object} Object with inputValue, handleChange, and handleBlur
 */
export function useNumericInput(initialValue, options = {}) {
  const { min = 0, max = Infinity, onUpdate, onBlur } = options;
  const [inputValue, setInputValue] = useState(String(initialValue));
  
  // Update local state when initialValue prop changes (from external updates)
  useEffect(() => {
    setInputValue(String(initialValue));
  }, [initialValue]);
  
  const handleChange = (e) => {
    const value = e.target.value;
    
    // Allow empty string temporarily so user can clear the field
    if (value === '') {
      setInputValue('');
      return;
    }
    
    // Parse the input value
    const parsedValue = parseInt(value, 10);
    
    // If not a valid number, don't update
    if (isNaN(parsedValue)) {
      return;
    }
    
    // Update local state to show what user is typing
    setInputValue(value);
    
    // Clamp the value to valid range
    const clampedValue = Math.max(min, Math.min(max, parsedValue));
    
    // Call update callback if provided
    if (onUpdate) {
      onUpdate(clampedValue);
    }
  };
  
  const handleBlur = () => {
    // If field is empty or invalid, restore the previous value
    if (inputValue === '' || isNaN(parseInt(inputValue, 10))) {
      setInputValue(String(initialValue));
    }
    
    // Call optional blur callback
    if (onBlur) {
      onBlur();
    }
  };
  
  return { inputValue, handleChange, handleBlur };
}
