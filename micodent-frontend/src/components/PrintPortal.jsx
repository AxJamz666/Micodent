import { createPortal } from 'react-dom';

export default function PrintPortal({ children }) {
  return createPortal(<div data-print-dialog>{children}</div>, document.body);
}
