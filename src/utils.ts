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

export function getRootDifference(root1: string, root2: string): number {
  const index1 = noteOrder.indexOf(root1);
  const index2 = noteOrder.indexOf(root2);

  if (index1 === -1 || index2 === -1) {
    return 0; // Return 0 if either root is not found
  }

  let difference = index2 - index1;
  if (difference < 0) {
    difference += 12; // Ensure positive difference
  }

  // Map the result from 0..11 to -5..+6
  return difference <= 6 ? difference : difference - 12;
}
