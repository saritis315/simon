import { useEffect, useRef } from 'react';

interface Props {
  onCancel: () => void;
  onConfirm: () => void;
}

// Delete confirmation layer over the About screen (not a separate screen)
export function ConfirmDialog({ onCancel, onConfirm }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="scrim">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">למחוק את ההיסטוריה?</h2>
        <p>כל התוצאות השמורות יימחקו ולא ניתן יהיה לשחזר אותן.</p>
        <div className="dialog-actions">
          <button type="button" ref={cancelRef} className="btn btn-secondary" onClick={onCancel}>
            ביטול
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            מחק
          </button>
        </div>
      </div>
    </div>
  );
}
