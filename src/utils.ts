import * as Tone from "tone";

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

export function getRootDifference(root1: string, root2: string): string {
  const noteOrder = [
    "C",
    "Csharp",
    "D",
    "Eb",
    "E",
    "F",
    "Fsharp",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
  ];

  const index1 = noteOrder.indexOf(root1);
  const index2 = noteOrder.indexOf(root2);

  if (index1 === -1 || index2 === -1) {
    return "?";
  }

  let difference = index2 - index1;
  if (difference < 0) difference += 12;

  // Map 0..11 to -6..+5
  if (difference > 6) {
    difference -= 12;
  }

  return difference.toString();
}

export function getRootDifferenceColor(difference: number): string {
  if (isNaN(difference)) {
    return "gray";
  }

  const colorMap: { [key: string]: string } = {
    0: "gray",
    1: "#1E90FF", // Dodger Blue
    2: "lime", // Orange Red
    3: "darkgreen", // Lime Green
    4: "#FF1493", // Deep Pink
    5: "black",
    6: "#8A2BE2", // Blue Violet
    "-5": "red", // Green
    "-4": "#00CED1", // Dark Turquoise
    "-3": "#FFD700", // Gold
    "-2": "#9932CC", // Dark Orchid
    "-1": "blue", // Red
  };

  return colorMap[difference] || "black";
}
