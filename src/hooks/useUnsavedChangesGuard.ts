import { useCallback, useEffect } from 'react';

const MESSAGE = 'Hay cambios sin guardar. ¿Salir sin guardar?';

/**
 * Warns before closing/reloading the tab while a form is dirty and gives
 * in-app navigation a `confirmLeave` check. (The app uses BrowserRouter, which
 * has no route blocker, so links must call `confirmLeave` explicitly.)
 */
export const useUnsavedChangesGuard = (dirty: boolean) => {
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  return useCallback((): boolean => !dirty || window.confirm(MESSAGE), [dirty]);
};
