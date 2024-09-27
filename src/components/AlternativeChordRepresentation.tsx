import React from "react";
import { ParsedChord, parseChordName } from "../helpers/chordParser";

interface ChordInfo {
  chord: string;
  root: string;
  suffix: string;
  isMajor: boolean;
  isMinor: boolean;
}

interface Props {
  chords: string[];
  currentChordIndex: number | null;
  handleChordHover: (chord: string) => void;
  handleChordLeave: () => void;
}

const AlternativeChordRepresentation: React.FC<Props> = ({
  chords,
  currentChordIndex,
  handleChordHover,
  handleChordLeave,
}) => {
  const parsedChords: ChordInfo[] = chords.map((chord) => {
    const parsedChord: ParsedChord = parseChordName(chord);
    return {
      chord,
      root: parsedChord.root,
      suffix: parsedChord.suffix,
      isMajor: parsedChord.isMajor,
      isMinor: parsedChord.isMinor,
    };
  });

  return (
    <div className="alternative-chord-representation">
      <div className="chord-line">
        {parsedChords.map((chordInfo, index) => (
          <span
            key={`line-${index}`}
            className={
              currentChordIndex === index ? "chord highlight" : "chord"
            }
            onMouseEnter={() => handleChordHover(chordInfo.chord)}
            onMouseLeave={handleChordLeave}
            style={{ margin: "0 5px", cursor: "pointer" }}
          >
            {chordInfo.chord}
          </span>
        ))}
      </div>
      <div style={{ marginTop: "50px" }}>
        {parsedChords.map((chordInfo, index) => (
          <span
            key={`category-${index}`}
            className={
              currentChordIndex === index ? "chord highlight" : "chord"
            }
            onMouseEnter={() => handleChordHover(chordInfo.chord)}
            onMouseLeave={handleChordLeave}
            style={{
              display: "inline",
              width: "10px",
              margin: "0 5px",
              cursor: "pointer",
              position: "relative",
              top: chordInfo.isMinor
                ? "-30px"
                : chordInfo.isMajor
                ? "30px"
                : "0",
            }}
          >
            {chordInfo.chord}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AlternativeChordRepresentation;
