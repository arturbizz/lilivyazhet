import { useCallback, useEffect, useRef, useState } from 'react';

/* Горизонтальная лента со стрелками, которые прячутся у краёв */
export function useHorizontalScroll() {
  const ref = useRef(null);
  const [state, setState] = useState({ canLeft: false, canRight: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setState({
      canLeft: el.scrollLeft > 8,
      canRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const t = setTimeout(update, 400);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      clearTimeout(t);
    };
  }, [update]);

  const scroll = useCallback((dir) => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.max(260, Math.round(el.clientWidth * 0.8));
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

  return { ref, scroll, update, ...state };
}
