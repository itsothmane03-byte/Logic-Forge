// Wordle-style share text for the Daily Forge.

import { sessionScore } from './score';
import type { Outcome } from './types';

const SQUARES: Readonly<Record<Outcome, string>> = {
  correct: '🟩',
  partial: '🟨',
  wrong: '🟥',
};

export function shareGrid(outcomes: readonly Outcome[]): string {
  return outcomes.map((o) => SQUARES[o]).join('');
}

/**
 * Fallacy Forge #12 · 8/10
 * 🟩🟩🟨🟩🟥🟩🟩🟩🟩🟩
 * <site url>
 */
export function buildShareText(dailyNumber: number, outcomes: readonly Outcome[], url: string, total = outcomes.length): string {
  return `Fallacy Forge #${dailyNumber} · ${sessionScore(outcomes)}/${total}\n${shareGrid(outcomes)}\n${url}`;
}

export interface ClipboardEnv {
  clipboard?: { writeText(text: string): Promise<void> } | undefined;
  document?: Document | undefined;
}

function legacyCopy(text: string, doc: Document): boolean {
  const area = doc.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '0';
  area.style.opacity = '0';
  doc.body.appendChild(area);
  try {
    area.select();
    return doc.execCommand('copy');
  } finally {
    area.remove();
  }
}

/**
 * Copies text: Clipboard API first, then a hidden textarea + execCommand.
 * Resolves false when both fail so the UI can show the text in a dialog.
 */
export async function copyText(text: string, env: ClipboardEnv = defaultEnv()): Promise<boolean> {
  try {
    if (env.clipboard) {
      await env.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    return env.document ? legacyCopy(text, env.document) : false;
  } catch {
    return false;
  }
}

function defaultEnv(): ClipboardEnv {
  return {
    clipboard: typeof navigator !== 'undefined' ? navigator.clipboard : undefined,
    document: typeof document !== 'undefined' ? document : undefined,
  };
}
