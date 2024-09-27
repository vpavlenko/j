import guitarChords from "../guitarChords";

export interface ParsedChord {
  root: string;
  originalRoot: string; // Add this line
  suffix: string;
  originalSuffix: string;
  isMajor: boolean;
  isMinor: boolean;
  error?: string;
}

export function parseChordName(chordName: string): ParsedChord {
  const keys = guitarChords.keys;
  let root = "";
  let originalRoot = "";
  let suffix = "";

  const rootMapping: { [key: string]: string } = {
    Cb: "B",
    Db: "Csharp",
    "D#": "Eb",
    "F#": "Fsharp",
    Gb: "Fsharp",
    "G#": "Ab",
    "A#": "Bb",
    "C#": "Csharp",
  };

  // First, check for keys that need to be mapped
  for (const [origRoot, mappedRoot] of Object.entries(rootMapping)) {
    if (chordName.startsWith(origRoot)) {
      root = mappedRoot;
      originalRoot = origRoot; // Store the original root
      suffix = chordName.slice(origRoot.length);
      break;
    }
  }

  // If no mapped key was found, then check the standard keys
  if (!root) {
    for (let i = 0; i < keys.length; i++) {
      if (chordName.startsWith(keys[i])) {
        root = keys[i];
        originalRoot = keys[i];
        suffix = chordName.slice(keys[i].length);
        break;
      }
    }
  }

  const originalSuffix = suffix;
  suffix = suffixMapping(suffix);

  if (!root) {
    return {
      root: "",
      originalRoot: "",
      suffix: "",
      originalSuffix: "",
      isMajor: false,
      isMinor: false,
      error: `Unable to parse chord: ${chordName}`,
    };
  }

  const isMajor = isMajorChord(suffix);
  const isMinor = isMinorChord(suffix);

  return { root, originalRoot, suffix, originalSuffix, isMajor, isMinor };
}

export const suffixMapping = (suffix: string): string => {
  if (suffix === "7") return "7";
  if (suffix === "7alt") return "7#9";
  if (suffix === "") return "major";
  if (suffix === "m") return "minor";
  if (suffix === "M") return "major";
  if (suffix === "M7") return "maj7";
  if (suffix === "M7#5") return "maj7#5";
  if (suffix === "M7b5") return "maj7b5";
  if (suffix === "6/9") return "69";
  if (suffix === "9b5") return "9b5";
  if (suffix === "dim7") return "dim7";
  if (suffix === "m7b5") return "m7b5";
  if (suffix === "m/M7") return "mmaj7";
  if (suffix === "mMaj7") return "mmaj7";
  if (suffix === "mM7") return "mmaj7";
  if (suffix === "m6/9") return "m69";
  if (suffix === "7b9") return "7b9";
  if (suffix === "7#9") return "7#9";
  if (suffix === "7#5") return "aug7";
  if (suffix === "7#5#9") return "alt";
  if (suffix === "m7") return "m7";
  if (suffix === "m9") return "m9";
  if (suffix === "maj7") return "maj7";
  if (suffix === "madd9") return "madd9";
  if (suffix === "maj9") return "maj9";
  if (suffix === "7b5") return "7b5";
  if (suffix === "aug") return "aug";
  if (suffix === "aug7") return "aug7";
  if (suffix === "add9") return "add9";
  if (suffix === "add11") return "add11";
  if (suffix === "dim") return "dim";
  if (suffix === "mmaj7b5") return "mmaj7b5";
  if (suffix === "mmaj9") return "mmaj9";
  if (suffix === "mmaj11") return "mmaj11";
  if (suffix === "7sus4") return "7sus4";
  if (suffix === "11") return "11";
  if (suffix === "9#11") return "9#11";
  if (suffix === "13") return "13";
  if (suffix === "o7") return "dim7";
  if (suffix === "+") return "aug";
  if (suffix === "+7") return "aug7";
  if (suffix === "7+") return "aug7";
  if (suffix === "7sus") return "7sus4";
  if (suffix === "9sus4") return "7sus4";
  if (suffix === "o") return "dim";
  if (suffix === "M6") return "6";
  if (suffix === "7#11") return "9#11";
  if (suffix === "M7#11") return "maj7b5";
  if (suffix.includes("m7/")) return suffix.replace("m7/", "m/");
  if (suffix.includes("/")) return suffix;
  if (suffix.includes("sus")) return suffix;

  return suffix;
};

export function checkChordAvailability(root: string, suffix: string): boolean {
  const chordData = guitarChords.chords[root]?.find(
    (chord) => chord.suffix === suffix
  );
  return !!chordData;
}

const minorChordSuffixes = new Set([
  "m",
  "minor",
  "min",
  "m7",
  "m9",
  "m11",
  "m13",
  "m6",
  "m6/9",
  "m69",
  "m7b5",
  "ø",
  "ø7",
  "madd9",
  "madd11",
  "mmaj7",
  "mM7",
  "m/M7",
  "mMaj7",
  "mmaj9",
  "mmaj11",
  "mdim7",
  "m7b9",
  "m7#5",
]);

function isMinorChord(suffix: string): boolean {
  return (
    minorChordSuffixes.has(suffix) ||
    minorChordSuffixes.has(suffix.split("/")?.[0])
  );
}

const majorChordSuffixes = new Set([
  "",
  "major",
  "maj",
  "M",
  "6",
  "69",
  "6/9",
  "maj7",
  "M7",
  "maj9",
  "maj13",
  "add9",
  "add11",
  "add13",
]);

function isMajorChord(suffix: string): boolean {
  return majorChordSuffixes.has(suffix);
}

// Export these functions if needed elsewhere
export { isMinorChord, isMajorChord };
