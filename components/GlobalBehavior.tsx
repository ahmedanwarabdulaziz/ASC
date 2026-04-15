'use client'

import { useEffect } from 'react'

export default function GlobalBehavior() {
  useEffect(() => {
    // Add global event listener for selecting text on focus
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Target text-based inputs and textareas
      if (
        (target.tagName === 'INPUT' && 
         !['checkbox', 'radio', 'submit', 'button'].includes((target as HTMLInputElement).type)
        ) ||
        target.tagName === 'TEXTAREA'
      ) {
        // Some browsers need a slight delay to trigger selection reliably, especially on mobile/mouse clicks
        setTimeout(() => {
            try {
               (target as HTMLInputElement).select();
            } catch (err) {
               // Ignore errors if element doesn't support select() (e.g., input type="email" in some older browsers)
            }
        }, 10);
      }
    }

    // focusin bubbles up, focus does not.
    document.addEventListener('focusin', handleFocus)
    
    return () => {
      document.removeEventListener('focusin', handleFocus)
    }
  }, [])

  return null
}
