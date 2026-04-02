export type Activity = {
  id: number;
  title: string;
  description: string;
  grade: string;
  category: string;
  image: string;
  tags: string[];
};

export const activities: Activity[] = [
  {
    id: 1,
    title: "Vegetable Pattern",
    description:
      "Match the vegetables to complete the pattern and learn about shapes and colors!",
    grade: "1",
    category: "Math",
    image: "/images/activities/thumbnails/vegetable-game.png",
    tags: ["vegetable", "pattern", "shapes", "colors"],
  },
  {
    id: 2,
    title: "Matching list A and B",
    description:
      "Match the items in list A to the items in list B and learn about relationships!",
    grade: "2",
    category: "Science",
    image: "/images/activities/thumbnails/matching-list.png",
    tags: ["matching", "relationships", "science"],
  },
  {
    id: 3,
    title: "Sorting Activity",
    description:
      "Sort the items into the correct category and learn about classification!",
    grade: "3",
    category: "Science",
    image: "/images/activities/thumbnails/sorting.png",
    tags: ["sorting", "classification", "science"],
  },
  {
    id: 4,
    title: "Word Arrangement Game",
    description:
      "Arrange the words to form a sentence and learn about grammar and sentence structure!",
    grade: "4",
    category: "Language",
    image: "/images/activities/thumbnails/word-arrangement.png",
    tags: ["word", "arrangement", "grammar", "sentence", "structure"],
  },
  {
    id: 5,
    title: "Matching Items Activity",
    description:
      "Match the items to their corresponding category and learn about relationships!",
    grade: "5",
    category: "Science",
    image: "/images/activities/thumbnails/matching-items.png",
    tags: ["matching", "relationships", "science"],
  },
  {
    id: 6,
    title: "Fill in the Blanks",
    description:
      "Fill in the blanks with the correct words and learn about vocabulary and spelling!",
    grade: "6",
    category: "Language",
    image: "/images/activities/thumbnails/fill-in-the-blanks.png",
    tags: ["fill", "blanks", "vocabulary", "spelling"],
  },
  {
    id: 7,
    title: "Word Search Puzzle",
    description:
      "Find the hidden words in the grid and learn about vocabulary and spelling!",
    grade: "6",
    category: "Language",
    image: "/images/activities/thumbnails/word-search.png",
    tags: ["word", "search", "puzzle", "vocabulary", "spelling"],
  },
  {
    id: 8,
    title: "Grid Matching Game",
    description: "Match the items in the grid and learn about relationships!",
    grade: "7",
    category: "Science",
    image: "/images/activities/thumbnails/grid-matching.png",
    tags: ["matching", "relationships", "science"],
  },
  {
    id: 9,
    title: "Items Labelling",
    description:
      "Label the items in the images and learn about vocabulary and spelling!",
    grade: "6",
    category: "Language",
    image: "/images/activities/thumbnails/items-labelling.png",
    tags: ["items", "labelling", "vocabulary", "spelling"],
  },
  {
    id: 10,
    title: "Complete Sentence Rearrange",
    description:
      "Rearrange the words to form a complete sentence and learn about grammar and sentence structure!",
    grade: "5",
    category: "Language",
    image:
      "/images/activities/thumbnails/CompleteSentenceRearrangeDragDrop.png",
    tags: [
      "complete",
      "sentence",
      "rearrange",
      "grammar",
      "sentence",
      "structure",
    ],
  },
  {
    id: 11,
    title: "Comparing Quantity with Text",
    description: "Compare the quantities and match them with the correct text!",
    grade: "4",
    category: "Math",
    image: "/images/activities/thumbnails/comparing-quantity.png",
    tags: ["comparing", "quantity", "math"],
  },
  {
    id: 12,
    title: "Align Items Activity",
    description:
      "Align the items to their corresponding category and learn about relationships!",
    grade: "3",
    category: "Science",
    image: "/images/activities/thumbnails/align-items.png",
    tags: ["align", "relationships", "science"],
  },
];
