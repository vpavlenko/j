import React from "react";
import { ParsedChord, parseChordName } from "../helpers/chordParser";
import { getRootDifference } from "../utils"; // We'll need to create this function
import styled from "styled-components";

// Update these styled components
const AlternativeChordContainer = styled.div`
  overflow-x: auto;
  white-space: nowrap;
  width: 100%;
`;

const ChordLine = styled.div`
  white-space: nowrap;
  margin-bottom: 20px;
`;

const ChordSpan = styled.span<{ highlight?: boolean; top?: string }>`
  display: inline-block;
  width: 40px;
  margin: 0 5px;
  cursor: pointer;
  position: relative;
  top: ${(props) => props.top || "0"};
  ${(props) =>
    props.highlight &&
    `
    background-color: yellow;
    font-weight: bold;
  `}
`;

const RootDifference = styled.span`
  position: absolute;
  transform: translate(-140%, 30%);
  font-size: 0.7em;
  color: red;
  z-index: 1;
`;

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
    <AlternativeChordContainer>
      <ChordLine>
        {parsedChords.map((chordInfo, index) => (
          <ChordSpan
            key={`line-${index}`}
            highlight={currentChordIndex === index}
            onMouseEnter={() => handleChordHover(chordInfo.chord)}
            onMouseLeave={handleChordLeave}
          >
            {chordInfo.chord}
          </ChordSpan>
        ))}
      </ChordLine>

      {/* Second repetition */}
      <ChordLine style={{ marginTop: "50px" }}>
        {parsedChords.map((chordInfo, index) => (
          <ChordSpan
            key={`category-second-${index}`}
            highlight={currentChordIndex === index}
            onMouseEnter={() => handleChordHover(chordInfo.chord)}
            onMouseLeave={handleChordLeave}
            top={chordInfo.isMinor ? "-30px" : chordInfo.isMajor ? "30px" : "0"}
          >
            {chordInfo.chord}
          </ChordSpan>
        ))}
      </ChordLine>

      {/* Third repetition - with root difference numbers */}
      <ChordLine
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
            <ChordSpan
              className={
                currentChordIndex === index ? "chord highlight" : "chord"
              }
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
              style={{
                display: "inline-block",
                width: "00px",
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
            </ChordSpan>
            {index < parsedChords.length - 1 && (
              <RootDifference>
                {getRootDifference(
                  chordInfo.root,
                  parsedChords[index + 1].root
                )}
              </RootDifference>
            )}
          </div>
        ))}
      </ChordLine>

      {/* Fourth repetition - simplified suffixes with root difference numbers */}
      <ChordLine
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
            <ChordSpan
              className={
                currentChordIndex === index ? "chord highlight" : "chord"
              }
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
              style={{
                display: "inline-block",
                width: "00px",
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
            </ChordSpan>
            {index < parsedChords.length - 1 && (
              <RootDifference>
                {getRootDifference(
                  chordInfo.root,
                  parsedChords[index + 1].root
                )}
              </RootDifference>
            )}
          </div>
        ))}
      </ChordLine>
    </AlternativeChordContainer>
  );
};

export default AlternativeChordRepresentation;
