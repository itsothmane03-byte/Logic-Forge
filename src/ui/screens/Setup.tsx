import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { INTERESTS, type InterestId } from '../../engine/interests';
import type { StartingExperience } from '../../engine/starting';
import { cancelSetup, finishSetup, hasActivePractice, saveSetup } from '../../state/onboarding';
import { progress, storageOk } from '../../state/store';
import { Button } from '../components/Button';
import '../styles/setup.css';

const STARTS: Array<{ id: StartingExperience | null; label: string }> = [
  { id: null, label: 'Let the app choose' },
  { id: 'new', label: 'New to this' },
  { id: 'some', label: 'Some experience' },
  { id: 'comfortable', label: 'Comfortable' },
];

export function SetupScreen(): JSX.Element {
  const [interests, setInterests] = useState<InterestId[]>(() => [...progress.peek().settings.interests]);
  const [experience, setExperience] = useState<StartingExperience | null>(() => progress.peek().settings.startingExperience ?? null);
  const preserve = hasActivePractice();
  const choices = { interests, experience };
  const toggle = (id: InterestId) => setInterests((current) => current.includes(id)
    ? current.filter((chosen) => chosen !== id) : [...current, id]);

  return (
    <div class="page page--narrow practice-preferences">
      <header class="page-head">
        <h1 class="page-title" tabIndex={-1}>Practice preferences</h1>
        <p class="practice-preferences__intro">Choose familiar examples for Spot the flaw and Focus. Daily Forge stays the same for everyone.</p>
      </header>
      <form class="practice-preferences__form" onSubmit={(event) => { event.preventDefault(); saveSetup(choices); }}>
        <fieldset aria-describedby="topics-note">
          <legend>Topics</legend>
          <p id="topics-note">All topics can appear so you practice a range of skills.</p>
          <div class="practice-preferences__topics">
            {INTERESTS.map((interest) => (
              <label class="practice-preferences__option" key={interest.id}>
                <input type="checkbox" checked={interests.includes(interest.id)} onChange={() => toggle(interest.id)} />
                <span>{interest.label}</span>
              </label>
            ))}
          </div>
          <Button variant="ghost" size="sm" class="practice-preferences__mix" aria-pressed={interests.length === 0} onClick={() => setInterests([])}>Mix everything</Button>
        </fieldset>

        <fieldset aria-describedby="warmup-note">
          <legend>Five-question warm-up</legend>
          <p id="warmup-note">Optional starting point for a short set.</p>
          <div class="practice-preferences__starts">
            {STARTS.map((choice) => (
              <label class="practice-preferences__option" key={choice.id ?? 'auto'}>
                <input type="radio" name="starting-experience" value={choice.id ?? 'auto'} checked={experience === choice.id} onChange={() => setExperience(choice.id)} />
                <span>{choice.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {preserve && <p class="practice-preferences__notice">Your current exercises stay intact. Topic changes apply to your next set.</p>}
        {!storageOk.value && <p class="practice-preferences__notice" role="status">You can continue, but this browser could not save your choices.</p>}
        <div class="practice-preferences__actions">
          <Button type="submit" variant="primary">Save preferences</Button>
          {!preserve && <Button variant="secondary" onClick={() => finishSetup(choices)}>Try 5 questions</Button>}
          <Button variant="ghost" onClick={cancelSetup}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
