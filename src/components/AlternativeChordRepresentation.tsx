import React from "react";
import { ParsedChord, parseChordName } from "../helpers/chordParser";
import {
  getRootDifference,
  getRootDifferenceColor,
  getContrastColor,
} from "../utils";
import styled from "styled-components";

// Add these constants at the top of the file, after the imports
const CHORD_WIDTH = 30;
const GAP_WIDTH = 15;
const CHORD_VERTICAL_OFFSET = 20;

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
  position: relative;
  height: 40px;
  margin-bottom: 60px;
`;

const ChordSpan = styled.span<{
  highlight?: boolean;
  left: number;
  top?: string;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: ${CHORD_WIDTH}px;
  height: 30px;
  position: absolute;
  left: ${(props) => props.left}px;
  top: ${(props) => props.top || "0"};
  cursor: pointer;
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
  color: gray;
`;

const ChordSuffix = styled.div`
  font-size: 0.8em;
  font-weight: bold;
`;

const RootDifference = styled.span<{ backgroundColor: string; left: number }>`
  position: absolute;
  left: ${(props) => props.left}px;
  top: 0px;
  width: ${GAP_WIDTH}px;
  height: ${GAP_WIDTH}px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 1.2em;
  background-color: ${(props) => props.backgroundColor};
  color: ${(props) => getContrastColor(props.backgroundColor)};
  font-weight: bold;
  border-radius: 50%;
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
  // Add this new prop
  playChord: (chord: string) => void;
}

const TwoLineChord: React.FC<{
  chord: string;
  root: string;
  suffix: string;
  highlight: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void; // Add this new prop
  left: number;
  top?: string;
}> = ({
  root,
  suffix,
  highlight,
  onMouseEnter,
  onMouseLeave,
  onClick,
  left,
  top,
}) => (
  <ChordSpan
    highlight={highlight}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onClick={onClick} // Add this onClick handler
    left={left}
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
  playChord, // Add this new prop
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
    nextChord: ChordInfo,
    left: number
  ) => {
    const difference = getRootDifference(currentChord.root, nextChord.root);
    const backgroundColor =
      difference === "?"
        ? "gray"
        : getRootDifferenceColor(parseInt(difference, 10));

    return (
      <RootDifference backgroundColor={backgroundColor} left={left}>
        {difference}
      </RootDifference>
    );
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
              onClick={() => playChord(chordInfo.chord)} // Add this onClick handler
              left={index * (CHORD_WIDTH + GAP_WIDTH)}
            />
          ))}
        </ChordLine>

        {/* Second repetition - squashed chords */}
        <ChordLine>
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
              onClick={() => playChord(chordInfo.chord)} // Add this onClick handler
              left={index * (CHORD_WIDTH + GAP_WIDTH)}
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
        <ChordLine>
          {squashedChords.map((chordInfo, index) => (
            <React.Fragment key={`line-3-${index}`}>
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
                onClick={() => playChord(chordInfo.chord)} // Add this onClick handler
                left={index * (CHORD_WIDTH + GAP_WIDTH)}
                top={
                  chordInfo.isMinor
                    ? `-${CHORD_VERTICAL_OFFSET}px`
                    : chordInfo.isMajor
                    ? `${CHORD_VERTICAL_OFFSET}px`
                    : "0"
                }
              />
              {index < squashedChords.length - 1 &&
                renderRootDifference(
                  chordInfo,
                  squashedChords[index + 1],
                  index * (CHORD_WIDTH + GAP_WIDTH) + CHORD_WIDTH
                )}
            </React.Fragment>
          ))}
        </ChordLine>

        {/* Fourth repetition - simplified suffixes with root difference numbers */}
        <ChordLine>
          {squashedChords.map((chordInfo, index) => (
            <React.Fragment key={`line-4-${index}`}>
              <ChordSpan
                highlight={
                  currentChordIndex !== null &&
                  currentChordIndex >= chordInfo.startIndex &&
                  currentChordIndex <= chordInfo.endIndex
                }
                onMouseEnter={() => handleChordHover(chordInfo.chord)}
                onMouseLeave={handleChordLeave}
                onClick={() => playChord(chordInfo.chord)} // Add this onClick handler
                left={index * (CHORD_WIDTH + GAP_WIDTH)}
                top={
                  chordInfo.isMinor
                    ? `-${CHORD_VERTICAL_OFFSET}px`
                    : chordInfo.isMajor
                    ? `${CHORD_VERTICAL_OFFSET}px`
                    : "0"
                }
              >
                {chordInfo.originalSuffix || "M"}
              </ChordSpan>
              {index < squashedChords.length - 1 &&
                renderRootDifference(
                  chordInfo,
                  squashedChords[index + 1],
                  index * (CHORD_WIDTH + GAP_WIDTH) + CHORD_WIDTH
                )}
            </React.Fragment>
          ))}
        </ChordLine>
      </ChordLinesWrapper>
    </AlternativeChordContainer>
  );
};

export default AlternativeChordRepresentation;
