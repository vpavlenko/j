type Song = {
  filename: string;
  Title: string;
  ComposedBy: string;
  DBKeySig: string;
  TimeSig: [number, number];
  Bars: string;
  chords: string[][];
};

export const CORPUS: Song[] = [
  {
    filename: "BluesWalk",
    Title: "Blues Walk",
    ComposedBy: "Sonny Stitt",
    DBKeySig: "Bb",
    TimeSig: [4, 4],
    Bars: "12",
    chords: [
      ["Bb7", "Bb7", "Bb7", "Bb7"],
      ["Eb7", "Eb7", "Bb7", "Bb7"],
      ["F7alt", "F7alt", "Bb7", "Bb7"],
    ],
  },
  {
    filename: "LullabyOfBirdland",
    Title: "Lullaby of Birdland",
    ComposedBy: "George Shearing",
    DBKeySig: "Ab",
    TimeSig: [4, 4],
    Bars: "32",
    chords: [
      ["Fm7 Dm7b5", "G7b9 C7b9", "Fm7 DbM7", "Bbm7 Eb7"],
      ["Cm7 Fm7", "Bbm7 Eb7b9", "AbM7 Db7", "Gm7b5 C7"],
      ["Fm7 Dm7b5", "G7b9 C7b9", "Fm7 DbM7", "Bbm7 Eb7"],
      ["Cm7 Fm7", "Bbm7 Eb7b9", "AbM7 Eb7", "AbM7"],
      ["F7b9", "Bbm7", "Bbm7 Eb7b9", "AbM7"],
      ["F7b9", "Bbm7", "Eb7b9", "AbM7 C7alt"],
      ["Fm7 Dm7b5", "G7b9 C7b9", "Fm7 DbM7", "Bbm7 Eb7"],
      ["Cm7 Fm7", "Bbm7 Eb7b9", "AbM7 Eb7", "AbM7 C7alt"],
    ],
  },
  {
    filename: "DeedIDo",
    Title: "'Deed I Do",
    ComposedBy: "Walter Hirsch and Fred Rose",
    DBKeySig: "C",
    TimeSig: [4, 4],
    Bars: "32",
    chords: [
      ["C", "C7", "F", "Fm"],
      ["A7", "D7 G7", "C", "Dm7 G7"],
      ["C", "C7", "F", "Fm"],
      ["A7", "D7 G7", "C", "C7"],
      ["F", "F", "E7", "E7"],
      ["A7", "A7", "D7", "G7"],
      ["C", "C7", "F", "Fm"],
      ["A7", "D7 G7", "C", "Dm7 G7"],
    ],
  },
];
