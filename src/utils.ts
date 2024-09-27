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
    1: "#FF8C00", // Dark Orange
    2: "#006400", // Dark Green
    3: "#00008B", // Dark Blue
    4: "#8B008B", // Dark Purple
    5: "#000000", // Black
    "-5": "#aaa", // Gray
    "-4": "#DA70D6", // Light Purple (Orchid)
    "-3": "#1E90FF", // Light Blue (Dodger Blue)
    "-2": "#90EE90", // Light Green
    "-1": "#FFA500", // Light Orange
    "6": "turquoise",
  };

  return colorMap[difference] || "black";
}

export function getContrastColor(hexColor: string): string {
  // Remove the hash if it's there
  hexColor = hexColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for bright colors and white for dark colors
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

export function getRootDifferenceSymbol(difference: number): string {
  return difference === 0 ? "=" : difference.toString();
}
