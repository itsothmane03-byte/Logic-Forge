import type { JSX } from 'preact';
import { APP_VERSION, AUTHOR, REPO_URL } from '../../config';
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
        <p class="lead">A five-minute daily practice for reading arguments more sharply. Version {APP_VERSION}.</p>
      </header>

      <section class="about-block" aria-labelledby="about-what">
        <h2 id="about-what">What's a fallacy?</h2>
        <p>
          A fallacy is a flaw in reasoning: a move that makes an argument feel convincing without actually supporting its
          conclusion. Fallacies hide in ordinary posts, emails and headlines, usually next to perfectly reasonable sentences.
          Learning to name them helps you notice when you're being persuaded by something other than good reasons.
        </p>
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

      <section class="about-block about-block--privacy" aria-labelledby="about-privacy">
        <span class="about-block__icon" aria-hidden="true">
          <Icon name="shield" size={24} />
        </span>
        <div>
          <h2 id="about-privacy">Your progress never leaves this browser.</h2>
          <p>
            No accounts, no analytics, no network calls. Everything is stored locally on your device; you can export it or reset
            it from the Progress page.
          </p>
        </div>
      </section>

      <section class="about-block" aria-labelledby="about-open">
        <h2 id="about-open">Open source</h2>
        <p>
          Fallacy Forge is free and MIT licensed. Every question is fictional, checked by an automated validator, and labeled in
          a blind review before it ships. Built by {AUTHOR}.
        </p>
        <div class="about-actions">
          <ButtonLink href={REPO_URL} variant="secondary" icon="code" rel="noopener">
            Source on GitHub
          </ButtonLink>
          <ButtonLink href="#/welcome" variant="ghost" iconRight="arrow-right">
            What is Fallacy Forge?
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
