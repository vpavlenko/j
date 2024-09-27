import React from "react";
import { ParsedChord, parseChordName } from "../helpers/chordParser";
import { getRootDifference } from "../utils";
import styled from "styled-components";

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
  ${(props) =>
    props.highlight &&
    `
    background-color: yellow;
    font-weight: bold;
  `}
`;

const ChordRoot = styled.div`
  font-weight: bold;
`;

const ChordSuffix = styled.div`
  font-size: 0.8em;
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
    <ChordSuffix>{suffix}</ChordSuffix>
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
      suffix: parsedChord.suffix,
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
              root={chordInfo.root}
              suffix={chordInfo.suffix}
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
              root={chordInfo.root}
              suffix={chordInfo.suffix}
              highlight={currentChordIndex === index}
              onMouseEnter={() => handleChordHover(chordInfo.chord)}
              onMouseLeave={handleChordLeave}
              top={
                chordInfo.isMinor ? "-30px" : chordInfo.isMajor ? "30px" : "0"
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
              <TwoLineChord
                chord={chordInfo.chord}
                root={chordInfo.root}
                suffix={chordInfo.suffix}
                highlight={currentChordIndex === index}
                onMouseEnter={() => handleChordHover(chordInfo.chord)}
                onMouseLeave={handleChordLeave}
                top={
                  chordInfo.isMinor ? "-30px" : chordInfo.isMajor ? "30px" : "0"
                }
              />
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
              <ChordSpan
                highlight={currentChordIndex === index}
                onMouseEnter={() => handleChordHover(chordInfo.chord)}
                onMouseLeave={handleChordLeave}
                top={
                  chordInfo.isMinor ? "-30px" : chordInfo.isMajor ? "30px" : "0"
                }
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
      </ChordLinesWrapper>
    </AlternativeChordContainer>
  );
};

export default AlternativeChordRepresentation;
