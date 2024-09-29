import React, { useEffect, useMemo } from "react";
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

// Add these constants at the top of the file
const BASE_CHORD_HEIGHT = 30;
const ADDITIONAL_PADDING = 20;

// Add this new constant
const CHORD_LEVEL = {
  MINOR: 0,
  NEUTRAL: CHORD_VERTICAL_OFFSET,
  MAJOR: 2 * CHORD_VERTICAL_OFFSET,
};

// Move this function here
export const calculateVerticalOffset = (
  chords: SquashedChordInfo[]
): number => {
  const hasMinor = chords.some((chord) => chord.isMinor);
  const hasNeutral = chords.some((chord) => !chord.isMinor && !chord.isMajor);

  if (!hasMinor && !hasNeutral) {
    return 2 * CHORD_VERTICAL_OFFSET;
  } else if (!hasMinor) {
    return CHORD_VERTICAL_OFFSET;
  }
  return 0;
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

const ChordSpan = styled.span.attrs<{
  $left: number;
  $top: number;
  $backgroundColor: string;
}>((props) => ({
  style: {
    left: `${props.$left}px`,
    top: `${props.$top}px`,
    backgroundColor: props.$backgroundColor,
  },
}))<{
  $highlight: boolean;
}>`
  position: absolute;
  ${(props) =>
    props.$highlight &&
    `
    font-weight: bold;
    text-decoration: underline;
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

const RootDifference = styled.span<{ $backgroundColor: string; $left: number }>`
  position: absolute;
  left: ${(props) => props.$left}px;
  top: 0px;
  width: ${GAP_WIDTH}px;
  height: ${GAP_WIDTH}px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.8em;
  background-color: ${(props) => props.$backgroundColor};
  color: ${(props) => getContrastColor(props.$backgroundColor)};
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
  // Add this line
  verticalOffset?: number;
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
  top?: number; // Change this to number
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
    $highlight={highlight}
    $left={left}
    $top={top ?? 0} // Use nullish coalescing to default to 0
    $backgroundColor="transparent"
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onClick={onClick}
  >
    <ChordRoot>{root}</ChordRoot>
    <ChordSuffix>
      <FormattedChordSuffix suffix={suffix || "M"} />
    </ChordSuffix>
  </ChordSpan>
);

export function calculateTotalWidth(chords: SquashedChordInfo[]): number {
  return chords.length * (CHORD_WIDTH + GAP_WIDTH);
}

// Add this function to calculate the total height
export function calculateTotalHeight(chords: SquashedChordInfo[]): number {
  const maxOffset = Math.max(
    ...chords.map((chord) =>
      chord.isMinor
        ? 0
        : chord.isMajor
        ? CHORD_VERTICAL_OFFSET * 2
        : CHORD_VERTICAL_OFFSET
    )
  );
  return BASE_CHORD_HEIGHT + maxOffset + ADDITIONAL_PADDING;
}

// Add this interface definition
export interface ChordLineProps {
  repLevel: number;
  chords: SquashedChordInfo[];
  currentChordIndex: number | null;
  handleChordHover: (chord: string) => void;
  handleChordLeave: () => void;
  playChord: (chord: string) => void;
  showOnlyLastRep?: boolean;
  directIndex?: number | null;
  verticalOffset?: number;
}

const ChordBox = styled.div<{
  $isHighlighted: boolean;
  $isHovered: boolean;
  $isAvailable: boolean;
}>`
  display: inline-block;
  padding: 2px 4px;
  margin: 2px;
  border: 1px solid ${(props) => (props.$isAvailable ? "#ccc" : "red")};
  border-radius: 4px;
  cursor: pointer;
  background-color: ${(props) =>
    props.$isHighlighted ? "yellow" : props.$isHovered ? "#f0f0f0" : "white"};
  color: ${(props) => (props.$isAvailable ? "black" : "red")};
`;

export const ChordLine: React.FC<ChordLineProps> = ({
  repLevel,
  chords,
  currentChordIndex,
  handleChordHover,
  handleChordLeave,
  playChord,
  showOnlyLastRep = false,
  directIndex = null,
  verticalOffset = 0,
  totalWidth = 0,
  totalHeight = 0,
}) => {
  console.log("ChordLine rendered with:", {
    repLevel,
    currentChordIndex,
    showOnlyLastRep,
    directIndex,
  });

  const renderChord = (chordInfo: SquashedChordInfo, index: number) => {
    const shouldHighlight = showOnlyLastRep
      ? directIndex === index
      : currentChordIndex !== null &&
        currentChordIndex >= chordInfo.startIndex &&
        currentChordIndex <= chordInfo.endIndex;

    console.log(
      "Rendering chord:",
      chordInfo.chord,
      "at index:",
      index,
      "shouldHighlight:",
      shouldHighlight
    );

    const chordLevel = getChordLevel(chordInfo, verticalOffset);

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
            top={chordLevel} // Pass chordLevel as a number
          />
        );
      case 3:
      case 4:
        return (
          <React.Fragment key={`rep-${repLevel}-${index}`}>
            <ChordSpan
              $highlight={shouldHighlight}
              $left={index * (CHORD_WIDTH + GAP_WIDTH)}
              $top={chordLevel}
              $backgroundColor="transparent"
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
              onClick={() => playChord(chordInfo.chord)}
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
              chordLevel,
              verticalOffset
            )}
          </React.Fragment>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`chord-line rep-${repLevel}`}
      style={{
        transform: `translateY(${verticalOffset}px)`,
        width: totalWidth ? `${totalWidth}px` : "auto",
        height: totalHeight ? `${totalHeight}px` : "auto",
      }}
    >
      {chords.map(renderChord)}
    </div>
  );
};

const getChordLevel = (
  chord: SquashedChordInfo,
  verticalOffset: number
): number => {
  if (chord.isMinor) return CHORD_LEVEL.MINOR - verticalOffset;
  if (chord.isMajor) return CHORD_LEVEL.MAJOR - verticalOffset;
  return CHORD_LEVEL.NEUTRAL - verticalOffset;
};

const renderRootDifference = (
  currentChord: SquashedChordInfo,
  nextChord: SquashedChordInfo,
  left: number,
  chordLevel: number,
  verticalOffset: number
) => {
  const difference = getRootDifference(currentChord.root, nextChord.root);
  const nextLevel = getChordLevel(nextChord, verticalOffset);
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
      $backgroundColor={backgroundColor}
      $left={left}
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
  console.log("AlternativeChordRepresentation rendered with:", {
    currentChordIndex,
    showOnlyLastRep,
    directIndex,
  });

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

  const verticalOffset = calculateVerticalOffset(squashedChords);
  const totalWidth = useMemo(
    () => calculateTotalWidth(squashedChords),
    [squashedChords]
  );
  const totalHeight = useMemo(
    () => calculateTotalHeight(squashedChords),
    [squashedChords]
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
            verticalOffset={verticalOffset}
            totalWidth={totalWidth}
            totalHeight={totalHeight}
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
                verticalOffset={verticalOffset}
                totalWidth={totalWidth}
                totalHeight={totalHeight}
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
                verticalOffset={verticalOffset}
                totalWidth={totalWidth}
                totalHeight={totalHeight}
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
                verticalOffset={verticalOffset}
                totalWidth={totalWidth}
                totalHeight={totalHeight}
              />
            </div>
          </>
        )}
      </ChordLinesWrapper>
    </AlternativeChordContainer>
  );
};

export default AlternativeChordRepresentation;
