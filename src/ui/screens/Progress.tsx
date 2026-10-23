// Progress: stats, heatmap, accuracy trend, mastery by family, settings & data.

import type { JSX } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { dateKey } from '../../engine/dates';
import { accuracy, accuracyTrend, familyMastery, heatmap, masteredCount, totalAnswered, trendSummary } from '../../engine/stats';
import { parseImport, serializeExport } from '../../engine/storage';
import { currentStreak } from '../../engine/streak';
import type { Progress, ThemeSetting } from '../../engine/types';
import { bank, progress, replaceProgress, resetProgress, setShowDefinitions, setTheme, showToast, storageOk } from '../../state/store';
import { Button, ButtonLink } from '../components/Button';
import { Heatmap, Sparkline } from '../components/Charts';
import { SegmentedControl, Switch } from '../components/Controls';
import { ConfirmDialog } from '../components/Dialog';
import { Icon } from '../components/Icon';
import { MasteryBar, Reveal } from '../components/Primitives';
import { downloadText, readFileText } from '../download';
import { plural } from '../util';

const THEMES: ReadonlyArray<{ value: ThemeSetting; label: string; icon: 'monitor' | 'sun' | 'moon' }> = [
  { value: 'system', label: 'System', icon: 'monitor' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
];

function StatRow({ p, today }: { p: Progress; today: string }) {
  const acc = accuracy(p);
  const mastered = masteredCount(p.boxes, bank.fallacies.map((f) => f.id));
  const stats: Array<{ value: string; label: string }> = [
    { value: String(totalAnswered(p.days)), label: 'quiz questions answered' },
    { value: acc === null ? '—' : `${Math.round(acc * 100)}%`, label: 'quiz accuracy' },
    { value: `${currentStreak(p.days, today)} / ${Math.max(p.bestStreak, currentStreak(p.days, today))}`, label: 'current / best streak' },
    { value: `${mastered} / ${bank.fallacies.length}`, label: 'fallacies mastered' },
  ];
  return (
    <dl class="stat-row">
      {stats.map((s) => (
        <div key={s.label} class="stat">
          <dt class="stat__label">{s.label}</dt>
          <dd class="stat__value">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DataSettings() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Progress | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onExport = () => {
    downloadText(`fallacy-forge-progress-${dateKey()}.json`, serializeExport(progress.value));
    showToast('Progress exported');
  };

  const onFile = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const result = parseImport(await readFileText(file));
      if (result.ok) {
        setError(null);
        setPending(result.progress);
      } else {
        setError(result.error);
      }
    } catch {
      setError("That file couldn't be read.");
    }
  };

  return (
    <div class="settings-block">
      <h3 class="settings-block__title">Your data</h3>
      <p class="settings-block__hint">Your progress never leaves this browser. Export a backup or move it to another device.</p>
      <div class="data-actions">
        <Button icon="download" onClick={onExport}>
          Export
        </Button>
        <Button icon="upload" onClick={() => fileRef.current?.click()}>
          Import
        </Button>
        <Button icon="trash" variant="ghost" class="btn--danger" onClick={() => setConfirmReset(true)}>
          Reset
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" class="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
      </div>
      {error && (
        <p class="form-error" role="alert">
          <Icon name="x" size={16} strokeWidth={3} />
          {error}
        </p>
      )}
      <ConfirmDialog
        open={pending !== null}
        title="Replace your progress?"
        message="The imported file will replace everything currently saved in this browser."
        confirmLabel="Replace"
        onConfirm={() => {
          if (pending) {
            replaceProgress(pending);
          }
          setPending(null);
          showToast('Progress imported');
        }}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Reset all progress?"
        message="This clears your answers, mastery, streaks and all activity progress in this browser. It can't be undone."
        confirmLabel="Reset everything"
        danger
        onConfirm={() => {
          resetProgress();
          setConfirmReset(false);
          showToast('Progress reset');
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

export function ProgressScreen(): JSX.Element {
  const p = progress.value;
  const today = dateKey();
  const trend = accuracyTrend(p.sessions, 14);
  const groups = familyMastery(bank.families, bank.fallacies, p);

  return (
    <div class="page progress">
      <header class="page-head">
        <h1 class="page-title" tabIndex={-1}>
          Progress
        </h1>
        <p class="lead">Your practice, saved on this device.</p>
      </header>

      <StatRow p={p} today={today} />

      <section class="panel repair-progress" aria-labelledby="repair-progress-title">
        <h2 id="repair-progress-title" class="panel__title">Fix the argument</h2>
        <p class="panel__sub">Saved separately from quiz mastery.</p>
        <dl class="repair-progress__stats">
          <div><dt>exercises answered</dt><dd>{p.repair.answered}</dd></div>
          <div><dt>best repairs chosen</dt><dd>{p.repair.correct}</dd></div>
          <div><dt>sets completed</dt><dd>{p.repair.sets}</dd></div>
        </dl>
        <ButtonLink href="#/repair" variant="secondary" iconRight="arrow-right">Practice repairs</ButtonLink>
      </section>

      <section class="panel repair-progress" aria-labelledby="logic-progress-title">
        <h2 id="logic-progress-title" class="panel__title">What follows?</h2>
        <p class="panel__sub">Deductions from the given facts.</p>
        <dl class="repair-progress__stats">
          <div><dt>puzzles answered</dt><dd>{p.logic.answered}</dd></div>
          <div><dt>correct deductions</dt><dd>{p.logic.correct}</dd></div>
          <div><dt>sets completed</dt><dd>{p.logic.sets}</dd></div>
        </dl>
        <ButtonLink href="#/logic" variant="secondary" iconRight="arrow-right">Practice logic</ButtonLink>
      </section>

      <div class="progress-grid">
        <Reveal as="section" class="panel panel--heatmap" aria-labelledby="heat-title">
          <h2 id="heat-title" class="panel__title">
            Practice days
          </h2>
          <p class="panel__sub">Last 20 weeks</p>
          <Heatmap columns={heatmap(p.days, today, 20)} />
        </Reveal>

        <Reveal as="section" index={1} class="panel panel--trend" aria-labelledby="trend-title">
          <h2 id="trend-title" class="panel__title">
            Accuracy trend
          </h2>
          <p class="panel__sub">{trend.length > 0 ? plural(trend.length, 'session') : 'No sessions yet'}</p>
          <Sparkline values={trend} />
          <p class="panel__summary">{trendSummary(trend)}</p>
        </Reveal>
      </div>

      <Reveal as="section" class="panel" aria-labelledby="mastery-title">
        <h2 id="mastery-title" class="panel__title">
          Mastery by family
        </h2>
        <p class="panel__sub">Each fallacy climbs five boxes as you get it right.</p>
        <div class="family-list">
          {groups.map((group) => (
            <section key={group.family.id} class="family-group" aria-labelledby={`fm-${group.family.id}`}>
              <h3 id={`fm-${group.family.id}`} class="family-group__title">
                <span class={`family-dot family-dot--${group.family.id}`} aria-hidden="true" />
                {group.family.label}
                <span class="family-group__pct">{group.percent}%</span>
              </h3>
              <ul class="mastery-rows">
                {group.rows.map((row) => (
                  <li key={row.fallacy.id}>
                    <a class="mastery-row" href={`#/library/${row.fallacy.id}`}>
                      <span class="mastery-row__name">{row.fallacy.name}</span>
                      <MasteryBar box={row.box} practiced={row.practiced} compact label={`${row.fallacy.name} mastery`} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" class="panel settings" aria-labelledby="settings-title">
        <h2 id="settings-title" class="panel__title">
          Settings
        </h2>
        <div class="settings-block">
          <h3 class="settings-block__title">Theme</h3>
          <SegmentedControl label="Theme" value={p.settings.theme} options={THEMES} onChange={setTheme} />
        </div>
        <div class="settings-block">
          <Switch
            label="Show definitions on answers"
            hint="Turn off for hard mode: names only in the Name step."
            checked={p.settings.showDefinitions}
            onChange={setShowDefinitions}
          />
        </div>
        <DataSettings />
        <p><a class="text-link" href="#/setup">Practice preferences</a></p>
        {!storageOk.value && (
          <p class="form-note" role="status">
            This browser isn't letting us save right now (private mode or full storage). Progress will reset when you close the tab.
          </p>
        )}
      </Reveal>
    </div>
  );
}
