/** Onboarding pages. Photos are remote Unsplash placeholders; `credit` is the photo's Unsplash page. */
export type Slide = {
  id: string;
  image: string;
  credit: string;
  location: string;
  title: string;
  body: string;
};

const unsplash = (photo: string) => `https://images.unsplash.com/${photo}?w=1200&q=80&fm=jpg&fit=crop`;

export const slides: readonly Slide[] = [
  {
    id: "story",
    image: unsplash("photo-1636886519725-6a048800b5b4"),
    credit: "https://unsplash.com/photos/bHmCOJt5Sz0",
    location: "Emerald Lake, BC",
    title: "Find a stay that fits your story",
    body: "From mountain cabins to oceanfront villas, roam helps you find unforgettable stays for every kind of trip.",
  },
  {
    id: "search",
    image: unsplash("photo-1754793566421-44b55f0cdf28"),
    credit: "https://unsplash.com/photos/zgklkgba15o",
    location: "Canmore, AB",
    title: "Search the way you talk",
    body: "Describe your stay in one sentence, like “quiet pet friendly cabin with a hot tub under $300”, and get stays ranked for you.",
  },
  {
    id: "answers",
    image: unsplash("photo-1512100643720-dbe5c2540c40"),
    credit: "https://unsplash.com/photos/PdNoXi1Q9AI",
    location: "Playa Colorado, Nicaragua",
    title: "Answers straight from the source",
    body: "Ask about pets, check-in or cancellation and get the stay’s own policy, word for word.",
  },
];
