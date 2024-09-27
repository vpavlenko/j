import * as Tone from "tone";

const noteOrder = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const flatToSharp: { [key: string]: string } = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

const rootToNumber: { [key: string]: number } = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

export function strum(
  sampler: Tone.Sampler,
  midiNotes: number[],
  duration: number,
  time: number
) {
  const strumDuration = 0.001; // 1ms between notes
  midiNotes.forEach((midi, index) => {
    const noteTime = time + index * strumDuration;
    const note = Tone.Frequency(midi, "midi").toNote();
    sampler.triggerAttackRelease(note, duration, noteTime);
  });
}

export function getRootDifference(root1: string, root2: string): number {
  console.log(`Calculating root difference: ${root1} to ${root2}`);

  const num1 = rootToNumber[root1];
  const num2 = rootToNumber[root2];

  console.log(`Root numbers: ${num1}, ${num2}`);

  if (num1 === undefined || num2 === undefined) {
    console.warn(`Invalid root: ${num1 === undefined ? root1 : root2}`);
    return 0;
  }

  let difference = num2 - num1;

  // Ensure the difference is in the range -5 to 6
  if (difference > 6) {
    difference -= 12;
  } else if (difference < -5) {
    difference += 12;
  }

  console.log(`Calculated difference: ${difference}`);

  return difference;
}

export function getRootDifferenceColor(difference: number): string {
  const colorMap: { [key: number]: string } = {
    0: "gray",
    5: "black",
    1: "#1E90FF", // Dodger Blue
    2: "lime", // Orange Red
    3: "darkgreen", // Lime Green
    4: "#FF1493", // Deep Pink
    6: "#8A2BE2", // Blue Violet
    "-1": "blue", // Red
    "-2": "#00CED1", // Dark Turquoise
    "-3": "#FFD700", // Gold
    "-4": "#9932CC", // Dark Orchid
    "-5": "red", // Green
  };

  return colorMap[difference] || "black";
}
