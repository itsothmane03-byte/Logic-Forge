import type { JSX } from 'preact';
import { repairs } from '../../data/repairs';
import { repairSession } from '../../state/repair';
import { progress } from '../../state/store';
import { ButtonLink } from '../components/Button';
import { Icon } from '../components/Icon';
import { Reveal } from '../components/Primitives';

export function PracticeScreen(): JSX.Element {
  const p = progress.value;
  return (
    <div class="page practice-hub">
      <header class="page-head">
        <p class="eyebrow">A little clearer, every day</p>
        <h1 class="page-title" tabIndex={-1}>Practice thinking clearly.</h1>
        <p class="lead">Spot a weak argument. Then learn to make it stronger.</p>
      </header>
      <div class="practice-hub__grid">
        <Reveal as="section" class="practice-card" aria-labelledby="spot-title">
          <span class="practice-card__icon" aria-hidden="true"><Icon name="target" size={28} /></span>
          <p class="eyebrow">Notice the problem</p>
          <h2 id="spot-title">Spot the flaw</h2>
          <p>Read an everyday argument. Decide whether it holds up, then name the flaw.</p>
          <ul class="practice-card__skills">
            <li>Tell sound reasoning from a convincing mistake</li>
            <li>Learn the difference between similar fallacies</li>
          </ul>
          <p class="practice-card__meta">10 questions · about 5 min</p>
          <ButtonLink href="#/play/practice" variant="secondary" iconRight="arrow-right">Spot the flaw</ButtonLink>
        </Reveal>
        <Reveal as="section" index={1} class="practice-card practice-card--repair" aria-labelledby="repair-title">
          <span class="practice-card__icon" aria-hidden="true"><Icon name="scale" size={28} /></span>
          <p class="eyebrow">Take the next step</p>
          <h2 id="repair-title">Fix the argument</h2>
          <p>The argument has a problem. Choose the revision that best addresses it.</p>
          <ul class="practice-card__skills">
            <li>Find the missing evidence or hidden assumption</li>
            <li>Make a claim the evidence can actually support</li>
          </ul>
          <p class="practice-card__meta">5 exercises · about 5 min · {repairs.length} in the collection</p>
          <ButtonLink href="#/repair" variant="primary" iconRight="arrow-right">{repairSession.value && !repairSession.value.finished ? 'Resume repairs' : p.repair.answered ? 'Practice repairs' : 'Try a repair'}</ButtonLink>
        </Reveal>
      </div>
      <p class="practice-hub__note">A better argument still depends on good evidence. Each activity explains your choice, so a missed answer is useful too.</p>
    </div>
  );
}
