import React, { useEffect } from "react";
import { ParsedChord, parseChordName } from "../helpers/chordParser";
import {
  getRootDifference,
  getRootDifferenceColor,
  getContrastColor,
} from "../utils";
import styled from "styled-components";

// Add these constants at the top of the file, after the imports
const CHORD_WIDTH = 12;
const GAP_WIDTH = 12;
const CHORD_VERTICAL_OFFSET = 15;
const ROOT_DIFFERENCE_OFFSET = -1;

// Add this new constant
const CHORD_LEVEL = {
  MINOR: 0,
  NEUTRAL: CHORD_VERTICAL_OFFSET,
  MAJOR: 2 * CHORD_VERTICAL_OFFSET,
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

// Rename the styled ChordLine component to ChordLineWrapper
const ChordLineWrapper = styled.div`
  position: relative;
  height: 40px;
  margin-bottom: 10px;
  margin-top: 5px;
`;

const ChordSpan = styled.span<{
  highlight?: boolean;
  left: number;
  top?: string;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
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
  display: flex;
  align-items: baseline;
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

export interface ChordInfo {
  chord: string;
  root: string;
  originalRoot: string;
  suffix: string;
  originalSuffix: string;
  isMajor: boolean;
  isMinor: boolean;
}

export interface SquashedChordInfo extends ChordInfo {
  startIndex: number;
  endIndex: number;
}

interface Props {
  chords: string[];
  currentChordIndex: number | null;
  handleChordHover: (chord: string) => void;
  handleChordLeave: () => void;
  playChord: (chord: string) => void;
  showOnlyLastRep?: boolean;
  disableVerticalScroll?: boolean;
  directIndex?: number | null;
}

const FormattedChordSuffix: React.FC<{ suffix: string }> = ({ suffix }) => {
  const prefixRegex = /^(maj|7|M|m|o|9|11|13)/;
  const match = suffix.match(prefixRegex);

  if (match) {
    const prefix = match[0];
    const postfix = suffix.slice(prefix.length);
    return (
      <span
        style={{
          whiteSpace: "nowrap",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          height: "100%",
        }}
      >
        <span style={{ lineHeight: "1" }}>{prefix}</span>
        <span style={{ fontSize: "0.7em", color: "gray", lineHeight: "1" }}>
          {postfix}
        </span>
      </span>
    );
  }

  return <>{suffix}</>;
};

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
    <ChordSuffix>
      <FormattedChordSuffix suffix={suffix || "M"} />
    </ChordSuffix>
  </ChordSpan>
);

export const ChordLine: React.FC<{
  repLevel: number;
  chords: SquashedChordInfo[];
  currentChordIndex: number | null;
  handleChordHover: (chord: string) => void;
  handleChordLeave: () => void;
  playChord: (chord: string) => void;
  showOnlyLastRep?: boolean;
  directIndex?: number | null;
}> = ({
  repLevel,
  chords,
  currentChordIndex,
  handleChordHover,
  handleChordLeave,
  playChord,
  showOnlyLastRep,
  directIndex,
}) => {
  const renderChord = (chordInfo: SquashedChordInfo, index: number) => {
    const shouldHighlight = showOnlyLastRep
      ? directIndex === index
      : currentChordIndex !== null &&
        currentChordIndex >= chordInfo.startIndex &&
        currentChordIndex <= chordInfo.endIndex;

    const chordLevel = getChordLevel(chordInfo);

    switch (repLevel) {
      case 1:
        return (
          <TwoLineChord
            key={`rep-${repLevel}-${index}`}
            chord={chordInfo.chord}
            root={chordInfo.originalRoot}
            suffix={chordInfo.originalSuffix}
            highlight={shouldHighlight}
            onMouseEnter={() => handleChordHover(chordInfo.chord)}
            onMouseLeave={handleChordLeave}
            onClick={() => playChord(chordInfo.chord)}
            left={index * (CHORD_WIDTH + GAP_WIDTH)}
          />
        );
      case 2:
        return (
          <TwoLineChord
            key={`rep-${repLevel}-${index}`}
            chord={chordInfo.chord}
            root={chordInfo.originalRoot}
            suffix={chordInfo.originalSuffix}
            highlight={shouldHighlight}
            onMouseEnter={() => handleChordHover(chordInfo.chord)}
            onMouseLeave={handleChordLeave}
            onClick={() => playChord(chordInfo.chord)}
            left={index * (CHORD_WIDTH + GAP_WIDTH)}
            top={`${chordLevel}px`}
          />
        );
      case 3:
      case 4:
        return (
          <React.Fragment key={`rep-${repLevel}-${index}`}>
            <ChordSpan
              highlight={shouldHighlight}
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
              onClick={() => playChord(chordInfo.chord)}
              left={index * (CHORD_WIDTH + GAP_WIDTH)}
              top={`${chordLevel}px`}
            >
              {repLevel === 3 ? (
                <TwoLineChord
                  chord={chordInfo.chord}
                  root={chordInfo.originalRoot}
                  suffix={chordInfo.originalSuffix}
                  highlight={shouldHighlight}
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                  onClick={() => {}}
                  left={0}
                />
              ) : (
                <FormattedChordSuffix
                  suffix={chordInfo.originalSuffix || "M"}
                />
              )}
            </ChordSpan>
            {renderRootDifference(
              chordInfo,
              index < chords.length - 1 ? chords[index + 1] : chords[0],
              index * (CHORD_WIDTH + GAP_WIDTH) + CHORD_WIDTH,
              chordLevel
            )}
          </React.Fragment>
        );
      default:
        return null;
    }
  };

  return <ChordLineWrapper>{chords.map(renderChord)}</ChordLineWrapper>;
};

const getChordLevel = (chord: SquashedChordInfo): number => {
  if (chord.isMinor) return CHORD_LEVEL.MINOR;
  if (chord.isMajor) return CHORD_LEVEL.MAJOR;
  return CHORD_LEVEL.NEUTRAL;
};

const renderRootDifference = (
  currentChord: SquashedChordInfo,
  nextChord: SquashedChordInfo,
  left: number,
  chordLevel: number
) => {
  const difference = getRootDifference(currentChord.root, nextChord.root);
  const nextLevel = getChordLevel(nextChord);
  const averageLevel = (chordLevel + nextLevel) / 2;

  if (difference === "0") {
    return (
      <span
        style={{
          position: "absolute",
          left: `${left}px`,
          top: `${averageLevel + ROOT_DIFFERENCE_OFFSET}px`,
          width: `${GAP_WIDTH}px`,
          height: `${GAP_WIDTH}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.8em",
          fontWeight: "bold",
        }}
      >
        =
      </span>
    );
  }

  const backgroundColor =
    difference === "?"
      ? "gray"
      : getRootDifferenceColor(parseInt(difference, 10));

  return (
    <RootDifference
      backgroundColor={backgroundColor}
      left={left}
      style={{
        top: `${averageLevel + ROOT_DIFFERENCE_OFFSET}px`,
      }}
    >
      {difference}
    </RootDifference>
  );
};

const AlternativeChordRepresentation: React.FC<Props> = ({
  chords,
  currentChordIndex,
  handleChordHover,
  handleChordLeave,
  playChord,
  showOnlyLastRep = false,
  disableVerticalScroll = false,
  directIndex,
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

  useEffect(() => {
    return () => {
      handleChordLeave();
    };
  }, [handleChordLeave]);

  return (
    <AlternativeChordContainer disableVerticalScroll={disableVerticalScroll}>
      <ChordLinesWrapper>
        {showOnlyLastRep ? (
          <ChordLine
            repLevel={4}
            chords={squashedChords}
            currentChordIndex={currentChordIndex}
            handleChordHover={handleChordHover}
            handleChordLeave={handleChordLeave}
            playChord={playChord}
            showOnlyLastRep={showOnlyLastRep}
            directIndex={directIndex}
          />
        ) : (
          <>
            <div style={{ marginBottom: "60px" }}>
              <ChordLine
                repLevel={1}
                chords={parsedChords.map((chord, index) => ({
                  ...chord,
                  startIndex: index,
                  endIndex: index,
                }))}
                currentChordIndex={currentChordIndex}
                handleChordHover={handleChordHover}
                handleChordLeave={handleChordLeave}
                playChord={playChord}
              />
            </div>
            <div style={{ marginBottom: "60px" }}>
              <ChordLine
                repLevel={2}
                chords={squashedChords}
                currentChordIndex={currentChordIndex}
                handleChordHover={handleChordHover}
                handleChordLeave={handleChordLeave}
                playChord={playChord}
              />
            </div>
            <div style={{ marginBottom: "60px" }}>
              <ChordLine
                repLevel={3}
                chords={squashedChords}
                currentChordIndex={currentChordIndex}
                handleChordHover={handleChordHover}
                handleChordLeave={handleChordLeave}
                playChord={playChord}
              />
            </div>
            <div style={{ marginBottom: "60px" }}>
              <ChordLine
                repLevel={4}
                chords={squashedChords}
                currentChordIndex={currentChordIndex}
                handleChordHover={handleChordHover}
                handleChordLeave={handleChordLeave}
                playChord={playChord}
              />
            </div>
          </>
        )}
      </ChordLinesWrapper>
    </AlternativeChordContainer>
  );
};

export default AlternativeChordRepresentation;
