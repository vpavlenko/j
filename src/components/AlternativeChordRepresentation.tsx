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
    <div
      className="alternative-chord-representation"
      style={{ overflowX: "auto", whiteSpace: "nowrap" }}
    >
      {/* First repetition - unchanged */}
      <div className="chord-line" style={{ whiteSpace: "nowrap" }}>
        {parsedChords.map((chordInfo, index) => (
          <span
            key={`line-${index}`}
            className={
              currentChordIndex === index ? "chord highlight" : "chord"
            }
            onMouseEnter={() => handleChordHover(chordInfo.chord)}
            onMouseLeave={handleChordLeave}
            style={{
              display: "inline-block",
              width: "40px",
              margin: "0 5px",
              cursor: "pointer",
            }}
          >
            {chordInfo.chord}
          </span>
        ))}
      </div>

      {/* Second repetition - without root difference numbers */}
      <div style={{ marginTop: "50px", whiteSpace: "nowrap" }}>
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
              width: "40px",
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
      <div
        style={{
          marginTop: "150px",
          position: "relative",
          whiteSpace: "nowrap",
        }}
      >
        {parsedChords.map((chordInfo, index) => (
          <div
            key={`category-third-${index}`}
            style={{
              display: "inline-block",
              width: "40px",
              position: "relative",
            }}
          >
            <span
              className={
                currentChordIndex === index ? "chord highlight" : "chord"
              }
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
              style={{
                display: "inline-block",
                width: "30px",
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
                  position: "absolute",
                  transform: "translate(-140%, 30%)",
                  fontSize: "0.7em",
                  color: "red",
                  zIndex: 1,
                }}
              >
                {getRootDifference(
                  chordInfo.root,
                  parsedChords[index + 1].root
                )}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Fourth repetition - simplified suffixes with root difference numbers */}
      <div
        style={{
          marginTop: "150px",
          position: "relative",
          whiteSpace: "nowrap",
        }}
      >
        {parsedChords.map((chordInfo, index) => (
          <div
            key={`category-fourth-${index}`}
            style={{
              display: "inline-block",
              width: "40px",
              position: "relative",
            }}
          >
            <span
              className={
                currentChordIndex === index ? "chord highlight" : "chord"
              }
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
              style={{
                display: "inline-block",
                width: "30px",
                cursor: "pointer",
                position: "relative",
                top: chordInfo.isMinor
                  ? "-30px"
                  : chordInfo.isMajor
                  ? "30px"
                  : "0",
              }}
            >
              {chordInfo.isMajor
                ? "."
                : chordInfo.isMinor
                ? "m"
                : chordInfo.suffix || ""}
            </span>
            {index < parsedChords.length - 1 && (
              <span
                style={{
                  position: "absolute",
                  transform: "translate(-140%, 30%)",
                  fontSize: "0.7em",
                  color: "red",
                  zIndex: 1,
                }}
              >
                {getRootDifference(
                  chordInfo.root,
                  parsedChords[index + 1].root
                )}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlternativeChordRepresentation;
