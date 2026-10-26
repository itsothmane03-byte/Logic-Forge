// About (#/about): the same printed set as Home. A short card on the field,
// then the reference text beside the name's picture and the plain facts.

import type { JSX } from 'preact';
import { APP_VERSION, REPO_URL } from '../../config';
import { logicItems } from '../../data/logic';
import { repairs } from '../../data/repairs';
import { bank } from '../../state/store';
import { SQUARE, FORGE, type ArchivePicture } from '../archive';
import { ButtonLink } from '../components/Button';
import { LogoMark } from '../components/Logo';
import { Diamond } from './Welcome';

const PICTURES: readonly ArchivePicture[] = [FORGE, SQUARE];

export function AboutScreen(): JSX.Element {
  return (
    <div class="home about">
      <section class="home-hero about-hero" aria-labelledby="about-title">
        <div class="home-hero__sheet about-hero__sheet">
          <LogoMark size={56} class="home-hero__eye" />
          <h1 id="about-title" class="about-hero__title" tabIndex={-1}>
            About Fallacy Forge
          </h1>
          <p class="home-hero__lede">Short activities for clearer thinking, free and open source.</p>
          <p class="home-hero__details">
            <span>Version {APP_VERSION}</span>
            <Diamond />
            <span>MIT license</span>
            <Diamond />
            <span>No accounts</span>
          </p>
        </div>
      </section>

      <div class="about-body">
        <aside class="about-aside" aria-label="The name and the numbers">
          <figure class="about-figure" data-reveal>
            <img src={FORGE.src} width={FORGE.width} height={FORGE.height} alt={FORGE.alt} loading="lazy" decoding="async" />
            <figcaption>{FORGE.caption} Arguments get the same treatment here.</figcaption>
          </figure>
          <dl class="about-facts" data-reveal style={{ '--reveal-i': '1' }}>
            <div>
              <dt>Quiz questions</dt>
              <dd>{bank.items.length}</dd>
            </div>
            <div>
              <dt>Fallacies</dt>
              <dd>{bank.fallacies.length}</dd>
            </div>
            <div>
              <dt>Repair exercises</dt>
              <dd>{repairs.length}</dd>
            </div>
            <div>
              <dt>Deduction puzzles</dt>
              <dd>{logicItems.length}</dd>
            </div>
          </dl>
        </aside>

        <div class="about-text">
          <section data-reveal aria-labelledby="about-what">
            <h2 id="about-what">What's a fallacy?</h2>
            <p>
              A fallacy is a flaw in reasoning: a move that makes an argument feel convincing without actually supporting its
              conclusion. Fallacies hide in ordinary posts, emails and headlines, usually next to perfectly reasonable sentences.
              Learning to name them helps you notice when you're being persuaded by something other than good reasons.
            </p>
          </section>

          <section data-reveal aria-labelledby="about-activities">
            <h2 id="about-activities">Three ways to practice</h2>
            <p>
              <strong>Spot the flaw</strong> asks whether an argument holds up and, if it does not, which fallacy it contains.{' '}
              <strong>Fix the argument</strong> asks you to choose a revision that addresses the problem: better evidence, a fairer
              claim, or a missing assumption made clear.
            </p>
            <p>
              <strong>What follows?</strong> gives you a few facts and a claim. Decide whether the claim must be true, must be false,
              or could be either. Treat the facts as given; everyday likelihood is a different question.
            </p>
            <p>Repair and deduction scores save separately from quiz mastery. A stronger argument can still need more evidence.</p>
          </section>

          <section data-reveal aria-labelledby="about-scoring">
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
              Each of the {bank.fallacies.length} fallacies has its own box from 1 to 5. A correct answer moves it up one box, a right
              instinct moves it down one, and a miss sends it back to box 1. Practice shows low-box fallacies more often, so your
              mistakes come back sooner. Box 5 means mastered.
            </p>
          </section>

          <section data-reveal aria-labelledby="about-storage">
            <h2 id="about-storage">Where your progress is saved</h2>
            <p>
              Your answers and settings are saved only in this browser; there is no server or account that stores them. To back them
              up or move them to another device, export a file from the Progress page and import it there. Clearing this browser's
              site data removes them. Once the app has loaded, it also works offline.
            </p>
          </section>

          <section data-reveal aria-labelledby="about-open">
            <h2 id="about-open">Open source</h2>
            <p>
              Fallacy Forge is free and MIT licensed. All scenarios are fictional. The original quiz bank has automated validation
              and documented independent AI blind reviews. Repair exercises are checked separately; deduction answers are computed
              from every situation allowed by their facts.
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

          <section data-reveal aria-labelledby="about-credits">
            <h2 id="about-credits">Picture credits</h2>
            <ul class="about-credits">
              {PICTURES.map((picture) => (
                <li key={picture.src}>
                  {picture.alt} {picture.credit},{' '}
                  <a href={picture.licenseUrl} rel="noopener">
                    {picture.license}
                  </a>
                  ,{' '}
                  <a href={picture.source} rel="noopener">
                    source
                  </a>
                  .
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
