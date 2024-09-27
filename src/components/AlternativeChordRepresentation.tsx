import React from "react";
import { ParsedChord, parseChordName } from "../helpers/chordParser";
import { getRootDifference } from "../utils"; // We'll need to create this function

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
      {/* First repetition - unchanged */}
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

      {/* Second repetition - without root difference numbers */}
      <div style={{ marginTop: "50px" }}>
        {parsedChords.map((chordInfo, index) => (
          <span
            key={`category-second-${index}`}
            className={
              currentChordIndex === index ? "chord highlight" : "chord"
            }
            onMouseEnter={() => handleChordHover(chordInfo.chord)}
            onMouseLeave={handleChordLeave}
            style={{
              display: "inline-block",
              width: "30px",
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

      {/* Third repetition - with root difference numbers */}
      <div style={{ marginTop: "150px", position: "relative" }}>
        {parsedChords.map((chordInfo, index) => (
          <React.Fragment key={`category-third-${index}`}>
            <span
              className={
                currentChordIndex === index ? "chord highlight" : "chord"
              }
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
              style={{
                display: "inline-block",
                width: "30px",
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
            {index < parsedChords.length - 1 && (
              <span
                style={{
                  display: "inline-block",
                  width: "15px",
                  fontSize: "0.7em",
                  color: "red",
                  position: "relative",
                  top: "0",
                }}
              >
                {getRootDifference(
                  chordInfo.root,
                  parsedChords[index + 1].root
                )}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default AlternativeChordRepresentation;
