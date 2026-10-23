// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { SITE_URL } from '../../src/config';
import { buildShareText, copyText, shareGrid } from '../../src/engine/share';

describe('share text', () => {
  it('formats the Daily score, outcomes and site link', () => {
    const outcomes = ['correct', 'correct', 'partial', 'correct', 'wrong', 'correct', 'correct', 'correct', 'correct', 'correct'] as const;
    expect(buildShareText(12, outcomes, SITE_URL)).toBe(
      `Fallacy Forge #12 · 8/10\n🟩🟩🟨🟩🟥🟩🟩🟩🟩🟩\n${SITE_URL}`,
    );
  });

  it('maps outcomes to squares', () => {
    expect(shareGrid(['correct', 'partial', 'wrong'])).toBe('🟩🟨🟥');
  });

  it('points at the live site', () => {
    expect(SITE_URL).toBe('https://fallacyforge.com/');
  });
});

describe('copyText', () => {
  it('uses the Clipboard API when it works', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyText('hi', { clipboard: { writeText }, document })).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hi');
  });

  it('falls back to a textarea + execCommand when the Clipboard API fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    const exec = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { value: exec, configurable: true });
    await expect(copyText('fallback', { clipboard: { writeText }, document })).resolves.toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull(); // cleaned up
  });

  it('resolves false when both paths fail, so the UI can show the text', async () => {
    Object.defineProperty(document, 'execCommand', { value: vi.fn().mockReturnValue(false), configurable: true });
    await expect(copyText('nope', { clipboard: undefined, document })).resolves.toBe(false);
    await expect(copyText('nope', { clipboard: undefined, document: undefined })).resolves.toBe(false);
  });
});
