# Fallacy Forge — Content spec (the question bank)

Content is the product. A beautiful app with obvious or wrong questions is worthless.

## 1. Canonical fallacy list (38 fallacies in 6 families)
IDs are final. `content/source/fallacies.v1.json` is OLD reference material: reuse good definitions and tips, but it has duplicates and mislabels.

| Family id | Label | Fallacy id | Confusable with (first = closest) |
|---|---|---|---|
| distraction | Attacks & distractions | fal_ad_hominem | fal_tu_quoque, fal_guilt_by_association, fal_genetic_fallacy |
| distraction | | fal_tu_quoque (aka Whataboutism, Appeal to hypocrisy) | fal_ad_hominem, fal_red_herring |
| distraction | | fal_guilt_by_association | fal_ad_hominem, fal_genetic_fallacy |
| distraction | | fal_genetic_fallacy | fal_ad_hominem, fal_guilt_by_association |
| distraction | | fal_red_herring | fal_straw_man, fal_tu_quoque |
| distraction | | fal_straw_man | fal_red_herring, fal_false_dichotomy |
| emotion | Emotional appeals | fal_appeal_to_emotion | fal_appeal_to_pity, fal_appeal_to_fear |
| emotion | | fal_appeal_to_pity | fal_appeal_to_emotion, fal_red_herring |
| emotion | | fal_appeal_to_fear (aka Fear-mongering) | fal_slippery_slope, fal_appeal_to_emotion |
| emotion | | fal_appeal_to_consequences (aka Wishful thinking) | fal_appeal_to_emotion, fal_slippery_slope |
| appeals | Crowds, authority & tradition | fal_appeal_to_authority | fal_bandwagon, fal_genetic_fallacy |
| appeals | | fal_bandwagon (aka Appeal to popularity, Ad populum) | fal_appeal_to_authority, fal_appeal_to_tradition |
| appeals | | fal_appeal_to_tradition | fal_appeal_to_nature, fal_bandwagon |
| appeals | | fal_appeal_to_nature | fal_appeal_to_tradition, fal_is_ought |
| evidence | Cause & evidence | fal_false_cause (aka Correlation ≠ causation, Cum hoc) | fal_post_hoc, fal_texas_sharpshooter |
| evidence | | fal_post_hoc | fal_false_cause, fal_anecdotal_evidence |
| evidence | | fal_slippery_slope | fal_appeal_to_fear, fal_false_cause |
| evidence | | fal_hasty_generalization | fal_anecdotal_evidence, fal_composition |
| evidence | | fal_anecdotal_evidence | fal_hasty_generalization, fal_cherry_picking |
| evidence | | fal_cherry_picking (aka Suppressed evidence) | fal_texas_sharpshooter, fal_hasty_generalization |
| evidence | | fal_texas_sharpshooter | fal_cherry_picking, fal_false_cause |
| evidence | | fal_gamblers_fallacy | fal_false_cause, fal_hasty_generalization |
| framing | Framing & assumptions | fal_false_dichotomy (aka False dilemma) | fal_middle_ground, fal_loaded_question |
| framing | | fal_loaded_question | fal_false_dichotomy, fal_circular_reasoning |
| framing | | fal_circular_reasoning (aka Begging the question) | fal_loaded_question, fal_no_true_scotsman |
| framing | | fal_middle_ground (aka Argument to moderation) | fal_false_dichotomy, fal_false_equivalence |
| framing | | fal_false_equivalence | fal_false_analogy, fal_middle_ground |
| framing | | fal_false_analogy | fal_false_equivalence, fal_composition |
| framing | | fal_special_pleading | fal_no_true_scotsman, fal_moving_the_goalposts |
| framing | | fal_no_true_scotsman | fal_special_pleading, fal_moving_the_goalposts |
| framing | | fal_moving_the_goalposts | fal_no_true_scotsman, fal_special_pleading |
| framing | | fal_burden_of_proof (shifting the burden) | fal_appeal_to_ignorance, fal_moving_the_goalposts |
| framing | | fal_appeal_to_ignorance | fal_burden_of_proof, fal_false_dichotomy |
| framing | | fal_sunk_cost | fal_appeal_to_tradition, fal_appeal_to_consequences |
| language | Language & parts | fal_equivocation | fal_straw_man, fal_false_analogy |
| language | | fal_composition | fal_division, fal_hasty_generalization |
| language | | fal_division | fal_composition, fal_hasty_generalization |
| language | | fal_is_ought (aka Naturalistic fallacy, is–ought gap) | fal_appeal_to_nature, fal_appeal_to_tradition |

Fallacy difficulty labels:
- **beginner:** ad hominem, straw man, false dichotomy, appeal to authority, bandwagon, slippery slope, hasty generalization, appeal to emotion, appeal to fear, red herring, anecdotal evidence.
- **advanced:** equivocation, special pleading, burden of proof, no true scotsman, texas sharpshooter, appeal to consequences, is-ought, division.
- **intermediate:** everything else.

## 2. Files and schemas
Authors write one pair of files per fallacy. Do not write anywhere else.

### `content/fallacies/<fallacy_id>.json` (one object)
```json
{
  "id": "fal_ad_hominem",
  "name": "Ad Hominem",
  "aliases": ["Personal attack"],
  "family": "distraction",
  "difficulty": "beginner",
  "shortDef": "Attacking the person instead of their argument.",
  "definition": "Rejecting a claim because of who makes it (their character, motives or traits) instead of engaging with the reasons or evidence.",
  "howToSpot": ["Is the reply about the person or the point?", "Would the rebuttal still work if someone else made the claim?", "Insults or motives used in place of counter-evidence"],
  "classicExample": "Don't listen to her climate argument; she flies all the time.",
  "legitimateVersion": "Pointing out a real conflict of interest is fair when we're relying on someone's testimony, but it's a reason to check the evidence, not to reject the claim.",
  "confusableWith": ["fal_tu_quoque", "fal_guilt_by_association", "fal_genetic_fallacy"],
  "contrast": {
    "fal_tu_quoque": "Ad hominem attacks the person's character; tu quoque deflects by saying they do it too.",
    "fal_guilt_by_association": "Ad hominem targets the person; guilt by association targets who they're linked with.",
    "fal_genetic_fallacy": "Ad hominem targets a person; the genetic fallacy dismisses a claim by its origin or history."
  }
}
```
Limits:
- `shortDef`: 80 characters or less.
- `definition`: 260 or less.
- `howToSpot`: exactly 3 tips, 90 or less each.
- `classicExample`: 160 or less.
- `legitimateVersion`: 220 or less. When does a similar-looking move become fair?
- `confusableWith`: exactly the table above.
- `contrast`: one entry per confusable, 160 or less each.

### `content/items/<fallacy_id>.json` (array of exactly 8 items)
6 flawed items labelled with this fallacy, plus 2 sound near-misses that resemble this fallacy.
```json
{
  "id": "itm_ad_hominem_01",
  "fallacyId": "fal_ad_hominem",
  "isSound": false,
  "resembles": null,
  "difficulty": 2,
  "format": "chat",
  "source": "Team chat · #budget",
  "title": null,
  "passage": "Priya: The vendor quote is 30% above market; I attached three comparables.\nMarcus: Priya's been here four months. I don't think she gets how we do things.",
  "cue": "Priya's been here four months",
  "explanation": "Marcus dismisses the cost evidence by pointing to Priya's short tenure instead of answering the comparables.",
  "whyNot": { "fal_genetic_fallacy": "It's not about where the claim came from historically; it's a jab at the person making it." },
  "tags": ["workplace", "money"],
  "backgroundKnowledge": "general"
}
```
Sound near-miss: `"isSound": true, "fallacyId": null, "resembles": "fal_ad_hominem"`, ids `itm_snd_<slug>_01` and `_02`, where `<slug>` is the fallacy id without `fal_`. `whyNot` has exactly one key, the `resembles` id, explaining why it is NOT that fallacy.

Field rules:
- `difficulty`: 1, 2 or 3. Each fallacy's 6 flawed items have exactly two of each. Sound items are 2 or 3.
- `format`: one of
  - `post`: social media. `source` is display name plus handle, for example "Jordan Lee · @jordanlifts".
  - `email`: `source` is the sender, `title` the subject.
  - `chat`: `source` is the channel or group name; `passage` lines are "Name: text", separated by `\n`, 2–4 lines.
  - `headline`: `source` is a fictional outlet, `title` the headline, `passage` the standfirst.
  - `ad`: `source` is a fictional brand, `title` the ad headline.
  - `review`: `source` is the reviewer name, `title` the review title.
  - `speech`: `source` is the speaker and setting, for example "Councillor Ames · Riverside town hall".
  - `quote`: an overheard or spoken remark; `source` is the speaker and context.
- `title`: required for email, headline, ad and review (70 characters or less); otherwise null.
- `passage`: 140–420 characters (chats count all lines). Normal surrounding sentences, not just the fallacy.
- `cue`: an EXACT verbatim substring of `passage` (case and punctuation included), 3–20 words.
  - Flawed items: the flawed move.
  - Sound items: the move that keeps it legitimate.
- `explanation`: 240 characters or less, plain language, says why it is this fallacy (or why it is sound).
- `whyNot`: exactly 1 key. For flawed items, normally the closest confusable; it must be a fallacy id. 180 characters or less.
- `tags`: 1–3 of: everyday, workplace, school, health, fitness, food, money, tech, science, sports, parenting, local-news, shopping, travel, media, environment, housing.
- `backgroundKnowledge`: separate from reasoning difficulty. `general` means ordinary language with all necessary facts supplied; `explained` means a domain term appears but its relevant meaning is supplied; `specialist` means outside expertise is still needed. Adaptive Practice and Focus exclude specialist items. Legacy fixtures may omit this field; every shipped item must carry a reviewed label. Never infer a label from the topic or difficulty alone.

Familiar topics are soft preferences after the chosen reasoning skill, difficulty and freshness. Everyday life covers the existing tags except workplace, tech and science; Work matches workplace; Technology matches tech and science. A preference must never remove a skill from practice. Keep IDs stable when simplifying wording so saved history continues to refer to the same exercise. A no-penalty replacement keeps the verdict and difficulty, prefers the same skill, and may use a different skill when the collection has no unused match.

## 3. Writing standard (what "good" means)
1. **Realism first.** It must sound like something a real person would post, say or write. Vary the voice: casual posts, polite emails, punchy ads, earnest speeches.
2. **The flaw is embedded.** Surround the fallacious move with ordinary, often reasonable sentences. The cue should be a fraction of the passage.
3. **Never give it away.**
   - Never use the fallacy's name or its stock phrase as a crutch. "Everyone knows" may appear at most once across all bandwagon items.
   - Vary the wording across the 6 items.
   - Do not end with an obvious "therefore <absurd conclusion>" every time.
4. **One primary fallacy per flawed item.** No stacking. An expert should agree on the label.
5. **Difficulty:**
   - 1 = textbook move in realistic dress.
   - 2 = mixed with legitimate points.
   - 3 = subtle and plausible; the closest confusable is tempting, but the label is still defensible.
6. **Sound near-misses are real arguments** (premises leading to a conclusion), genuinely reasonable, and superficially similar to the target. Examples:
   - citing the consensus of relevant experts within their field (vs appeal to authority);
   - flagging a conflict of interest as a reason to check the data (vs ad hominem);
   - a consequence chain where each step is supported (vs slippery slope);
   - a large representative sample (vs hasty generalization).

   An instruction, proposal or bare opinion is NOT an argument and must not be used.
7. **Fiction and neutrality:**
   - Fictional people (diverse names), companies, products, towns and outlets only. No real public figures, brands, parties or organisations.
   - No partisan hot-button topics: no abortion, guns, immigration, elections, specific religions, or real wars.
   - Local-council, workplace, school, consumer, health-claim and science-news topics are great.
8. **Variety per fallacy:** across its 6 flawed items, at least 4 different formats and at least 4 different topics.
9. **Accuracy:** no false health or science advice presented as true in sound items. Flawed items may contain dubious claims; that's the point.
10. US English spelling. No slurs, violence or sexual content. Mild humor is welcome.
11. **Explanations** speak to the learner kindly and specifically ("Marcus dismisses…"), not generically ("This is an ad hominem because…").

## 4. Validation (automated, `npm run content`)
`scripts/validate-content.mjs` must fail the build on any of:
- schema or limit violations;
- duplicate ids;
- an unknown `fallacyId`, `resembles` or `whyNot` key;
- a `cue` that is not a substring of `passage`;
- a fallacy without exactly 8 items (6 flawed with difficulties 2/2/2, and 2 sound);
- `confusableWith` that differs from section 1;
- a `title` missing where required.

It also prints distribution stats: formats, tags, difficulty, and passage length percentiles.

## 5. Blind review (independent agent)
The reviewer sees only `format`, `source`, `title` and `passage`, plus the list of 38 fallacies with their `shortDef`. For each item it answers: sound or flawed; if flawed, top-1 fallacy plus an optional runner-up; confidence 1–3; and flags.

Flags:
- `giveaway`: too obvious or names the fallacy;
- `ambiguous`: two labels equally defensible;
- `not_argument`: for sound items;
- `stacked`: several fallacies;
- `inaccurate`;
- `sensitive`;
- `unrealistic`.

The output goes to `content/review/blind-review.json`. Any item whose label disagrees with the reviewer's top-1, or that is flagged ambiguous, not_argument, stacked, inaccurate or sensitive, must be rewritten (and re-reviewed) or replaced. Target: 90% or more agreement after fixes, and zero open flags.
