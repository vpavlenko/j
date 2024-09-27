import React from "react";
import { ParsedChord, parseChordName } from "../helpers/chordParser";
import {
  getRootDifference,
  getRootDifferenceColor,
  getContrastColor,
} from "../utils";
import styled from "styled-components";

// Add these constants at the top of the file, after the imports
const CHORD_WIDTH = 17;
const GAP_WIDTH = 12;
const CHORD_VERTICAL_OFFSET = 20;

// Add this new constant
const CHORD_LEVEL = {
  MINOR: -CHORD_VERTICAL_OFFSET,
  NEUTRAL: 0,
  MAJOR: CHORD_VERTICAL_OFFSET,
};

// Update these styled components
const AlternativeChordContainer = styled.div<{
  disableVerticalScroll?: boolean;
}>`
  width: 100%;
  height: 100%;
  overflow-y: ${(props) => (props.disableVerticalScroll ? "hidden" : "auto")};
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
  font-size: 0.8em;
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
  playChord: (chord: string) => void;
  showOnlyLastRep?: boolean; // Add this new prop
  disableVerticalScroll?: boolean; // Add this new prop
}

const TwoLineChord: React.FC<{
  chord: string;
  root: string;
  suffix: string;
  highlight: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
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
    onClick={onClick}
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
  playChord,
  showOnlyLastRep = false, // Add this new prop with a default value
  disableVerticalScroll = false, // Add this new prop with a default value
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

  const getChordLevel = (chord: SquashedChordInfo): number => {
    if (chord.isMinor) return CHORD_LEVEL.MINOR;
    if (chord.isMajor) return CHORD_LEVEL.MAJOR;
    return CHORD_LEVEL.NEUTRAL;
  };

  const renderRootDifference = (
    currentChord: SquashedChordInfo,
    nextChord: SquashedChordInfo,
    left: number
  ) => {
    const difference = getRootDifference(currentChord.root, nextChord.root);
    const backgroundColor =
      difference === "?"
        ? "gray"
        : getRootDifferenceColor(parseInt(difference, 10));

    const currentLevel = getChordLevel(currentChord);
    const nextLevel = getChordLevel(nextChord);
    const averageLevel = (currentLevel + nextLevel) / 2;

    return (
      <RootDifference
        backgroundColor={backgroundColor}
        left={left}
        style={{ top: `${averageLevel + GAP_WIDTH * 0.7}px` }}
      >
        {difference}
      </RootDifference>
    );
  };

  return (
    <AlternativeChordContainer disableVerticalScroll={disableVerticalScroll}>
      <ChordLinesWrapper>
        {showOnlyLastRep ? (
          // Render only the last representation
          <ChordLine>
            {squashedChords.map((chordInfo, index) => (
              <React.Fragment key={`last-rep-${index}`}>
                <ChordSpan
                  highlight={
                    currentChordIndex !== null &&
                    currentChordIndex >= chordInfo.startIndex &&
                    currentChordIndex <= chordInfo.endIndex
                  }
                  onMouseEnter={() => handleChordHover(chordInfo.chord)}
                  onMouseLeave={handleChordLeave}
                  onClick={() => playChord(chordInfo.chord)}
                  left={index * (CHORD_WIDTH + GAP_WIDTH)}
                  top={`${getChordLevel(chordInfo)}px`}
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
        ) : (
          // Render all representations
          <>
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
                  onClick={() => playChord(chordInfo.chord)}
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
                  onClick={() => playChord(chordInfo.chord)}
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
                    onClick={() => playChord(chordInfo.chord)}
                    left={index * (CHORD_WIDTH + GAP_WIDTH)}
                    top={`${getChordLevel(chordInfo)}px`}
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
                    onClick={() => playChord(chordInfo.chord)}
                    left={index * (CHORD_WIDTH + GAP_WIDTH)}
                    top={`${getChordLevel(chordInfo)}px`}
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
          </>
        )}
      </ChordLinesWrapper>
    </AlternativeChordContainer>
  );
};

export default AlternativeChordRepresentation;
