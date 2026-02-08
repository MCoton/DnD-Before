/**
 * Utility functions for updating nested state objects.
 * Helps avoid repetitive spread operator patterns.
 */

/**
 * Updates a nested property in state using a path array or dot-separated string.
 * 
 * @param {function} setter - The state setter function (e.g., setCharacter)
 * @param {string|array} path - Path to the property (e.g., 'ac.armourType' or ['ac', 'armourType'])
 * @param {any} value - The new value to set
 * 
 * @example
 * updateNestedState(setCharacter, 'name', 'New Name');
 * updateNestedState(setCharacter, ['ac', 'armourType'], 'plate');
 * updateNestedState(setCharacter, 'scores.str', 15);
 */
export function updateNestedState(setter, path, value) {
  setter(prev => {
    const keys = Array.isArray(path) ? path : path.split('.');
    const newState = { ...prev };
    let current = newState;
    
    // Navigate to the parent of the target property
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      current[key] = { ...current[key] };
      current = current[key];
    }
    
    // Set the final value
    current[keys[keys.length - 1]] = value;
    return newState;
  });
}

/**
 * Updates multiple nested properties in a single state update.
 * 
 * @param {function} setter - The state setter function
 * @param {object} updates - Object with path-value pairs
 * 
 * @example
 * updateMultipleNested(setCharacter, {
 *   'name': 'New Name',
 *   'ac.armourType': 'plate',
 *   'scores.str': 15
 * });
 */
export function updateMultipleNested(setter, updates) {
  setter(prev => {
    const newState = { ...prev };
    
    Object.entries(updates).forEach(([path, value]) => {
      const keys = path.split('.');
      let current = newState;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...current[key] };
        current = current[key];
      }
      
      current[keys[keys.length - 1]] = value;
    });
    
    return newState;
  });
}
