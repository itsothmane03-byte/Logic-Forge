// Share the Daily result: copy to clipboard, or show the text when copying fails.

import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { SITE_URL } from '../../config';
import { buildShareText, copyText } from '../../engine/share';
import type { Outcome } from '../../engine/types';
import { showToast } from '../../state/store';
import { Button } from './Button';
import { Dialog } from './Dialog';

interface Props {
  dailyNumber: number;
  outcomes: readonly Outcome[];
  total: number;
  variant?: 'primary' | 'secondary' | 'ink';
  size?: 'md' | 'lg';
}

export function ShareButton({ dailyNumber, outcomes, total, variant = 'secondary', size = 'md' }: Props): JSX.Element {
  const [fallbackText, setFallbackText] = useState<string | null>(null);
  const onShare = async () => {
    const text = buildShareText(dailyNumber, outcomes, SITE_URL, total);
    const copied = await copyText(text);
    if (copied) showToast('Copied');
    else setFallbackText(text);
  };
  return (
    <>
      <Button variant={variant} size={size} icon="share" onClick={onShare}>
        Share
      </Button>
      <Dialog open={fallbackText !== null} onClose={() => setFallbackText(null)} title="Copy your result">
        <p class="dialog__message">Copying isn't available here. Select the text below and copy it.</p>
        <textarea
          class="share-text"
          readOnly
          rows={4}
          value={fallbackText ?? ''}
          aria-label="Share text"
          onFocus={(event) => (event.currentTarget as HTMLTextAreaElement).select()}
        />
      </Dialog>
    </>
  );
}
