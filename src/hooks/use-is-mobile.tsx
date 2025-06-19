
import * as React from "react"

const MOBILE_BREAKPOINT = 768 // Standard for md in Tailwind

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      // During SSR or in environments without window, default to a non-mobile assumption or specific logic.
      // For this hook, it makes sense to assume not mobile or wait for client-side hydration.
      // Setting to undefined initially helps avoid hydration mismatches if used in initial render.
      setIsMobile(false); // Or some other default if that makes more sense for your SSR strategy
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = () => {
      setIsMobile(mql.matches); // Use mql.matches directly
    };

    // Set initial state
    onChange(); 
    
    mql.addEventListener("change", onChange);
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile; // Returns boolean or undefined
}
