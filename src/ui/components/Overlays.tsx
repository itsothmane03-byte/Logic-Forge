// App-wide overlays: the toast live region and the keyboard shortcuts dialog.

import { signal } from '@preact/signals';
import type { JSX } from 'preact';
import { toast } from '../../state/store';
import { Dialog } from './Dialog';
import { Icon } from './Icon';

/** Persistent polite live region; the text changes, the region stays. */
export function Toast(): JSX.Element {
  const message = toast.value;
  return (
    <div class="toast-region" role="status" aria-live="polite" aria-atomic="true">
      {message && (
        <div class="toast" key={message.id}>
          <Icon name="check" size={18} />
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}

export const shortcutsOpen = signal(false);

const SHORTCUTS: Array<{ keys: string[]; joiner: string; action: string }> = [
  { keys: ['S', 'F'], joiner: '/', action: 'Spot sound or flawed' },
  { keys: ['1', '4'], joiner: 'to', action: 'Choose an answer' },
  { keys: ['Enter'], joiner: '', action: 'Check / Continue' },
  { keys: ['/'], joiner: '', action: 'Search the library' },
  { keys: ['Esc'], joiner: '', action: 'Close' },
  { keys: ['?'], joiner: '', action: 'Show this list' },
];

export function ShortcutsDialog(): JSX.Element {
  return (
    <Dialog open={shortcutsOpen.value} onClose={() => (shortcutsOpen.value = false)} title="Keyboard shortcuts" class="dialog--shortcuts">
      <table class="shortcuts">
        <thead class="sr-only">
          <tr>
            <th scope="col">Key</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {SHORTCUTS.map(({ keys, joiner, action }) => (
            <tr key={action}>
              <td>
                {keys.map((k, i) => (
                  <span key={k}>
                    {i > 0 && <span class="shortcuts__sep">{joiner}</span>}
                    <kbd class="kbd">{k}</kbd>
                  </span>
                ))}
              </td>
              <td>{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}
