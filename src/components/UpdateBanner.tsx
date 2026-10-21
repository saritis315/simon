import { runUpdate, useUpdateAvailable } from '../pwa/updateState';

export function UpdateBanner() {
  const available = useUpdateAvailable();
  if (!available) return null;

  return (
    <div className="update-banner" role="status">
      <span>יש גרסה חדשה של המשחק</span>
      <button type="button" className="btn btn-secondary" onClick={runUpdate}>
        עדכן
      </button>
    </div>
  );
}
