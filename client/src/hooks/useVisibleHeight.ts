import { useEffect, useState } from 'react';

/**
 * Height of the part of the screen the user can actually see.
 * iOS Safari does not shrink the page when the keyboard opens — it slides the page up
 * under the keyboard instead — so the app sizes itself to the visual viewport.
 */
export function useVisibleHeight(): number | undefined {
  const [height, setHeight] = useState(() => window.visualViewport?.height);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setHeight(vv.height);
      // Undo the page shift Safari applies when focusing an input.
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return height;
}
