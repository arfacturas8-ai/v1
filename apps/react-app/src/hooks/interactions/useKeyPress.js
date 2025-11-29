import { useState, useEffect } from 'react';

export const useKeyPress = (targetKey, options = {}) => {
  const [keyPressed, setKeyPressed] = useState(false);
  const { ctrl = false, shift = false, alt = false } = options;

  useEffect(() => {
    const downHandler = (event) => {
      const modifiersMatch = 
        (ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey) &&
        (shift ? event.shiftKey : !event.shiftKey) &&
        (alt ? event.altKey : !event.altKey);

      if (event.key === targetKey && modifiersMatch) {
        event.preventDefault();
        setKeyPressed(true);
      }
    };

    const upHandler = (event) => {
      if (event.key === targetKey) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey, ctrl, shift, alt]);

  return keyPressed;
};

export default useKeyPress;
