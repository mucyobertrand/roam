/**
 * "Ask about this stay": the topics a guest can ask about, a keyword matcher that picks topics
 * from a question, and the answer for each topic built only from the stay's stored fields.
 * Nothing here writes text about the stay; every answer is the stored value, word for word.
 * The matcher is a stand-in until Jev chooses topics behind an API route.
 * Pure (no React), so scripts/check-ask.ts can run it in Node.
 */
import type { IconName } from "@/components/ui";
import { amenityIcons, amenityLabels, type Amenity } from "@/data/stays";
import type { PolicyBlock, StayDetails } from "@/lib/content/stays";

export type TopicId = "checkin" | "pets" | "rules" | "cancellation" | "amenities" | "host";

type Topic = {
  id: TopicId;
  /** Chip label. */
  label: string;
  /** Card title. */
  title: string;
  icon: IconName;
  /** What a chip sends. */
  question: string;
  /** Whole words or phrases, matched in the normalized question. */
  keywords: string[];
};

const amenityWords = Object.values(amenityLabels).map((label) => label.toLowerCase());

/** In answer order: one question that hits several topics shows them in this order. */
export const TOPICS: Topic[] = [
  {
    id: "checkin",
    label: "Check-in",
    title: "Check-in and checkout",
    icon: "clock",
    question: "What time is check-in and checkout?",
    keywords: ["check in", "checkin", "check out", "checkout", "arrive", "arrival", "arriving", "late", "early", "leave"],
  },
  {
    id: "pets",
    label: "Pets",
    title: "Pets",
    icon: "paw",
    question: "Can I bring my pet?",
    keywords: ["pet", "pets", "dog", "dogs", "cat", "cats", "puppy", "animal", "animals"],
  },
  {
    id: "rules",
    label: "House rules",
    title: "House rules",
    icon: "list",
    question: "What are the house rules?",
    keywords: ["rule", "rules", "smoke", "smoking", "vape", "party", "parties", "event", "events", "quiet hours", "noise", "loud", "music", "visitors"],
  },
  {
    id: "cancellation",
    label: "Cancellation",
    title: "Cancellation",
    icon: "document",
    question: "What's the cancellation policy?",
    keywords: ["cancel", "cancels", "canceled", "cancelled", "canceling", "cancelling", "cancellation", "refund", "refunds", "refundable", "money back"],
  },
  {
    id: "amenities",
    label: "Amenities",
    title: "Amenities",
    icon: "sparkles",
    question: "What amenities are there?",
    keywords: [
      ...amenityWords,
      "amenity",
      "amenities",
      "wifi",
      "wi fi",
      "internet",
      "jacuzzi",
      "hottub",
      "swim",
      "swimming",
      "parking",
      "cook",
      "cooking",
      "desk",
      "charger",
      "charging",
      "ev",
    ],
  },
  {
    id: "host",
    label: "Host",
    title: "Your host",
    icon: "user",
    question: "Who is the host?",
    keywords: ["host", "hosts", "hosted", "owner", "owners", "landlord"],
  },
];

export const topicById = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<TopicId, Topic>;

/** Lowercase, punctuation to spaces ("Check-in?" → " check in "), padded for whole-word search. */
function normalize(text: string) {
  return ` ${text.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim()} `;
}

/** The topics a question is about, in `TOPICS` order. Empty when nothing matches. */
export function matchTopics(question: string): TopicId[] {
  const q = normalize(question);
  return TOPICS.filter((topic) => topic.keywords.some((k) => q.includes(normalize(k)))).map((t) => t.id);
}

/** "16:00" → "4:00 PM". Stored times are HH:MM (schema rule). */
export function to12h(time: string) {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export type AnswerBody =
  /** Short stored values, one per line. */
  | { kind: "lines"; lines: string[] }
  | { kind: "bullets"; items: string[] }
  /** A Roam policy: its summary, then the Portable Text body. */
  | { kind: "policy"; summary: string; blocks: PolicyBlock[] }
  | { kind: "amenities"; items: { id: Amenity; label: string; icon: IconName }[] };

/** Where the answer's text is stored; `target` is the sheet that shows it in full. */
export type AnswerSource = { label: string; target: "policies" | "cancellation" | "host" | null };

export type Answer = { topic: TopicId; title: string; icon: IconName; body: AnswerBody; source: AnswerSource };

/** The answer for one topic from the stay's stored fields, or `null` when the stay has none. */
export function answerFor(topic: TopicId, d: StayDetails): Answer | null {
  const { title, icon } = topicById[topic];
  const make = (body: AnswerBody, source: AnswerSource): Answer => ({ topic, title, icon, body, source });
  switch (topic) {
    case "checkin":
      return make(
        { kind: "lines", lines: [`Check-in after ${to12h(d.checkInTime)}`, `Checkout before ${to12h(d.checkOutTime)}`] },
        { label: "Stay details", target: "policies" },
      );
    case "pets":
      return make({ kind: "lines", lines: [d.petsAllowed ? "Pets allowed" : "No pets"] }, { label: "Stay details", target: "policies" });
    case "rules":
      return d.houseRules.length ? make({ kind: "bullets", items: d.houseRules }, { label: "House rules", target: "policies" }) : null;
    case "cancellation":
      return d.cancellation
        ? make(
            { kind: "policy", summary: d.cancellation.summary, blocks: d.cancellation.body },
            { label: `Roam · ${d.cancellation.title}`, target: "cancellation" },
          )
        : null;
    case "amenities":
      return d.amenities.length
        ? make(
            { kind: "amenities", items: d.amenities.map((id) => ({ id, label: amenityLabels[id], icon: amenityIcons[id] })) },
            { label: "Stay details", target: null },
          )
        : null;
    case "host": {
      const h = d.host;
      if (!h) return null;
      const lines = [h.name, h.hostingSince ? `Hosting since ${h.hostingSince}` : null, h.languages.length ? `Speaks ${h.languages.join(", ")}` : null];
      return make({ kind: "lines", lines: lines.filter((l): l is string => !!l) }, { label: "Host profile", target: "host" });
    }
  }
}

/** Topics this stay can answer: the chips shown. */
export const availableTopics = (d: StayDetails) => TOPICS.filter((t) => answerFor(t.id, d) !== null);

/** A reply: one card per answered topic; `unanswered` adds the "can't answer" card. */
export type Reply = { answers: Answer[]; unanswered: boolean };

export function replyTo(question: string, d: StayDetails): Reply {
  const topics = matchTopics(question);
  const answers = topics.map((t) => answerFor(t, d)).filter((a): a is Answer => a !== null);
  return { answers, unanswered: answers.length < topics.length || topics.length === 0 };
}
