import type { JSX } from 'preact';
import { APP_VERSION, REPO_URL } from '../../config';
import { bank } from '../../state/store';
import { ButtonLink } from '../components/Button';
import { Icon } from '../components/Icon';
import { LogoMark } from '../components/Logo';

export function AboutScreen(): JSX.Element {
  return (
    <div class="page page--narrow about">
      <header class="about-head">
        <LogoMark size={64} />
        <h1 class="page-title" tabIndex={-1}>
          About Fallacy Forge
        </h1>
        <p class="lead">Short activities for clearer thinking. Version {APP_VERSION}.</p>
      </header>

      <section class="about-block" aria-labelledby="about-what">
        <h2 id="about-what">What's a fallacy?</h2>
        <p>
          A fallacy is a flaw in reasoning: a move that makes an argument feel convincing without actually supporting its
          conclusion. Fallacies hide in ordinary posts, emails and headlines, usually next to perfectly reasonable sentences.
          Learning to name them helps you notice when you're being persuaded by something other than good reasons.
        </p>
      </section>

      <section class="about-block" aria-labelledby="about-activities">
        <h2 id="about-activities">Three ways to practice</h2>
        <p><strong>Spot the flaw</strong> asks whether an argument holds up and, if it does not, which fallacy it contains. <strong>Fix the argument</strong> asks you to choose a revision that addresses the problem: better evidence, a fairer claim, or a missing assumption made clear.</p>
        <p><strong>What follows?</strong> gives you a few facts and a claim. Decide whether the claim must be true, must be false, or could be either. Treat the facts as given; everyday likelihood is a different question.</p>
        <p>Repair and deduction scores save separately from quiz mastery. A stronger argument can still need more evidence.</p>
      </section>

      <section class="about-block" aria-labelledby="about-scoring">
        <h2 id="about-scoring">How scoring and mastery work</h2>
        <ul class="about-list">
          <li>
            <strong>Correct:</strong> you called a sound argument sound, or a flawed one flawed and named the right fallacy.
          </li>
          <li>
            <strong>Right instinct:</strong> you saw the flaw but picked the wrong name. Close, and worth a second look.
          </li>
          <li>
            <strong>Missed:</strong> you called a flawed argument sound, or a sound one flawed.
          </li>
        </ul>
        <p>
          Each of the {bank.fallacies.length} fallacies has its own box from 1 to 5. A correct answer moves it up one box, a
          right instinct moves it down one, and a miss sends it back to box 1. Practice shows low-box fallacies more often, so
          your mistakes come back sooner. Box 5 means mastered.
        </p>
      </section>

      <section class="about-block about-block--privacy" aria-labelledby="about-storage">
        <span class="about-block__icon" aria-hidden="true">
          <Icon name="download" size={24} />
        </span>
        <div>
          <h2 id="about-storage">Where your progress is saved</h2>
          <p>
            Your answers and settings are saved only in this browser; there is no server or account that stores them. To back them up
            or move them to another device, export a file from the Progress page and import it there. Clearing this browser's site
            data removes them. Once the app has loaded, it also works offline.
          </p>
        </div>
      </section>

      <section class="about-block" aria-labelledby="about-open">
        <h2 id="about-open">Open source</h2>
        <p>
          Fallacy Forge is free and MIT licensed. All scenarios are fictional. The original quiz bank has automated validation
          and documented independent AI blind reviews. Repair exercises are checked separately; deduction answers are computed from every situation allowed by their facts.
        </p>
        <div class="about-actions">
          <ButtonLink href={REPO_URL} variant="secondary" icon="code" rel="noopener">
            Source on GitHub
          </ButtonLink>
          <ButtonLink href="#/" variant="ghost" iconRight="arrow-right">
            What is Fallacy Forge?
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
