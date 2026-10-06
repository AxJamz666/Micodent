const focusableSelector = 'button, input:not([type="hidden"]), select, textarea, a[href], [tabindex]';
const activeModals = [];
let previousOverflow;

function focusable(dialog) {
  return [...dialog.querySelectorAll(focusableSelector)].filter(element =>
    !element.disabled && element.tabIndex >= 0 && !element.closest('[inert]') && element.getClientRects().length > 0);
}

// Keep existing toast/print layers usable without promoting the dialog to the browser top layer.
export function manageModalFocus(dialog, requestClose, closeDisabled) {
  const document = dialog.ownerDocument;
  const opener = document.activeElement;
  let closeRequested = false;
  if (activeModals.length === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  activeModals.push(dialog);
  const isTop = () => activeModals.at(-1) === dialog;
  const focusInitial = () => {
    const controls = focusable(dialog);
    const field = controls.find(element => element.matches('input, select, textarea'));
    (field || controls[0] || dialog).focus({ preventScroll: true });
  };
  const close = event => {
    event.preventDefault();
    if (!isTop() || closeDisabled() || closeRequested || event.repeat) return;
    closeRequested = true;
    requestClose();
  };
  const keydown = event => {
    if (!isTop() || event.defaultPrevented) return;
    if (event.key === 'Escape') {
      close(event);
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = focusable(dialog);
    const first = controls[0];
    const last = controls.at(-1);
    if (!first) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
    } else if (!dialog.contains(document.activeElement) ||
      (event.shiftKey && document.activeElement === first) ||
      (!event.shiftKey && document.activeElement === last) || document.activeElement === dialog) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus({ preventScroll: true });
    }
  };
  const focusin = event => {
    if (isTop() && !dialog.contains(event.target)) focusInitial();
  };
  document.addEventListener('keydown', keydown);
  document.addEventListener('focusin', focusin);
  dialog.addEventListener('cancel', close);
  focusInitial();
  return () => {
    const wasTop = isTop();
    document.removeEventListener('keydown', keydown);
    document.removeEventListener('focusin', focusin);
    dialog.removeEventListener('cancel', close);
    activeModals.splice(activeModals.indexOf(dialog), 1);
    if (activeModals.length === 0) document.body.style.overflow = previousOverflow;
    if (wasTop && opener?.isConnected && (!activeModals.length || activeModals.at(-1).contains(opener))) {
      opener.focus({ preventScroll: true });
    } else if (wasTop && activeModals.length) {
      activeModals.at(-1).focus({ preventScroll: true });
    }
  };
}
