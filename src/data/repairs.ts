// "Fix the argument" exercises: fictional, everyday arguments, each with three
// rewrites and exactly one strongest repair. Authoring rules:
// - the strongest repair fixes the reasoning (narrows the claim, asks for the
//   missing evidence, answers the real point), not just the tone;
// - the other two stay plausible: a politer version with the same flaw, or one
//   that swaps in a different fallacy;
// - options stay close in length, and the strongest is not always the longest;
// - a repair makes a claim fair to check; never say it proves the claim.
// Option order is shuffled at runtime (see repairOptions).

import type { RepairItem } from '../engine/repair';

export const repairs: RepairItem[] = [
  {
    id: 'rep_cookbook',
    title: 'The cookbook',
    fallacyId: 'fal_hasty_generalization',
    passage: "I've made two recipes from this cookbook and both flopped. The whole book is useless, so don't waste your money on it.",
    principle: 'Make the claim only as big as the evidence behind it.',
    options: [
      {
        id: 'a',
        text: "Both recipes I tried from this cookbook flopped. When two out of two fail, the problem is clearly the book, so I'd skip buying it.",
        correct: false,
        explanation: "\"Two out of two\" sounds like data, but it's still only two recipes. The conclusion covers the whole book, and two tries can't carry that much weight.",
      },
      {
        id: 'b',
        text: "Both recipes I tried from this cookbook flopped, but two is too few to judge a whole book. I'll try more before deciding.",
        correct: true,
        explanation: 'It keeps the real evidence, two failed recipes, and sizes the conclusion to match. The book may still disappoint, but now the verdict waits for a fair test.',
      },
      {
        id: 'c',
        text: "Both recipes I tried flopped, and my sister says it's the worst cookbook she owns, so the whole thing really is a waste of money.",
        correct: false,
        explanation: "One more opinion barely grows the sample, and the conclusion still covers every recipe in the book. It's still a big claim resting on a few experiences.",
      },
    ],
  },
  {
    id: 'rep_standing_desks',
    title: 'The standing desks',
    fallacyId: 'fal_post_hoc',
    passage: 'We got standing desks in March, and in April the team shipped twice as many features. The desks clearly made us more productive.',
    principle: '"After" is a clue, not a cause. Check what else changed.',
    options: [
      {
        id: 'a',
        text: 'It might be a coincidence, but we got standing desks in March and shipped twice as much in April, so the desks probably did it.',
        correct: false,
        explanation: "The hedge sounds careful, but the reasoning hasn't changed: the desks get the credit only because the jump came after them. \"Probably\" adds no evidence.",
      },
      {
        id: 'b',
        text: 'We got standing desks in March and shipped more in April. Plenty of top tech firms use standing desks, so they must really boost output.',
        correct: false,
        explanation: "Other firms buying desks may be a reason to investigate, but it does not establish what caused this team's April jump.",
      },
      {
        id: 'c',
        text: "We got standing desks in March and shipped more in April. Before crediting them, let's check what else changed and how other teams did.",
        correct: true,
        explanation: "It treats the timing as a clue, not a verdict, and names the missing evidence: other changes that month and teams without the desks. That's how you'd test it.",
      },
    ],
  },
  {
    id: 'rep_snack_budget',
    title: 'The snack budget',
    fallacyId: 'fal_ad_hominem',
    passage: "Marco wants to cut the team snack budget to pay for a coffee machine? He can't even keep his own desk clean. I'm not taking budget advice from him.",
    principle: 'Judge the plan, not the person proposing it.',
    options: [
      {
        id: 'a',
        text: "Marco wants to cut the snack budget to pay for a coffee machine. I'd like to see his numbers first: do the savings actually cover it?",
        correct: true,
        explanation: "It drops the jab about Marco's desk and tests the plan itself: do the numbers work? The plan could still fall short, but now it's judged on its merits.",
      },
      {
        id: 'b',
        text: "I like Marco, but he can't keep his own desk clean, so I'm not sure he's the right person to plan how our team spends its budget.",
        correct: false,
        explanation: 'Kinder wording, same move. A messy desk says nothing about whether the budget numbers add up, so the plan itself still goes unexamined.',
      },
      {
        id: 'c',
        text: "Before we agree to anything, think it through: if we let Marco cut snacks now, next he'll go after team lunches and the holiday party too.",
        correct: false,
        explanation: "This leaves Marco's desk alone but jumps to a slippery slope. Nothing suggests trimming snacks leads to cutting lunches, and the plan's numbers still go unchecked.",
      },
    ],
  },
  {
    id: 'rep_meeting_cap',
    title: 'The shorter meeting',
    fallacyId: 'fal_straw_man',
    passage: 'Priya wants to cap our weekly meeting at 30 minutes. So she thinks we should just stop talking to each other? Good luck running a team with zero communication.',
    principle: 'Restate the other view fairly before you push back.',
    options: [
      {
        id: 'a',
        text: 'With respect, capping our meeting at 30 minutes basically means we stop communicating as a team, and no team can work that way.',
        correct: false,
        explanation: "Still a straw man. A 30-minute cap isn't \"no communication.\" Polite phrasing doesn't fix arguing against a position Priya never took.",
      },
      {
        id: 'b',
        text: "Priya wants a 30-minute cap, but she's only been here six months, so she can't really know how much time this team needs to talk.",
        correct: false,
        explanation: "This stops exaggerating her idea but goes after her instead. How long Priya has worked here doesn't show whether a shorter meeting would work.",
      },
      {
        id: 'c',
        text: "Priya wants to cap our weekly meeting at 30 minutes. My worry is that project updates won't fit. Could we try it for a month?",
        correct: true,
        explanation: "It states Priya's actual proposal, raises a specific concern and suggests a way to test it. Her idea might still not work, but it's judged as she said it.",
      },
    ],
  },
  {
    id: 'rep_group_project',
    title: 'The group project',
    fallacyId: 'fal_false_dichotomy',
    passage: "Either we stay up all night and finish the whole project tonight, or we fail the class. There's no other way.",
    principle: 'Before choosing between two options, check whether there are more.',
    options: [
      {
        id: 'a',
        text: "Realistically, it's an all-nighter tonight or a failing grade. Those are the only two choices we have left, so let's get started.",
        correct: false,
        explanation: "Same false choice, said more calmly. Calling it realistic isn't a reason there are only two options; the others simply never get checked.",
      },
      {
        id: 'b',
        text: "We could stay up tonight, or we could split what's left, ask for a short extension, or hand in what's done. Which works best for us?",
        correct: true,
        explanation: 'It keeps the all-nighter on the table but restores the options the original hid: splitting the work, asking for time or handing in part. Now they can be compared.',
      },
      {
        id: 'c',
        text: "It's an all-nighter or we fail. Every other group in our section is staying up tonight, so clearly that's the only way to pass.",
        correct: false,
        explanation: "Still only two options, now propped up by what other groups are doing. Their plans don't make an all-nighter the only way to pass.",
      },
    ],
  },
  {
    id: 'rep_late_homework',
    title: 'The late homework',
    fallacyId: 'fal_slippery_slope',
    passage: 'If we let one student hand in homework a day late, soon everyone will, deadlines will mean nothing, and the whole class will fall apart.',
    principle: 'Check each step of a predicted chain instead of assuming the slide.',
    options: [
      {
        id: 'a',
        text: "It won't happen overnight, but one late paper will likely lead to everyone handing work in late, and then deadlines mean nothing.",
        correct: false,
        explanation: 'The hedge slows the slide down but keeps it. Each step, from one late paper to deadlines meaning nothing, still has no support.',
      },
      {
        id: 'b',
        text: "We shouldn't allow late homework. Ms. Okafor has taught for twenty years without ever allowing it, and her classes run just fine.",
        correct: false,
        explanation: "This drops the chain of disasters for one teacher's habit. Her classes running fine without late work doesn't show that allowing it would cause harm.",
      },
      {
        id: 'c',
        text: 'If we allow late work, a few more students may ask. One late pass per term, checked after a month, would show whether deadlines slip.',
        correct: true,
        explanation: 'It treats more requests as a possibility to check and proposes a limited policy with a review, rather than assuming the whole chain will happen.',
      },
    ],
  },
  {
    id: 'rep_laptop_pick',
    title: 'The laptop pick',
    fallacyId: 'fal_appeal_to_authority',
    passage: 'Lena Park is a three-time national swimming champion, and she says the Coastline 5 is the best laptop for students. That settles it.',
    principle: 'Trust expertise on its own subject, and ask what evidence it rests on.',
    options: [
      {
        id: 'a',
        text: "Lena Park isn't a tech expert, but she's famously careful, so if she calls the Coastline 5 the best, that's good enough for me.",
        correct: false,
        explanation: "Admitting she isn't an expert, then trusting her anyway, keeps the same flaw. Being careful in the pool isn't evidence about laptops.",
      },
      {
        id: 'b',
        text: "Lena Park likes the Coastline 5, but swimming isn't laptop testing. Independent reviews of battery life and price would tell us more.",
        correct: true,
        explanation: "It sets aside expertise that doesn't apply and looks for evidence that does: independent tests of what students need. The laptop may still be great; now that's checkable.",
      },
      {
        id: 'c',
        text: "Let's just get the Coastline 5. It's the top seller at the campus store, and nearly everyone in my dorm has one, so it must be the best.",
        correct: false,
        explanation: "This swaps one shortcut for another. Sales and dorm popularity show the laptop is common, not that it's the best fit for students.",
      },
    ],
  },
  {
    id: 'rep_study_app',
    title: 'The study app',
    fallacyId: 'fal_bandwagon',
    passage: 'Everyone in our year uses CueCrate to study, so it must be the best way to prepare for exams.',
    principle: "Popularity alone doesn't establish which method works best.",
    options: [
      {
        id: 'a',
        text: "Before deciding, let's check CueCrate's advert: it promises higher scores, so there's no need to compare other study methods.",
        correct: false,
        explanation: 'An advertising promise alone does not establish that a study method is best. The comparison still needs evidence that can be checked.',
      },
      {
        id: 'b',
        text: "Many classmates use CueCrate. I'd compare independent studies of learning outcomes and other methods before calling it the best.",
        correct: true,
        explanation: 'It asks for relevant evidence and a comparison with other methods. How common an app is can prompt a closer look, but does not settle which method works best.',
      },
      {
        id: 'c',
        text: "It's not just hype: practically our whole year uses CueCrate to study, and that many students can't all be wrong about how to prepare.",
        correct: false,
        explanation: 'A large following does not by itself show that a method is effective or better than the alternatives. The claim needs evidence about learning.',
      },
    ],
  },
  {
    id: 'rep_old_car',
    title: 'The old car',
    fallacyId: 'fal_sunk_cost',
    passage: "We've already spent $3,000 fixing this old car. If we sell it now, all that money is wasted, so we have to keep repairing it.",
    principle: "Decide on what's ahead, not on what's already spent.",
    options: [
      {
        id: 'a',
        text: 'The $3,000 is gone whether we keep the car or not. The real question is what it costs to run next year versus a replacement.',
        correct: true,
        explanation: 'Past bills are fixed. Compare the options from today, including likely repairs, running costs, and resale value. Keeping the car might still be the better choice.',
      },
      {
        id: 'b',
        text: "We've put $3,000 into this car. Selling it now would throw all of that money away, so the sensible move is to keep it running.",
        correct: false,
        explanation: "Same sunk-cost reasoning in a calmer voice. The $3,000 is spent whether they keep the car or sell it, so it can't justify more repairs.",
      },
      {
        id: 'c',
        text: "Let's keep repairing it. My dad kept his car for twenty years, and our family has always fixed things instead of replacing them.",
        correct: false,
        explanation: "This drops the sunk cost but leans on tradition. What the family has always done doesn't tell you whether this car is worth fixing now.",
      },
    ],
  },
  {
    id: 'rep_dishes',
    title: 'The dishes',
    fallacyId: 'fal_red_herring',
    passage: "You're saying I never do the dishes? I'm the one who found this apartment and set up the internet, so I don't think I'm the problem here.",
    principle: 'Answer the question that was asked before raising a new one.',
    options: [
      {
        id: 'a',
        text: "You say I never do the dishes, but you leave your laundry all over the living room, so you're hardly the one to talk about chores.",
        correct: false,
        explanation: "This changes the subject to the other person's laundry. Even if that's true, it doesn't answer whether the dishes are getting done.",
      },
      {
        id: 'b',
        text: "I hear you about the dishes, I really do. But I found this apartment and set up the internet, so I think I've more than done my share.",
        correct: false,
        explanation: "Acknowledging the complaint, then pivoting to the apartment and the internet, is still a red herring. Past favors don't answer whether the dishes get done.",
      },
      {
        id: 'c',
        text: "Fair point, but I did the dishes Monday and Wednesday, so \"never\" isn't right. A rotation on the fridge would show whose turn it is.",
        correct: true,
        explanation: "It answers the actual complaint with details the roommate can check, then proposes a fix. Whether \"never\" is fair now rests on facts, not on a change of subject.",
      },
    ],
  },
  {
    id: 'rep_new_menu',
    title: 'The new menu',
    fallacyId: 'fal_cherry_picking',
    passage: 'Sure, weekday sales are down, but Saturday and Sunday were our two best days ever. The new menu is clearly a hit.',
    principle: 'Weigh all the results, not just the ones you like.',
    options: [
      {
        id: 'a',
        text: 'Weekdays dipped a bit, sure, but our two best weekend days ever are what really count, so customers clearly love the new menu.',
        correct: false,
        explanation: "Deciding that the best days are what \"really count\" is cherry picking. Brushing off the weekday dip doesn't make it go away.",
      },
      {
        id: 'b',
        text: "Let's keep the new menu. Our head chef has cooked in famous kitchens, and she says it's the best menu she has ever written.",
        correct: false,
        explanation: "The chef's résumé doesn't tell you how customers responded. Her opinion of her own menu isn't sales data.",
      },
      {
        id: 'c',
        text: "Weekends were strong, but weekdays dipped. Let's compare all days over similar periods before calling the new menu a success.",
        correct: true,
        explanation: 'It includes the weaker days as well as the stronger ones and asks for a fair comparison. The full pattern helps assess the menu, while other changes may still affect sales.',
      },
    ],
  },
  {
    id: 'rep_coach_sleep',
    title: "The coach's advice",
    fallacyId: 'fal_tu_quoque',
    passage: "Coach Diaz told me to stop staying up late before games. Coming from her? She answers team emails at midnight. I'm not listening.",
    principle: "Weigh advice on its merits, even when the adviser doesn't follow it.",
    options: [
      {
        id: 'a',
        text: "Coach Diaz says I should sleep more before games. Whatever her habits, what matters is whether I play better rested, so I'll track it.",
        correct: true,
        explanation: "It sets the coach's habits aside and turns her advice into something to check: does more sleep change how the player performs? The focus stays on the advice.",
      },
      {
        id: 'b',
        text: "I respect Coach Diaz, but sleep advice from someone sending emails at midnight is a bit rich, so I'll take it with a big grain of salt.",
        correct: false,
        explanation: "Still tu quoque. The coach's midnight emails say nothing about whether the advice is good; \"a bit rich\" is just a polite way to dodge it.",
      },
      {
        id: 'c',
        text: "Coach Diaz says to sleep more, but I checked my stats and played fine after late nights all season, so they clearly don't hurt me.",
        correct: false,
        explanation: "This drops the hypocrisy jab but leans on a one-sided record. Without games after a full night's sleep to compare, \"played fine\" can't show that late nights don't matter.",
      },
    ],
  },
  {
    id: 'rep_lucky_socks',
    title: 'The lucky socks',
    fallacyId: 'fal_appeal_to_ignorance',
    passage: "Nobody has ever proven that my lucky socks don't help me win, so they obviously work. I'm wearing them for the final.",
    principle: "Not disproven isn't the same as true. Ask what evidence would count.",
    options: [
      {
        id: 'a',
        text: "I can't say for sure my lucky socks work, but no one has ever shown that they don't, so the odds are they probably help me win.",
        correct: false,
        explanation: "Adding \"probably\" doesn't fix the logic. A lack of evidence against the socks still isn't evidence for them.",
      },
      {
        id: 'b',
        text: "My lucky socks work. I wore them for all five games of our winning streak, and we haven't lost a single game in them since then.",
        correct: false,
        explanation: 'This offers evidence, but only wins in the socks. Without comparing games played without them, the streak could easily be a coincidence.',
      },
      {
        id: 'c',
        text: "Wins while wearing these socks aren't enough to show they help. I'd need a fair test; for now, wearing them is just a fun habit.",
        correct: true,
        explanation: 'It separates a habit from a supported claim. A fair test would need comparable conditions and attention to other factors, rather than treating a winning streak as the answer.',
      },
    ],
  },
  {
    id: 'rep_significant',
    title: 'The "significant" result',
    fallacyId: 'fal_equivocation',
    passage: "Our analytics show a statistically significant rise in how long visitors stay on the new homepage. That's a significant improvement, so the redesign was a huge win.",
    principle: 'When a key word does two jobs, pin down which meaning you need.',
    options: [
      {
        id: 'a',
        text: "The rise is statistically significant, and significant means significant, so I think it's fair to call the redesign a real success.",
        correct: false,
        explanation: "The statistical label and the everyday meaning of 'important' are being treated as interchangeable. The label alone does not tell us the size or practical value of the change.",
      },
      {
        id: 'b',
        text: "A statistically significant rise can still be tiny. Let's check the extra seconds and whether they help visitors.",
        correct: true,
        explanation: 'It asks how large the change is and whether visitors benefit. Statistical significance alone does not tell us whether the change is useful.',
      },
      {
        id: 'c',
        text: 'The redesign was a huge win. The design team spent six months on it, and our biggest competitor has already copied the new layout.',
        correct: false,
        explanation: "Months of work and a competitor's copy don't measure results. This drops the word trick but swaps in effort and imitation for evidence.",
      },
    ],
  },
  {
    id: 'rep_walk_to_school',
    title: 'The walk to school',
    fallacyId: 'fal_appeal_to_fear',
    passage: 'If you let Mia walk to school on her own, something terrible will happen. Do you really want to read about her on the news?',
    principle: 'Name the specific risk and how likely it is, not just the fear.',
    options: [
      {
        id: 'a',
        text: "Mia's route crosses Elm Street, which has no crossing guard. Could we walk it with her a few times and see how she handles that crossing?",
        correct: true,
        explanation: 'It swaps vague dread for a specific, checkable risk, the Elm Street crossing, and a way to test it. The worry stays; now it can be weighed.',
      },
      {
        id: 'b',
        text: "The world isn't safe for kids anymore, and if Mia goes by herself, something awful could easily happen. It just isn't worth the risk.",
        correct: false,
        explanation: "Same scare in calmer words. \"Something awful could happen\" doesn't say what the actual risk on Mia's route is or how likely it is.",
      },
      {
        id: 'c',
        text: "Mia shouldn't walk alone. None of the other parents on our street let their kids walk to school, so we'd be the only ones who do.",
        correct: false,
        explanation: "This drops the scare for the crowd. What other parents allow doesn't tell you how safe Mia's particular walk is.",
      },
    ],
  },
];
