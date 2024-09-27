import React from "react";
import { ParsedChord, parseChordName } from "../helpers/chordParser";
import { getRootDifference, getRootDifferenceColor } from "../utils";
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

const RootDifference = styled.span<{ color: string }>`
  position: absolute;
  transform: translate(150%, -200%);
  font-size: 1.2em;
  color: ${(props) => props.color};
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

interface SquashedChordInfo extends ChordInfo {
  startIndex: number;
  endIndex: number;
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

  const squashedChords: SquashedChordInfo[] = parsedChords.reduce(
    (acc: SquashedChordInfo[], curr: ChordInfo, index: number) => {
      if (index === 0 || curr.chord !== parsedChords[index - 1].chord) {
        acc.push({ ...curr, startIndex: index, endIndex: index });
      } else {
        acc[acc.length - 1].endIndex = index;
      }
      return acc;
    },
    []
  );

  const renderRootDifference = (
    currentChord: ChordInfo,
    nextChord: ChordInfo
  ) => {
    const difference = getRootDifference(currentChord.root, nextChord.root);
    const color =
      difference === "?"
        ? "gray"
        : getRootDifferenceColor(parseInt(difference, 10));

    return <RootDifference color={color}>{difference}</RootDifference>;
  };

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

        {/* Duplicate of first repetition */}
        <ChordLine style={{ marginTop: "50px" }}>
          {parsedChords.map((chordInfo, index) => (
            <TwoLineChord
              key={`line-1b-${index}`}
              chord={chordInfo.chord}
              root={chordInfo.originalRoot}
              suffix={chordInfo.originalSuffix}
              highlight={currentChordIndex === index}
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
            />
          ))}
        </ChordLine>

        {/* Second repetition - squashed chords */}
        <ChordLine style={{ marginTop: "50px" }}>
          {squashedChords.map((chordInfo, index) => (
            <TwoLineChord
              key={`line-2-${index}`}
              chord={chordInfo.chord}
              root={chordInfo.originalRoot}
              suffix={chordInfo.originalSuffix}
              highlight={
                currentChordIndex !== null &&
                currentChordIndex >= chordInfo.startIndex &&
                currentChordIndex <= chordInfo.endIndex
              }
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
          {squashedChords.map((chordInfo, index) => (
            <div
              key={`line-3-${index}`}
              style={{
                display: "inline-block",
                width: "30px",
                position: "relative",
              }}
            >
              {index < squashedChords.length - 1 &&
                renderRootDifference(chordInfo, squashedChords[index + 1])}
              <TwoLineChord
                chord={chordInfo.chord}
                root={chordInfo.originalRoot}
                suffix={chordInfo.originalSuffix}
                highlight={
                  currentChordIndex !== null &&
                  currentChordIndex >= chordInfo.startIndex &&
                  currentChordIndex <= chordInfo.endIndex
                }
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
          {squashedChords.map((chordInfo, index) => (
            <div
              key={`line-4-${index}`}
              style={{
                display: "inline-block",
                width: "30px",
                position: "relative",
              }}
            >
              {index < squashedChords.length - 1 &&
                renderRootDifference(chordInfo, squashedChords[index + 1])}
              <ChordSpan
                highlight={
                  currentChordIndex !== null &&
                  currentChordIndex >= chordInfo.startIndex &&
                  currentChordIndex <= chordInfo.endIndex
                }
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
