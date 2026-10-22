// Fictional, self-contained logic exercises. Treat each stated fact as given;
// use no outside assumptions. Answers are computed from every permitted model.

import type { LogicExpr, LogicItem } from '../engine/logic';

const atom = (id: string): LogicExpr => ({ kind: 'atom', id });
const not = (value: LogicExpr): LogicExpr => ({ kind: 'not', value });
const and = (left: LogicExpr, right: LogicExpr): LogicExpr => ({ kind: 'and', left, right });
const or = (left: LogicExpr, right: LogicExpr): LogicExpr => ({ kind: 'or', left, right });
const implies = (left: LogicExpr, right: LogicExpr): LogicExpr => ({ kind: 'implies', left, right });

export const logicItems: LogicItem[] = [
  {
    id: 'logic_library_locker',
    title: 'The library locker',
    atoms: { reserved: 'The locker is reserved.', code: 'A door code is sent.' },
    premises: [
      { text: 'If the locker is reserved, a door code is sent.', expr: implies(atom('reserved'), atom('code')) },
      { text: 'The locker is reserved.', expr: atom('reserved') },
    ],
    claim: { text: 'A door code is sent.', expr: atom('code') },
    explanation: 'The reservation meets the condition in the rule, so the code must be sent. A reserved locker without a code would break a stated fact.',
    lesson: 'When an if-condition holds, its stated result follows.',
  },
  {
    id: 'logic_greenhouse_valve',
    title: 'The greenhouse valve',
    atoms: { open: 'The valve is open.', flowing: 'Water is flowing.' },
    premises: [
      { text: 'If the valve is open, water is flowing.', expr: implies(atom('open'), atom('flowing')) },
      { text: 'Water is not flowing.', expr: not(atom('flowing')) },
    ],
    claim: { text: 'The valve is not open.', expr: not(atom('open')) },
    explanation: 'An open valve would require flowing water under the given rule. Since no water is flowing, the valve cannot be open.',
    lesson: 'If a required result is absent, its condition cannot hold.',
  },
  {
    id: 'logic_parcel_receipt',
    title: 'The parcel receipt',
    atoms: { scanned: 'The parcel is scanned.', logged: 'The parcel is logged.', receipt: 'A receipt is printed.' },
    premises: [
      { text: 'If the parcel is scanned, it is logged.', expr: implies(atom('scanned'), atom('logged')) },
      { text: 'If the parcel is logged, a receipt is printed.', expr: implies(atom('logged'), atom('receipt')) },
      { text: 'The parcel is scanned.', expr: atom('scanned') },
    ],
    claim: { text: 'A receipt is printed.', expr: atom('receipt') },
    explanation: 'Scanned leads to logged, and logged leads to a printed receipt. Both links are stated, so the receipt follows.',
    lesson: 'Follow an if-then chain one stated step at a time.',
  },
  {
    id: 'logic_choir_room',
    title: 'The choir rooms',
    atoms: { red: 'The red room is available.', blue: 'The blue room is available.' },
    premises: [
      { text: 'At least one room is available: the red room or the blue room, possibly both.', expr: or(atom('red'), atom('blue')) },
      { text: 'The red room is not available.', expr: not(atom('red')) },
    ],
    claim: { text: 'The blue room is available.', expr: atom('blue') },
    explanation: 'One of the rooms must be available. Removing the red room leaves the blue room as the only way to satisfy that fact.',
    lesson: 'If at least one option holds and one is ruled out, the other holds.',
  },
  {
    id: 'logic_art_equipment',
    title: 'Ready for the studio',
    atoms: { apron: 'Noor has an apron.', goggles: 'Noor has goggles.' },
    premises: [
      { text: 'Noor has an apron.', expr: atom('apron') },
      { text: 'Noor has goggles.', expr: atom('goggles') },
    ],
    claim: { text: 'Noor has both an apron and goggles.', expr: and(atom('apron'), atom('goggles')) },
    explanation: 'Each part of the claim is given separately. Combining those two facts does not add an assumption.',
    lesson: 'Two established facts can be joined with “and”.',
  },
  {
    id: 'logic_makerspace_lights',
    title: 'The workshop lights',
    atoms: { printer: 'The printer is running.', printer_light: 'The printer light is on.', cutter: 'The cutter is running.', cutter_light: 'The cutter light is on.' },
    premises: [
      { text: 'If the printer is running, its light is on.', expr: implies(atom('printer'), atom('printer_light')) },
      { text: 'If the cutter is running, its light is on.', expr: implies(atom('cutter'), atom('cutter_light')) },
      { text: 'At least one machine is running: the printer or the cutter, possibly both.', expr: or(atom('printer'), atom('cutter')) },
    ],
    claim: { text: 'At least one machine light is on: the printer light or the cutter light, possibly both.', expr: or(atom('printer_light'), atom('cutter_light')) },
    explanation: 'Whichever machine is running must have its light on. Both might be running, but there is no permitted case with both lights off.',
    lesson: 'Different possible paths can still lead to the same conclusion.',
  },
  {
    id: 'logic_door_pin',
    title: 'The door pin',
    atoms: { accepted: 'The pin is accepted.', unlocked: 'The door unlocks.' },
    premises: [
      { text: 'If the pin is accepted, the door unlocks.', expr: implies(atom('accepted'), atom('unlocked')) },
      { text: 'The pin is accepted.', expr: atom('accepted') },
    ],
    claim: { text: 'The door does not unlock.', expr: not(atom('unlocked')) },
    explanation: 'The accepted pin requires the door to unlock. The claim says the opposite, so it conflicts with the given facts.',
    lesson: 'A claim cannot contradict a result required by the facts.',
  },
  {
    id: 'logic_bakery_sign',
    title: 'The bakery sign',
    atoms: { sold_out: 'The bread is sold out.', sign: 'The sold-out sign is up.' },
    premises: [
      { text: 'If the bread is sold out, the sold-out sign is up.', expr: implies(atom('sold_out'), atom('sign')) },
      { text: 'The sold-out sign is not up.', expr: not(atom('sign')) },
    ],
    claim: { text: 'The bread is sold out.', expr: atom('sold_out') },
    explanation: 'Sold-out bread would require the sign to be up. The sign is not up, so the claim cannot fit the stated rule.',
    lesson: 'Test a claim against every required consequence.',
  },
  {
    id: 'logic_museum_guide',
    title: 'The museum guide',
    atoms: { audio: 'An audio guide is provided.', booklet: 'A printed booklet is provided.' },
    premises: [
      { text: 'At least one guide is provided: an audio guide or a printed booklet, possibly both.', expr: or(atom('audio'), atom('booklet')) },
      { text: 'No audio guide is provided.', expr: not(atom('audio')) },
    ],
    claim: { text: 'No printed booklet is provided.', expr: not(atom('booklet')) },
    explanation: 'With no audio guide, the booklet must be provided. Claiming neither guide is provided breaks the “at least one” fact.',
    lesson: '“At least one” rules out the case where neither is true.',
  },
  {
    id: 'logic_bike_ready',
    title: 'The bike reservation',
    atoms: { booked: 'The hill-route bike is booked.', charged: 'The bike is charged.', ready: 'The bike is ready.' },
    premises: [
      { text: 'If the hill-route bike is booked, it is charged.', expr: implies(atom('booked'), atom('charged')) },
      { text: 'If the bike is charged, it is ready.', expr: implies(atom('charged'), atom('ready')) },
      { text: 'The hill-route bike is booked.', expr: atom('booked') },
    ],
    claim: { text: 'The bike is not ready.', expr: not(atom('ready')) },
    explanation: 'The booking requires charging, which requires readiness. A bike that is not ready would contradict this chain of given rules.',
    lesson: 'A conclusion at the end of a valid chain cannot be denied.',
  },
  {
    id: 'logic_rehearsal_email',
    title: 'The rehearsal email',
    atoms: { booked: 'The rehearsal is booked.', emailed: 'The confirmation email is sent.' },
    premises: [
      { text: 'The rehearsal is booked.', expr: atom('booked') },
      { text: 'The confirmation email is not sent.', expr: not(atom('emailed')) },
    ],
    claim: { text: 'The rehearsal is booked and the confirmation email is sent.', expr: and(atom('booked'), atom('emailed')) },
    explanation: 'The booking part is true, but the email part is false. An “and” claim needs both parts to be true.',
    lesson: 'One false part makes an “and” claim false.',
  },
  {
    id: 'logic_shuttle_routes',
    title: 'The shuttle loops',
    atoms: { short: 'The short loop runs.', long: 'The long loop runs.', north: 'The north stop is served.', south: 'The south stop is served.' },
    premises: [
      { text: 'If the short loop runs, the north stop is served.', expr: implies(atom('short'), atom('north')) },
      { text: 'If the long loop runs, the south stop is served.', expr: implies(atom('long'), atom('south')) },
      { text: 'The north stop is not served.', expr: not(atom('north')) },
      { text: 'The south stop is not served.', expr: not(atom('south')) },
    ],
    claim: { text: 'At least one loop runs: the short loop or the long loop, possibly both.', expr: or(atom('short'), atom('long')) },
    explanation: 'Either running loop would require its stop to be served. Neither stop is served, so neither loop can run under these facts.',
    lesson: 'Check every alternative before accepting an “or” claim.',
  },
  {
    id: 'logic_studio_code',
    title: 'The studio code',
    atoms: { reserved: 'The studio is reserved.', code: 'A door code is sent.' },
    premises: [
      { text: 'If the studio is reserved, a door code is sent.', expr: implies(atom('reserved'), atom('code')) },
      { text: 'A door code is sent.', expr: atom('code') },
    ],
    claim: { text: 'The studio is reserved.', expr: atom('reserved') },
    explanation: 'A reservation would explain the code, but the rule does not say it is the only way to get one. The studio could be reserved or unreserved. Either possibility fits the facts.',
    lesson: 'An if-then rule does not automatically run backward.',
  },
  {
    id: 'logic_battery_warning',
    title: 'The battery warning',
    atoms: { low: 'The battery is low.', warning: 'A warning is shown.' },
    premises: [
      { text: 'If the battery is low, a warning is shown.', expr: implies(atom('low'), atom('warning')) },
      { text: 'The battery is not low.', expr: not(atom('low')) },
    ],
    claim: { text: 'A warning is shown.', expr: atom('warning') },
    explanation: 'The rule tells us what happens with a low battery. It leaves other cases open, so a warning and no warning both fit a battery that is not low.',
    lesson: 'An absent condition does not settle its stated result.',
  },
  {
    id: 'logic_seminar_equipment',
    title: 'The seminar equipment',
    atoms: { board: 'A whiteboard is available.', projector: 'A projector is available.' },
    premises: [
      { text: 'At least one is available: a whiteboard or a projector, possibly both.', expr: or(atom('board'), atom('projector')) },
      { text: 'A projector is available.', expr: atom('projector') },
    ],
    claim: { text: 'A whiteboard is available.', expr: atom('board') },
    explanation: 'The projector already satisfies “at least one.” A whiteboard could also be available, but it does not have to be.',
    lesson: 'An inclusive “or” allows both; it does not require both.',
  },
  {
    id: 'logic_garden_soil',
    title: 'The garden soil',
    atoms: { rain: 'It rained.', sprinkler: 'The sprinkler ran.', wet: 'The soil is wet.' },
    premises: [
      { text: 'If it rained, the soil is wet.', expr: implies(atom('rain'), atom('wet')) },
      { text: 'If the sprinkler ran, the soil is wet.', expr: implies(atom('sprinkler'), atom('wet')) },
      { text: 'The soil is wet.', expr: atom('wet') },
    ],
    claim: { text: 'It rained.', expr: atom('rain') },
    explanation: 'Rain with wet soil fits the facts. No rain, with the sprinkler running and wet soil, also fits. The wet soil alone does not decide.',
    lesson: 'A result may fit more than one explanation.',
  },
  {
    id: 'logic_lunch_packing',
    title: 'Packing lunch',
    atoms: { soup: 'The soup is ready.', rice: 'The rice is ready.', salad: 'The salad is ready.' },
    premises: [
      { text: 'The soup is ready.', expr: atom('soup') },
      { text: 'If the rice is ready, the salad is ready.', expr: implies(atom('rice'), atom('salad')) },
    ],
    claim: { text: 'The salad is ready.', expr: atom('salad') },
    explanation: 'The salad could be ready. It could also be unfinished while the rice is unfinished. The soup fact does not settle either case.',
    lesson: 'An unrelated fact cannot fill a missing step.',
  },
  {
    id: 'logic_network_test',
    title: 'The network test',
    atoms: { passed: 'The network test passed.', network: 'The network is working.', power: 'The power is on.' },
    premises: [
      { text: 'If the test passed, the network is working and the power is on.', expr: implies(atom('passed'), and(atom('network'), atom('power'))) },
      { text: 'The power is on.', expr: atom('power') },
    ],
    claim: { text: 'The network test passed.', expr: atom('passed') },
    explanation: 'Power can be on whether the test passed or not. The rule only runs from a passed test to the two conditions, not the other way around.',
    lesson: 'Meeting one requirement does not establish the whole claim.',
  },
];
