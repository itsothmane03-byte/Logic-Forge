// Practice hub (#/practice): the three practice activities. ACTIVITIES and
// Activity metadata is also used on Home.

import type { JSX } from 'preact';
import { INTERESTS } from '../../engine/interests';
import { progress, setInterests, storageOk } from '../../state/store';
import { logicSession } from '../../state/logic';
import { repairSession } from '../../state/repair';
import { session } from '../../state/session';
import { ButtonLink } from '../components/Button';
import type { IconName } from '../components/Icon';
import { Button } from '../components/Button';
import '../styles/interests.css';

export type ActivityId = 'spot' | 'repair' | 'logic';

export interface Activity {
  id: ActivityId;
  title: string;
  text: string;
  href: string;
  icon: IconName;
}

export const ACTIVITIES: readonly Activity[] = [
  { id: 'spot', title: 'Spot the flaw', text: 'Decide if an argument holds up, then name the flaw.', href: '#/play/practice', icon: 'target' },
  { id: 'repair', title: 'Fix the argument', text: 'Choose the rewrite that fixes a weak argument.', href: '#/repair', icon: 'scale' },
  { id: 'logic', title: 'What follows?', text: 'Given a few facts, judge whether a claim must follow.', href: '#/logic', icon: 'layers' },
];

/** True while a set of this activity is open but not finished. */
export function inProgress(id: ActivityId): boolean {
  if (id === 'repair') return Boolean(repairSession.value && !repairSession.value.finished);
  if (id === 'logic') return Boolean(logicSession.value && !logicSession.value.finished);
  const current = session.value;
  return Boolean(current && current.key === 'practice' && !current.finished);
}

export function ActivityCard({ activity }: { activity: Activity }): JSX.Element {
  const titleId = `activity-${activity.id}`;
  return (
    <section class="activity-row" aria-labelledby={titleId}>
      <div>
        <h2 id={titleId} class="activity-row__title">
          {activity.title}
        </h2>
        <p class="activity-row__text">{activity.text}</p>
      </div>
      <div class="activity-row__action">
        <ButtonLink href={activity.href} variant="secondary" iconRight="arrow-right">
          {inProgress(activity.id) ? 'Resume' : 'Start'}
          <span class="sr-only"> {activity.title}</span>
        </ButtonLink>
      </div>
    </section>
  );
}

export function PracticeScreen(): JSX.Element {
  return (
    <div class="page practice-hub">
      <header class="page-head">
        <h1 class="page-title" tabIndex={-1}>
          Practice
        </h1>
      </header>
      <div class="practice-activities">
        {ACTIVITIES.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
      <details class="topic-preferences">
        <summary>Familiar topics</summary>
        <p>Optional topics for new Spot the flaw and Focus sets. We still mix in other topics to cover the skills you need.</p>
        <fieldset>
          <legend class="sr-only">Preferred topics</legend>
          <div class="topic-preferences__choices">
            <Button variant="ghost" size="sm" aria-pressed={progress.value.settings.interests.length === 0} onClick={() => setInterests([])}>Mix everything</Button>
            {INTERESTS.map((interest) => (
              <label class="topic-preferences__choice" key={interest.id}>
                <input type="checkbox" checked={progress.value.settings.interests.includes(interest.id)}
                  onChange={(event) => setInterests(event.currentTarget.checked
                    ? [...progress.value.settings.interests, interest.id]
                    : progress.value.settings.interests.filter((id) => id !== interest.id))} />
                <span>{interest.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p class="topic-preferences__note" role="status">{progress.value.settings.interests.length ? 'Preferences saved for your next set.' : 'Mixing all topics.'} Daily Forge stays the same for everyone.</p>
        {!storageOk.value && <p role="status">Your choice works here, but this browser could not save it.</p>}
        <p><a class="text-link" href="#/setup">Practice preferences</a></p>
      </details>
    </div>
  );
}
