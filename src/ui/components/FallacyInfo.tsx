// Shared fallacy reference content (detail page and the in-session side sheet).

import type { ComponentChildren, JSX } from 'preact';
import type { Fallacy } from '../../engine/types';
import { fallacyById, fallacyName } from '../../state/store';
import { Icon } from './Icon';
import { Reveal } from './Primitives';

interface Props {
  fallacy: Fallacy;
  level?: 2 | 3;
  linkConfusables?: boolean;
  reveal?: boolean;
}

function Block({ reveal, class: className, children }: { reveal: boolean; class: string; children: ComponentChildren }) {
  return reveal ? (
    <Reveal as="section" class={className}>
      {children}
    </Reveal>
  ) : (
    <section class={className}>{children}</section>
  );
}

export function FallacyInfo({ fallacy, level = 2, linkConfusables = true, reveal = false }: Props): JSX.Element {
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <div class="fallacy-info">
      <Block reveal={reveal} class="info-block">
        <H class="info-block__title">Definition</H>
        <p class="info-definition">{fallacy.definition}</p>
      </Block>

      <Block reveal={reveal} class="info-block">
        <H class="info-block__title">How to spot it</H>
        <ol class="tips">
          {fallacy.howToSpot.map((tip, i) => (
            <li key={tip} class="tips__item">
              <span class="tips__n" aria-hidden="true">
                {i + 1}
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ol>
      </Block>

      <Block reveal={reveal} class="info-block">
        <H class="info-block__title">Classic example</H>
        <blockquote class="example-card">
          <span class="example-card__mark" aria-hidden="true">
            “
          </span>
          <p>{fallacy.classicExample}</p>
        </blockquote>
      </Block>

      <Block reveal={reveal} class="info-block">
        <div class="legit">
          <span class="legit__icon" aria-hidden="true">
            <Icon name="scale" size={22} />
          </span>
          <div>
            <H class="info-block__title legit__title">When it's legitimate</H>
            <p>{fallacy.legitimateVersion}</p>
          </div>
        </div>
      </Block>

      <Block reveal={reveal} class="info-block">
        <H class="info-block__title">Don't confuse with</H>
        <ul class="contrast-grid">
          {fallacy.confusableWith.map((id) => {
            const linked = linkConfusables && fallacyById.has(id);
            return (
              <li key={id} class="contrast-card">
                <p class="contrast-card__name">
                  <Icon name="swap" size={18} />
                  {linked ? (
                    <a href={`#/library/${id}`} class="contrast-card__link">
                      {fallacyName(id)}
                    </a>
                  ) : (
                    <span>{fallacyName(id)}</span>
                  )}
                </p>
                <p class="contrast-card__text">{fallacy.contrast[id]}</p>
              </li>
            );
          })}
        </ul>
      </Block>
    </div>
  );
}
