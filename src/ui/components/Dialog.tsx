// Native <dialog> wrapper: modal focus trapping, Esc to close, backdrop click
// to close, and focus returned to the opener.

import type { ComponentChildren, JSX } from 'preact';
import { useId, useLayoutEffect, useRef } from 'preact/hooks';
import { cx } from '../util';
import { Button, IconButton } from './Button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Visually hide the title (still labels the dialog). */
  hideTitle?: boolean;
  variant?: 'center' | 'side';
  class?: string;
  children?: ComponentChildren;
  footer?: ComponentChildren;
}

export function Dialog({ open, onClose, title, hideTitle, variant = 'center', class: className, children, footer }: DialogProps): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      const target = opener.current;
      opener.current = null;
      if (target && target.isConnected) target.focus();
    }
  }, [open]);

  useLayoutEffect(
    () => () => {
      const dialog = ref.current;
      if (dialog?.open && typeof dialog.close === 'function') dialog.close();
    },
    [],
  );

  return (
    <dialog
      ref={ref}
      class={cx('dialog', `dialog--${variant}`, className)}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {open && (
        <div class="dialog__panel">
          <header class="dialog__head">
            <h2 id={titleId} class={cx('dialog__title', hideTitle && 'sr-only')}>
              {title}
            </h2>
            <IconButton icon="x" label="Close" class="dialog__close" onClick={onClose} />
          </header>
          <div class="dialog__body">{children}</div>
          {footer && <footer class="dialog__foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: ComponentChildren;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel = 'Cancel', danger, onConfirm, onCancel }: ConfirmProps): JSX.Element {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      class="dialog--confirm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} autofocus>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'ink' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p class="dialog__message">{message}</p>
    </Dialog>
  );
}
