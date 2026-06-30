import { useCallback, useRef, useState } from 'react';

/* Petit toast réutilisable : showToast(message) l'affiche ~1,4 s. */
export function useToast() {
  const [toast, setToast] = useState({ message: '', show: false });
  const timer = useRef(null);

  const showToast = useCallback((message) => {
    setToast({ message, show: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 1400);
  }, []);

  return { toast, showToast };
}
