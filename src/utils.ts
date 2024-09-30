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

export function getRootDifferenceColor(difference: number): {
  backgroundColor: string;
  color: string;
} {
  if (isNaN(difference)) {
    return { backgroundColor: "gray", color: "white" };
  }

  const colorMap: {
    [key: string]: { backgroundColor: string; color: string };
  } = {
    1: { backgroundColor: "#ff0000", color: "white" }, // Dark Red
    2: { backgroundColor: "#008c00", color: "white" }, // Dark Green
    3: { backgroundColor: "#0000AB", color: "white" }, // Dark Blue
    4: { backgroundColor: "#FFA500", color: "white" }, // Orange
    5: { backgroundColor: "#000000", color: "white" }, // Black
    "6": { backgroundColor: "#800020", color: "white" },
    "-5": { backgroundColor: "#ccc", color: "black" }, // Gray
    "-4": { backgroundColor: "#FFFF00", color: "black" }, // Yellow
    "-3": { backgroundColor: "#6EE0FF", color: "black" }, // Light Blue (Dodger Blue)
    "-2": { backgroundColor: "#90EE90", color: "black" }, // Light Green
    "-1": { backgroundColor: "#FFB6C1", color: "black" }, // Rose Pink
  };

  return colorMap[difference] || { backgroundColor: "black", color: "white" };
}

export function getRootDifferenceSymbol(difference: number): string {
  return difference === 0 ? "=" : difference.toString();
}
