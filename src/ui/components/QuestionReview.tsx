import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import '../styles/question-review.css';
import { Button } from './Button';

/** Review is a view over answered questions; it never rewinds the live session. */
export function useQuestionReview(currentIndex: number, identity: unknown) {
  const [cursor, setCursor] = useState<{ identity: unknown; index: number } | null>(null);
  const index = cursor && cursor.identity === identity ? Math.min(cursor.index, currentIndex) : currentIndex;
  const reviewing = index < currentIndex;
  return {
    index,
    reviewing,
    previous: () => setCursor({ identity, index: Math.max(0, index - 1) }),
    next: () => setCursor(index + 1 < currentIndex ? { identity, index: index + 1 } : null),
    returnToCurrent: () => setCursor(null),
  };
}

type Review = ReturnType<typeof useQuestionReview>;

export function QuestionReview({ review, currentIndex, total }: { review: Review; currentIndex: number; total: number }): JSX.Element | null {
  if (currentIndex === 0) return null;
  return (
    <nav class="question-review" aria-label="Question navigation">
      <Button variant="ghost" size="sm" icon="arrow-left" disabled={review.index === 0} onClick={review.previous}>Previous</Button>
      <p class="question-review__status" aria-live="polite" aria-atomic="true">
        {review.reviewing ? `Reviewing ${review.index + 1} of ${total} · Read only` : 'Current question'}
      </p>
      {review.reviewing && <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={review.next}>Next</Button>}
    </nav>
  );
}
