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
  shape: "circle" | "triangle-right" | "triangle-left";
  clipPath?: string;
  textAlign?: string;
} {
  if (isNaN(difference)) {
    return { backgroundColor: "gray", color: "white", shape: "circle" };
  }

  const colorMap: {
    [key: string]: {
      backgroundColor: string;
      color: string;
      shape: "circle" | "triangle-right" | "triangle-left";
      clipPath?: string;
      textAlign?: string;
    };
  } = {
    1: { backgroundColor: "#ff0000", color: "white", shape: "circle" },
    2: { backgroundColor: "#008c00", color: "white", shape: "circle" },
    3: { backgroundColor: "#0000AB", color: "white", shape: "circle" },
    4: { backgroundColor: "#FFA500", color: "white", shape: "circle" },
    5: {
      backgroundColor: "#000000",
      color: "white",
      shape: "triangle-right",
      clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)",
      textAlign: "left",
    },
    "6": { backgroundColor: "#800020", color: "white", shape: "circle" },
    "-5": {
      backgroundColor: "#ccc",
      color: "black",
      shape: "triangle-left",
      clipPath: "polygon(100% 0%, 0% 50%, 100% 100%)",
      textAlign: "right",
    },
    "-4": { backgroundColor: "#FFFF00", color: "black", shape: "circle" },
    "-3": { backgroundColor: "#6EE0FF", color: "black", shape: "circle" },
    "-2": { backgroundColor: "#90EE90", color: "black", shape: "circle" },
    "-1": { backgroundColor: "#FFB6C1", color: "black", shape: "circle" },
  };

  return (
    colorMap[difference] || {
      backgroundColor: "black",
      color: "white",
      shape: "circle",
    }
  );
}

export function getRootDifferenceSymbol(difference: number): string {
  return difference === 0 ? "=" : difference.toString();
}
