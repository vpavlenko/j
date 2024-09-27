import React from "react";
import { ParsedChord, parseChordName } from "../helpers/chordParser";
import { getRootDifference } from "../utils";
import styled from "styled-components";

// Add this constant at the top of the file, after the imports
const CHORD_VERTICAL_OFFSET = 10;

// Update these styled components
const AlternativeChordContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: auto;
`;

const ChordLinesWrapper = styled.div`
  padding: 20px 0;
`;

const ChordLine = styled.div`
  white-space: nowrap;
  margin-bottom: 20px;
  position: relative;
`;

const ChordSpan = styled.span<{ highlight?: boolean; top?: string }>`
  display: inline-block;
  width: 30px;
  margin: 0 2px;
  cursor: pointer;
  position: relative;
  top: ${(props) => props.top || "0"};
  line-height: 0.9;
  ${(props) =>
    props.highlight &&
    `
    background-color: yellow;
    font-weight: bold;
  `}
`;

const ChordRoot = styled.div`
  font-weight: normal;
`;

const ChordSuffix = styled.div`
  font-size: 0.8em;
  font-weight: bold;
`;

const RootDifference = styled.span`
  position: absolute;
  transform: translate(-300%, 30%);
  font-size: 0.7em;
  color: red;
  font-weight: bold;
  z-index: 1;
`;

interface ChordInfo {
  chord: string;
  root: string;
  originalRoot: string;
  suffix: string;
  originalSuffix: string;
  isMajor: boolean;
  isMinor: boolean;
}

interface Props {
  chords: string[];
  currentChordIndex: number | null;
  handleChordHover: (chord: string) => void;
  handleChordLeave: () => void;
}

const TwoLineChord: React.FC<{
  chord: string;
  root: string;
  suffix: string;
  highlight: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  top?: string;
}> = ({ root, suffix, highlight, onMouseEnter, onMouseLeave, top }) => (
  <ChordSpan
    highlight={highlight}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    top={top}
  >
    <ChordRoot>{root}</ChordRoot>
    <ChordSuffix>{suffix || "M"}</ChordSuffix>
  </ChordSpan>
);

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
      originalRoot: parsedChord.originalRoot,
      suffix: parsedChord.suffix,
      originalSuffix: parsedChord.originalSuffix,
      isMajor: parsedChord.isMajor,
      isMinor: parsedChord.isMinor,
    };
  });

  return (
    <AlternativeChordContainer>
      <ChordLinesWrapper>
        {/* First repetition */}
        <ChordLine>
          {parsedChords.map((chordInfo, index) => (
            <TwoLineChord
              key={`line-1-${index}`}
              chord={chordInfo.chord}
              root={chordInfo.originalRoot}
              suffix={chordInfo.originalSuffix}
              highlight={currentChordIndex === index}
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
            />
          ))}
        </ChordLine>

        {/* Second repetition */}
        <ChordLine style={{ marginTop: "50px" }}>
          {parsedChords.map((chordInfo, index) => (
            <TwoLineChord
              key={`line-2-${index}`}
              chord={chordInfo.chord}
              root={chordInfo.originalRoot}
              suffix={chordInfo.originalSuffix}
              highlight={currentChordIndex === index}
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
              top={
                chordInfo.isMinor
                  ? `-${CHORD_VERTICAL_OFFSET}px`
                  : chordInfo.isMajor
                  ? `${CHORD_VERTICAL_OFFSET}px`
                  : "0"
              }
            />
          ))}
        </ChordLine>

        {/* Third repetition - with root difference numbers */}
        <ChordLine style={{ marginTop: "100px" }}>
          {parsedChords.map((chordInfo, index) => (
            <div
              key={`line-3-${index}`}
              style={{
                display: "inline-block",
                width: "30px",
                position: "relative",
              }}
            >
              {index < parsedChords.length - 1 && (
                <RootDifference>
                  {getRootDifference(
                    chordInfo.originalRoot,
                    parsedChords[index + 1].originalRoot
                  )}
                </RootDifference>
              )}
              <TwoLineChord
                chord={chordInfo.chord}
                root={chordInfo.originalRoot}
                suffix={chordInfo.originalSuffix}
                highlight={currentChordIndex === index}
                onMouseEnter={() => handleChordHover(chordInfo.chord)}
                onMouseLeave={handleChordLeave}
                top={
                  chordInfo.isMinor
                    ? `-${CHORD_VERTICAL_OFFSET}px`
                    : chordInfo.isMajor
                    ? `${CHORD_VERTICAL_OFFSET}px`
                    : "0"
                }
              />
            </div>
          ))}
        </ChordLine>

        {/* Fourth repetition - simplified suffixes with root difference numbers */}
        <ChordLine style={{ marginTop: "100px" }}>
          {parsedChords.map((chordInfo, index) => (
            <div
              key={`line-4-${index}`}
              style={{
                display: "inline-block",
                width: "30px",
                position: "relative",
              }}
            >
              {index < parsedChords.length - 1 && (
                <RootDifference>
                  {getRootDifference(
                    chordInfo.originalRoot,
                    parsedChords[index + 1].originalRoot
                  )}
                </RootDifference>
              )}
              <ChordSpan
                highlight={currentChordIndex === index}
                onMouseEnter={() => handleChordHover(chordInfo.chord)}
                onMouseLeave={handleChordLeave}
                top={
                  chordInfo.isMinor
                    ? `-${CHORD_VERTICAL_OFFSET}px`
                    : chordInfo.isMajor
                    ? `${CHORD_VERTICAL_OFFSET}px`
                    : "0"
                }
              >
                {chordInfo.originalSuffix}
              </ChordSpan>
            </div>
          ))}
        </ChordLine>
      </ChordLinesWrapper>
    </AlternativeChordContainer>
  );
};

export default AlternativeChordRepresentation;
