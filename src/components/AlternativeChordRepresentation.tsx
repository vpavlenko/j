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
      <div
        className="chord-categories"
        style={{ position: "relative", height: "3em" }}
      >
        <div
          className="minor-chords"
          style={{ position: "absolute", top: 0, left: 0, right: 0 }}
        >
          {parsedChords.map((chordInfo, index) => (
            <span
              key={`minor-${index}`}
              className={
                currentChordIndex === index && chordInfo.isMinor
                  ? "chord highlight"
                  : "chord"
              }
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
              style={{
                display: "inline-block",
                width: "10px",
                margin: "0 5px",
                cursor: "pointer",
                visibility: chordInfo.isMinor ? "visible" : "hidden",
              }}
            >
              {chordInfo.isMinor ? chordInfo.chord : "\u00A0"}
            </span>
          ))}
        </div>
        <div
          className="dominant-chords"
          style={{ position: "absolute", top: "1em", left: 0, right: 0 }}
        >
          {parsedChords.map((chordInfo, index) => (
            <span
              key={`dominant-${index}`}
              className={
                currentChordIndex === index &&
                !chordInfo.isMajor &&
                !chordInfo.isMinor
                  ? "chord highlight"
                  : "chord"
              }
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
              style={{
                display: "inline-block",
                width: "10px",
                margin: "0 5px",
                cursor: "pointer",
                visibility:
                  !chordInfo.isMajor && !chordInfo.isMinor
                    ? "visible"
                    : "hidden",
              }}
            >
              {!chordInfo.isMajor && !chordInfo.isMinor
                ? chordInfo.chord
                : "\u00A0"}
            </span>
          ))}
        </div>
        <div
          className="major-chords"
          style={{ position: "absolute", top: "2em", left: 0, right: 0 }}
        >
          {parsedChords.map((chordInfo, index) => (
            <span
              key={`major-${index}`}
              className={
                currentChordIndex === index && chordInfo.isMajor
                  ? "chord highlight"
                  : "chord"
              }
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
              style={{
                display: "inline-block",
                width: "10px",
                margin: "0 5px",
                cursor: "pointer",
                visibility: chordInfo.isMajor ? "visible" : "hidden",
              }}
            >
              {chordInfo.isMajor ? chordInfo.chord : "\u00A0"}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlternativeChordRepresentation;
