# Content review: how the question bank was checked

Every one of the 304 questions was labelled **blind** by an independent reviewer who saw only the passage and the list of 38 fallacies. The reviewer never saw the intended answer, the explanation or the item id, because the ids give the answer away.

## Process
1. **Automated validation** (`npm run content`) checks:
   - the schema and length limits;
   - that every cue is an exact substring of its passage;
   - 8 items per fallacy (6 flawed with difficulties 1/1/2/2/3/3, plus 2 sound near-misses);
   - that `confusableWith` matches the canonical table.
2. **Blind review, round 1:** all 304 questions, anonymized as `q001…q304`, shuffled and split across two reviewers.
3. **Fix pass:** every disagreement, ambiguity or low-confidence item was rewritten. So were quality notes such as a giveaway, an unrealistic scenario, repeated templates and repeated character names.
4. **Blind review, round 2:** the 21 revised questions, mixed with 9 untouched decoys so the reviewer couldn't tell which were changed.
5. **Final editorial pass:** one question still ambiguous after round 2 (`itm_is_ought_05`) was rewritten and accepted after editorial review.

## Results
| Round | Scope | Agreement with intended label |
|---|---|---|
| 1 | 304 questions | **302 / 304 (99.3%)** |
| 2 | 21 revised + 9 decoys | **21 / 21 revised · 9 / 9 decoys** |

## Files
- `blind-input-A.json`, `blind-input-B.json`, `blind-input-R2.json`: exactly what the reviewers saw.
- `blind-review-A.json`, `blind-review-B.json`, `blind-review-R2.json`: their verdicts:
  - `sound` or `flawed`, with a top label and an optional runner-up;
  - confidence from 1 to 3;
  - flags and notes.
- `blind-key-round1.json`, `blind-key-round2.json`: the answer keys mapping each anonymized code to the real item. They were published only after the reviews were complete.

To reproduce the agreement numbers, match each review `q` to its key and compare the reviewer's verdict and label with the item's `isSound` and `fallacyId`. Round-1 verdicts were given on the original wording; items revised afterwards are covered by round 2.
