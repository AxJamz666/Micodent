import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { manageModalFocus } from '../utils/modalFocus';

export default function ModalDialog({ children, onRequestClose, closeDisabled = false, className = '', ...props }) {
  const dialog = useRef(null);
  const latest = useRef({ onRequestClose, closeDisabled });
  useLayoutEffect(() => { latest.current = { onRequestClose, closeDisabled }; });
  useLayoutEffect(() => manageModalFocus(dialog.current,
    () => latest.current.onRequestClose(), () => latest.current.closeDisabled), []);
  return createPortal(
    <dialog {...props} ref={dialog} open aria-modal="true" tabIndex={-1}
      className={`managed-dialog ${className}`}>
      {children}
    </dialog>, document.body
  );
}
