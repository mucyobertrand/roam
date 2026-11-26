/**
 * Self-test for copy-checks.ts: good copy passes, and each kind of invented claim fails with
 * the right reason. No network.
 *
 *   cd roam && npx sanity exec scripts/check-copy-checks.ts
 */
import {buildFacts, checkCopy, knownPlaces} from './copy-checks'
import {stays} from '../seed/stays'

const stay = stays.find((s) => s.slug === 'modern-cabin-lake-arrowhead')!
const facts = buildFacts(stay, 'Maya Alvarez')
const noPets = {...facts, petsAllowed: false, houseRules: ['No parties or events']}
const places = knownPlaces(stays)

const good =
  'A modern cabin in Lake Arrowhead, California, with room for 6 guests across 3 bedrooms. ' +
  'Sink into the hot tub after a day outside, then curl up by the fireplace. The kitchen is ready ' +
  'for slow breakfasts, Wi-Fi keeps you connected, and up to two dogs are welcome. Check in from 4 pm.'

const cases: {name: string; copy: string; facts?: typeof facts; expect: RegExp | null}[] = [
  {name: 'good copy passes', copy: good, expect: null},
  {name: 'adds a pool', copy: good.replace('the hot tub', 'the heated pool'), expect: /pool.*Pool isn't listed/},
  {name: 'pets on a no-pet stay', copy: good, facts: noPets, expect: /pets aren't allowed/},
  {name: 'wrong guest count', copy: good.replace('room for 6 guests', 'sleeps 8 guests'), expect: /8 guests/},
  {name: 'wrong number word', copy: good.replace('room for 6 guests', 'room for eight guests'), expect: /8 guests/},
  {name: 'wrong bedrooms', copy: good.replace('across 3 bedrooms', 'across 4 bedrooms'), expect: /4 bedrooms/},
  {name: 'invented distance', copy: good.replace('after a day outside', 'just 10 minutes from the village'), expect: /distance|number 10/},
  {name: 'another place', copy: good.replace('after a day outside', 'after a day in Big Bear Lake'), expect: /another place \("Big Bear Lake"\)/},
  {name: 'a price', copy: good.replace('Check in from 4 pm.', 'All for $289 a night.'), expect: /price/},
  {name: 'too short', copy: 'A cozy cabin.', expect: /length/},
]

let failed = 0
for (const c of cases) {
  const reasons = checkCopy(c.copy, c.facts ?? facts, places)
  const ok = c.expect === null ? reasons.length === 0 : reasons.some((r) => c.expect!.test(r))
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.name}${reasons.length ? `: ${reasons.join('; ')}` : ''}`)
}
if (!places.includes('Big Bear Lake')) throw new Error('Big Bear Lake must be a seed place for the "another place" case')
if (failed) {
  console.error(`${failed} case(s) failed`)
  process.exit(1)
}
console.log(`All ${cases.length} cases passed`)
