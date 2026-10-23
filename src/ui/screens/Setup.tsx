import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { INTERESTS, type InterestId } from '../../engine/interests';
import type { StartingExperience } from '../../engine/starting';
import { cancelSetup, finishSetup, hasActivePractice, shouldOfferSetup, skipSetup } from '../../state/onboarding';
import { progress, storageOk } from '../../state/store';
import { Button } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { LogoMark } from '../components/Logo';
import { ThemeToggle } from '../components/Nav';
import '../styles/setup.css';

const TOPIC_COPY: Record<InterestId, { icon: IconName; description: string }> = {
  everyday: { icon: 'home', description: 'Life, shopping, health & more' },
  work: { icon: 'layers', description: 'Teams, decisions & workplace life' },
  tech: { icon: 'monitor', description: 'Technology, science & discovery' },
};
const STARTS: Array<{ id: StartingExperience; label: string; description: string }> = [
  { id: 'new', label: 'New to this', description: 'Start with straightforward examples.' },
  { id: 'some', label: 'Some experience', description: 'Give me a range of challenges.' },
  { id: 'comfortable', label: 'Comfortable', description: 'Start with subtler reasoning.' },
];

export function SetupScreen(): JSX.Element {
  const [step, setStep] = useState(1);
  const [interests, setInterests] = useState<InterestId[]>(() => [...progress.peek().settings.interests]);
  const [experience, setExperience] = useState<StartingExperience | null>(() => progress.peek().settings.startingExperience ?? null);
  const [returning] = useState(() => !shouldOfferSetup(progress.peek()) || hasActivePractice());
  const heading = useRef<HTMLHeadingElement>(null);
  const preserve = hasActivePractice();

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [step]);

  const toggle = (id: InterestId) => setInterests((current) => current.includes(id)
    ? current.filter((chosen) => chosen !== id) : [...current, id]);

  return (
    <div class="setup">
      <header class="setup__header">
        <a class="setup__brand" href="#/welcome" aria-label="About Fallacy Forge">
          <LogoMark size={36} /><span>Fallacy Forge</span>
        </a>
        <div class="setup__header-actions">
          <ThemeToggle />
          <button type="button" class="setup__exit" onClick={returning ? cancelSetup : skipSetup}>{returning ? 'Cancel' : 'Skip setup'}</button>
        </div>
      </header>

      <div class="setup__layout">
        <aside class="setup__intro" aria-label="Welcome to Fallacy Forge">
          <span class="setup__eyebrow">A little curiosity goes a long way.</span>
          <p class="setup__statement">Your interests.<br /><span>A sharper eye.</span></p>
          <p class="setup__intro-copy">A few minutes to explore ideas, question assumptions, and see arguments more clearly.</p>
          <div class="setup__illustration" aria-hidden="true"><LogoMark size={180} /><i /><i /></div>
          <p class="setup__promise"><Icon name="check" size={16} /> No account. Your choices stay on this device.</p>
        </aside>

        <section class="setup__panel" aria-labelledby="setup-heading">
          <div class="setup__progress">
            <span>Step {step} of 2</span>
            <div aria-hidden="true"><i class="is-filled" /><i class={step === 2 ? 'is-filled' : ''} /></div>
          </div>
          <h1 id="setup-heading" class="setup__heading" ref={heading} tabIndex={-1}>{step === 1 ? 'What interests you?' : 'How would you like to start?'}</h1>
          <p class="setup__sub">{step === 1 ? 'Choose a few, or mix everything.' : 'Optional. For your first five questions.'}</p>

          {step === 1 ? (
            <fieldset class="setup__options">
              <legend class="sr-only">Your interests</legend>
              {INTERESTS.map((interest) => (
                <label class={`setup__choice ${interests.includes(interest.id) ? 'is-selected' : ''}`} key={interest.id}>
                  <input type="checkbox" aria-label={interest.label} checked={interests.includes(interest.id)} onChange={() => toggle(interest.id)} />
                  <span class="setup__choice-icon" aria-hidden="true"><Icon name={TOPIC_COPY[interest.id].icon} size={24} /></span>
                  <span class="setup__choice-copy"><strong>{interest.label}</strong><small>{TOPIC_COPY[interest.id].description}</small></span>
                  <span class="setup__check" aria-hidden="true"><Icon name="check" size={16} /></span>
                </label>
              ))}
              <button type="button" class={`setup__mix ${interests.length === 0 ? 'is-selected' : ''}`} aria-pressed={interests.length === 0} onClick={() => setInterests([])}>
                <Icon name="layers" size={18} /> Mix everything <span>{interests.length === 0 ? 'Selected' : 'All topics'}</span>
              </button>
            </fieldset>
          ) : (
            <fieldset class="setup__options">
              <legend class="sr-only">Starting experience</legend>
              {STARTS.map((choice) => (
                <label class={`setup__choice setup__choice--experience ${experience === choice.id ? 'is-selected' : ''}`} key={choice.id}>
                  <input type="radio" aria-label={choice.label} name="starting-experience" value={choice.id} checked={experience === choice.id} onChange={() => setExperience(choice.id)} />
                  <span class="setup__choice-copy"><strong>{choice.label}</strong><small>{choice.description}</small></span>
                  <span class="setup__check setup__check--radio" aria-hidden="true"><i /></span>
                </label>
              ))}
              <button type="button" class={`setup__mix ${experience === null ? 'is-selected' : ''}`} aria-pressed={experience === null} onClick={() => setExperience(null)}>
                Let the app choose <span>{experience === null ? 'Selected' : 'A gentle mix'}</span>
              </button>
            </fieldset>
          )}

          <p class="setup__note">{step === 1 ? 'Familiar examples, with a mix of reasoning skills.' : preserve ? 'Your current set stays intact. New choices apply next time.' : 'We’ll adjust with practice. This isn’t a level test.'}</p>
          <div class="setup__actions">
            {step === 2 && <Button variant="ghost" icon="arrow-left" onClick={() => setStep(1)}>Back</Button>}
            <Button variant="primary" size="lg" iconRight="arrow-right" onClick={() => step === 1 ? setStep(2) : finishSetup({ interests, experience })}>
              {step === 1 ? 'Continue' : preserve ? 'Save and return' : 'Start 5 questions'}
            </Button>
          </div>
          <p class="setup__footnote">Change your choices anytime in Practice.</p>
          <p class="setup__privacy">No account. Choices stay on this device.</p>
          {!storageOk.value && <p class="setup__save-notice" role="status">You can continue, but this browser could not save your choices.</p>}
        </section>
      </div>
    </div>
  );
}
