import type {SeedPolicy} from './types'

/** Roam's shared policies. Answers quote these word for word, so this is final copy. */
export const policies: SeedPolicy[] = [
  {
    key: 'cancellation-flexible',
    title: 'Flexible cancellation',
    category: 'cancellation',
    summary: 'Full refund if you cancel at least 24 hours before check-in.',
    body: [
      'Cancel at least **24 hours before check-in** (in the stay’s local time) and you get a full refund of the nightly rate, cleaning fee and Roam service fee.',
      'If you cancel less than 24 hours before check-in, the first night and the service fee are non-refundable. The remaining nights are refunded.',
      'If you leave early after check-in, nights you don’t stay are refunded when you cancel them at least 24 hours in advance.',
    ],
  },
  {
    key: 'cancellation-moderate',
    title: 'Moderate cancellation',
    category: 'cancellation',
    summary: 'Full refund if you cancel at least 5 days before check-in.',
    body: [
      'Cancel at least **5 days before check-in** (in the stay’s local time) and you get a full refund of the nightly rate, cleaning fee and Roam service fee.',
      'If you cancel less than 5 days before check-in, you get a 50% refund of the nightly rate. The cleaning fee is refunded and the service fee is not.',
      'After check-in, nights you don’t stay are not refunded.',
    ],
  },
  {
    key: 'cancellation-strict',
    title: 'Strict cancellation',
    category: 'cancellation',
    summary: 'Full refund within 48 hours of booking if check-in is at least 14 days away.',
    body: [
      'You get a full refund if you cancel **within 48 hours of booking** and check-in is at least 14 days away.',
      'If you cancel at least 7 days before check-in, you get a 50% refund of the nightly rate and the cleaning fee. The service fee is not refunded.',
      'If you cancel less than 7 days before check-in, the booking is not refunded.',
    ],
  },
  {
    key: 'payments',
    title: 'Payments and fees',
    category: 'payment',
    summary: 'You pay in full when you book, in US dollars, with every fee shown up front.',
    body: [
      'The total you see before you book is the total you pay. It includes:',
      {bullets: ['The nightly rate for every night of your stay', 'The stay’s cleaning fee, if it has one', 'Roam’s service fee', 'Local occupancy taxes where Roam collects them']},
      'You pay in full when you book, in US dollars, with a credit or debit card. Hosts never ask for payment outside Roam. If a host asks you to pay another way, don’t pay and contact Roam support.',
      'Refunds go back to the card you paid with and usually arrive in 5 to 10 business days.',
    ],
  },
  {
    key: 'pets',
    title: 'Pets',
    category: 'pets',
    summary: 'Bring pets only to stays marked Pet Friendly. Assistance animals are always welcome.',
    body: [
      'You can bring pets to stays marked **Pet Friendly**. Up to two dogs or cats are allowed unless the stay’s house rules say otherwise.',
      'Pets can’t be left alone in the stay unless they are crated, and they stay off beds and sofas. Clean up after your pet, inside and out.',
      'Assistance animals are welcome at every stay, including stays that aren’t Pet Friendly, and never cost extra. Let your host know before you arrive.',
      'Damage caused by a pet is handled under the damage policy.',
    ],
  },
  {
    key: 'safety',
    title: 'Safety and parties',
    category: 'safety',
    summary: 'Parties are not allowed, and only guests on the booking may stay overnight.',
    body: [
      'Parties and events are not allowed at any Roam stay. Only the guests on the booking may stay overnight, and the number of guests may not exceed the stay’s maximum.',
      'Every stay has a working smoke alarm, and stays with gas appliances, a fireplace or an attached garage also have a carbon monoxide alarm. Hot tubs and pools are used at your own risk. Children must be supervised around water at all times.',
      'Smoking and vaping are not allowed indoors at any stay.',
      'In an emergency, call local emergency services first, then contact Roam support.',
    ],
  },
  {
    key: 'damage',
    title: 'Damage and security deposits',
    category: 'damage',
    summary: 'Report damage within 24 hours. Roam does not take security deposits.',
    body: [
      'Roam does not take security deposits. If something breaks during your stay, tell your host and Roam support within 24 hours.',
      'Hosts can request payment for damage within 14 days of checkout. Roam reviews each request with photos and receipts before you are charged, and you can respond before any charge is made.',
      'Normal wear and tear, such as a worn towel or a scuffed floor, is never charged.',
    ],
  },
  {
    key: 'support',
    title: 'Help and support',
    category: 'support',
    summary: 'Roam support is available 24 hours a day in the app.',
    body: [
      'Roam support is available 24 hours a day from the Help section of your profile.',
      'If you can’t get in, the stay doesn’t match its listing, or something essential like heat or water isn’t working, contact your host first. If it isn’t fixed within a few hours, contact Roam support. We’ll help you find a comparable stay or refund the nights you can’t use.',
    ],
  },
]
