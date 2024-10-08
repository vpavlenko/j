import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import "./App.css";
import { CORPUS } from "./corpus";
import * as Tone from "tone";
import { Song } from "./corpus";
import guitarChords from "./guitarChords";
import { strum } from "./utils";
import { initializePiano } from "./helpers/pianoInitializer";
import {
  parseChordName,
  checkChordAvailability,
  ParsedChord,
} from "./helpers/chordParser";
import AlternativeChordRepresentation, {
  ChordLine,
  SquashedChordInfo,
  calculateVerticalOffset,
  ChordInfo,
  calculateTotalWidth,
  calculateTotalHeight,
  RootDifferenceLegend,
} from "./components/AlternativeChordRepresentation";
import styled from "styled-components";
import { Sampler } from "tone";
import { FaVolumeUp } from "react-icons/fa";
import { useInView } from "react-intersection-observer";

interface ChordEvent {
  chord: string;
  time: number;
  duration: number;
}

const TwoColumnLayout = styled.div`
  display: flex;
  width: 100%;
`;

const LeftColumn = styled.div`
  width: 200px;
  flex-shrink: 0;
  padding-right: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 100px);
`;

const RightColumn = styled.div`
  flex-grow: 1;
  overflow-x: auto;
`;

const SongListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SongItem = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 10px;
  margin-bottom: 10px;
  width: 100%;
`;

const SongLinkContainer = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
`;

const SongLink = styled.a<{ hasErrors?: boolean }>`
  text-decoration: none;
  color: ${(props) => (props.hasErrors ? "red" : "gray")};
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    text-decoration: underline;
  }
`;

const VolumeIcon = styled(FaVolumeUp)<{ $isPlaying: boolean }>`
  margin-left: 5px;
  cursor: pointer;
  color: ${(props) => (props.$isPlaying ? "#4CAF50" : "inherit")};
`;

const getSquashedChords = (chords: string[][]): SquashedChordInfo[] => {
  const flatChords = chords.flat().flatMap((chord) => chord.split(" "));

  const parsedChords: ChordInfo[] = flatChords.map((chord) => {
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

  return parsedChords.reduce(
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
};

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
`;

function App() {
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chordSequence, setChordSequence] = useState<ChordEvent[]>([]);
  const [sampler, setSampler] = useState<Sampler | null>(null);
  const bpm = 120;

  const [currentChordIndex, setCurrentChordIndex] = useState<number | null>(
    null
  );

  const [hoverInfo, setHoverInfo] = useState<{
    root: string;
    suffix: string;
    available: boolean;
  } | null>(null);

  const [songParsingErrors, setSongParsingErrors] = useState<{
    [key: string]: string[];
  }>({});

  const [hoverChord, setHoverChord] = useState<ParsedChord | null>(null);

  const [isHoveringChords, setIsHoveringChords] = useState(false);

  const [, setSongStats] = useState<{
    [key: string]: { nonParsedChords: number; distinctChords: number };
  }>({});

  const [hoveredSongs, setHoveredSongs] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [previewedSongs, setPreviewedSongs] = useState<{
    [key: string]: boolean;
  }>({});

  const [previewPlayingSong, setPreviewPlayingSong] = useState<string | null>(
    null
  );
  const [previewCurrentChordIndex, setPreviewCurrentChordIndex] = useState<
    number | null
  >(null);
  const previewCurrentChordIndexRef = useRef<number | null>(null);

  const [autoPreviewSongs] = useState<string[]>([]);

  const [processedSongs, setProcessedSongs] = useState<Song[]>([]);
  const [visibleSongs, setVisibleSongs] = useState<number>(20);
  const [parsedSongs, setParsedSongs] = useState<{ [key: string]: Song }>({});

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    if (inView) {
      setVisibleSongs((prevVisible) => prevVisible + 100);
    }
  }, [inView]);

  useEffect(() => {
    // Sort songs alphabetically and set them as processedSongs
    const sortedSongs = CORPUS.sort((a, b) => a.Title.localeCompare(b.Title));
    setProcessedSongs(sortedSongs);
  }, []);

  const parseChords = useCallback(
    (song: Song) => {
      if (parsedSongs[song.filename]) {
        return parsedSongs[song.filename];
      }

      // Perform chord parsing here
      const parsedChords = getSquashedChords(song.chords);
      const parsedSong = { ...song, parsedChords };

      setParsedSongs((prev) => ({ ...prev, [song.filename]: parsedSong }));
      return parsedSong;
    },
    [parsedSongs]
  );

  const stopAllPlayback = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (sampler) {
      sampler.releaseAll();
    }
    setIsPlaying(false);
    setCurrentChordIndex(null);
    setPreviewPlayingSong(null);
    setPreviewCurrentChordIndex(null);
  }, [sampler]);

  useEffect(() => {
    const handleHashChange = () => {
      const songFromHash = window.location.hash.slice(1);
      if (selectedSong && !songFromHash) {
        // We're navigating away from a song to the index
        stopAllPlayback();
      }
      setSelectedSong(songFromHash || null);
    };

    const handlePopState = () => {
      // This will catch navigation events like swipe back
      if (selectedSong) {
        stopAllPlayback();
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [stopAllPlayback, selectedSong]);

  // Modify the existing useEffect for navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopAllPlayback();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopAllPlayback(); // Ensure playback stops when component unmounts
    };
  }, [stopAllPlayback]);

  const handleSongClick = useCallback(
    (filename: string) => {
      stopAllPlayback();
      window.location.hash = filename;
    },
    [stopAllPlayback]
  );

  const selectedSongData = CORPUS.find(
    (song): song is Song => song.filename === selectedSong
  );

  function getChordSequence(song: Song): ChordEvent[] {
    const chords = song.chords;
    const timeSig = song.TimeSig;
    const numerator = timeSig[0];

    const chordSequence: ChordEvent[] = [];

    let currentTime = 0;

    chords.forEach((barChords: string[]) => {
      const barChordNames = barChords.map((chordStr) => chordStr.split(" "));

      barChordNames.forEach((chordNames) => {
        const numChordsInBar = chordNames.length;
        const chordDuration = numerator / numChordsInBar;

        chordNames.forEach((chord) => {
          const duration = chord.includes(" ")
            ? chordDuration / 2
            : chordDuration;

          chordSequence.push({
            chord: chord,
            time: currentTime,
            duration: duration,
          });
          currentTime += duration;
        });
      });
    });

    return chordSequence;
  }

  useEffect(() => {
    if (selectedSongData) {
      const sequence = getChordSequence(selectedSongData);
      setChordSequence(sequence);
    }
  }, [selectedSongData]);

  useEffect(() => {
    const initPiano = async () => {
      const piano = await initializePiano();
      setSampler(piano);
    };
    initPiano();
  }, []);

  useEffect(() => {
    let metronome: Tone.Synth;

    const playChords = async () => {
      await Tone.start();
      Tone.Transport.bpm.value = bpm;
      Tone.Transport.timeSignature = selectedSongData?.TimeSig || [4, 4];

      if (!sampler) {
        return;
      }

      metronome = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0, decay: 0, sustain: 0, release: 0.1 },
      }).toDestination();

      const secondsPerBeat = 40 / bpm;
      const secondsPerBar =
        secondsPerBeat * (selectedSongData?.TimeSig[0] || 4);

      Tone.Transport.scheduleRepeat((time) => {
        metronome.triggerAttackRelease("C6", "8n", time);
      }, secondsPerBeat);

      chordSequence.forEach(({ chord, time, duration }, index) => {
        const midiNotes = getMidiNotesForChord(chord);
        const chordTime =
          (time / (selectedSongData?.TimeSig[0] || 4)) * secondsPerBar;
        const chordDuration =
          (duration / (selectedSongData?.TimeSig[0] || 4)) * secondsPerBar;

        Tone.Transport.schedule((playTime) => {
          if (midiNotes.length > 0) {
            strum(sampler, midiNotes, chordDuration, playTime);
          }
          Tone.Draw.schedule(() => {
            setCurrentChordIndex(index);
          }, playTime);
        }, chordTime);
      });

      const totalTime =
        chordSequence.reduce((acc, { duration }) => acc + duration, 0) *
        (secondsPerBar / (selectedSongData?.TimeSig[0] || 4));

      Tone.Transport.schedule(() => {
        handleStop();
      }, totalTime);

      Tone.Transport.start();
    };

    if (isPlaying && sampler) {
      playChords();
    }

    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setCurrentChordIndex(null);
    };
  }, [isPlaying, chordSequence, selectedSongData, sampler]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  function getMidiNotesForChord(chordName: string): number[] {
    const parsedChord: ParsedChord = parseChordName(chordName);
    if (parsedChord.error) {
      console.error(parsedChord.error);
      return [];
    }

    const { root, suffix } = parsedChord;
    const chordData = guitarChords.chords[root]?.find(
      (chord) => chord.suffix === suffix
    );

    if (!chordData) {
      console.error("Unknown chord:", chordName);
      return [];
    }

    const position = chordData.positions[0];

    if (position.midi) {
      return position.midi;
    } else {
      const tuning = guitarChords.tunings.standard.map((note) =>
        Tone.Frequency(note).toMidi()
      );
      return position.frets
        .map((fret, index) => {
          if (fret === -1) return -1;
          return tuning[index] + fret + position.baseFret - 1;
        })
        .filter((note) => note !== -1);
    }
  }

  const handleChordHover = useCallback((chordName: string) => {
    console.log(`Original chord name: ${chordName}`);

    const parsedChord: ParsedChord = parseChordName(chordName);
    console.log(`Parsed chord:`, parsedChord);

    if (parsedChord.error) {
      console.error(parsedChord.error);
      setHoverInfo(null);
      setHoverChord(null);
      return;
    }

    const { root, suffix } = parsedChord;
    const available = checkChordAvailability(root, suffix);
    console.log(`Availability for ${root}${suffix}: ${available}`);

    if (!available) {
      console.log(`Debugging unavailable chord:`);
      console.log(
        `- Checking root "${root}" in guitarChords:`,
        !!guitarChords.chords[root]
      );

      if (guitarChords.chords[root]) {
        console.log(
          `- Available suffixes for ${root}:`,
          guitarChords.chords[root].map((chord) => chord.suffix)
        );
      } else {
        console.log(`- Available roots:`, Object.keys(guitarChords.chords));
      }
    }

    setHoverInfo({ root, suffix, available });
    setHoverChord(parsedChord);
  }, []);

  const handleChordLeave = useCallback(() => {
    setHoverInfo(null);
    setHoverChord(null);
  }, []);

  useEffect(() => {
    const stats: {
      [key: string]: { nonParsedChords: number; distinctChords: number };
    } = {};
    const errors: { [key: string]: string[] } = {};

    CORPUS.forEach((song) => {
      const songErrors: string[] = [];
      const distinctChords = new Set<string>();

      song.chords.forEach((barChords) => {
        barChords.forEach((chord) => {
          chord.split(" ").forEach((chordName) => {
            distinctChords.add(chordName);
            const parsedChord: ParsedChord = parseChordName(chordName);
            if (
              parsedChord.error ||
              !checkChordAvailability(parsedChord.root, parsedChord.suffix)
            ) {
              songErrors.push(chordName);
            }
          });
        });
      });

      if (songErrors.length > 0) {
        errors[song.filename] = [...new Set(songErrors)]; // Remove duplicates
      }

      stats[song.filename] = {
        nonParsedChords: new Set(songErrors).size,
        distinctChords: distinctChords.size,
      };
    });

    setSongParsingErrors(errors);
    setSongStats(stats);
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      handleStop();
    } else {
      handlePlay();
    }
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space" && !isHoveringChords) {
        event.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [isPlaying, isHoveringChords]);

  const flattenedChords = useMemo(() => {
    if (!selectedSongData) return [];
    return selectedSongData.chords.flatMap((bar) =>
      bar.flatMap((chord) => chord.split(" "))
    );
  }, [selectedSongData]);

  const handleMouseEnter = useCallback((filename: string) => {
    setHoveredSongs((prev) => ({ ...prev, [filename]: true }));
    setPreviewedSongs((prev) => ({ ...prev, [filename]: true }));
  }, []);

  const handleMouseLeave = useCallback((filename: string) => {
    setHoveredSongs((prev) => ({ ...prev, [filename]: false }));
  }, []);

  const playPreview = useCallback(
    (song: Song) => {
      if (!sampler) return;

      Tone.Transport.stop();
      Tone.Transport.cancel();

      const bpm = 120;
      Tone.Transport.bpm.value = bpm;
      Tone.Transport.timeSignature = song.TimeSig;

      const secondsPerBeat = 40 / bpm;
      const secondsPerBar = secondsPerBeat * song.TimeSig[0];

      const lastRepChords = song.chords
        .flat()
        .flatMap((chord) => chord.split(" "));

      const uniqueChords = lastRepChords.filter(
        (chord, index, array) => index === 0 || chord !== array[index - 1]
      );

      const chordDuration = secondsPerBar;
      const totalTime = uniqueChords.length * chordDuration;

      // Highlight the first chord immediately
      setPreviewCurrentChordIndex(0);

      uniqueChords.forEach((chord, index) => {
        const chordTime = index * chordDuration;
        const midiNotes = getMidiNotesForChord(chord);

        Tone.Transport.schedule((playTime) => {
          if (midiNotes.length > 0) {
            strum(sampler, midiNotes, chordDuration, playTime);
          }
          Tone.Draw.schedule(() => {
            setPreviewCurrentChordIndex(index + 1);
          }, playTime);
        }, chordTime);
      });

      Tone.Transport.schedule(() => {
        setPreviewPlayingSong(null);
        setPreviewCurrentChordIndex(null);
      }, totalTime);

      Tone.Transport.start();
    },
    [sampler]
  );

  const handleSongPreviewHover = useCallback(
    (song: Song) => {
      if (!sampler) return;

      const parsedSong = parseChords(song);
      setPreviewPlayingSong(parsedSong.filename);
      playPreview(parsedSong);
    },
    [sampler, parseChords, playPreview]
  );

  const handleSongPreviewLeave = useCallback(() => {
    setPreviewPlayingSong(null);
    setPreviewCurrentChordIndex(null);
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }, []);

  // Update the ref whenever the state changes
  useEffect(() => {
    previewCurrentChordIndexRef.current = previewCurrentChordIndex;
  }, [previewCurrentChordIndex]);

  const renderSongList = () => {
    return (
      <>
        <div>
          <p>Loaded tracks: {processedSongs.length}</p>
          <p>Total tracks: {CORPUS.length}</p>
        </div>
        <SongListContainer>
          {processedSongs.slice(0, visibleSongs).map((song) => {
            const uniqueKey = `${song.filename}-${song.Title}`;
            const hasErrors = songParsingErrors[song.filename]?.length > 0;
            return (
              <SongItem
                key={uniqueKey}
                onMouseEnter={() => handleMouseEnter(song.filename)}
                onMouseLeave={() => handleMouseLeave(song.filename)}
              >
                <SongLinkContainer>
                  <SongLink
                    href={`#${song.filename}`}
                    onClick={() => handleSongClick(song.filename)}
                    hasErrors={hasErrors}
                  >
                    {song.Title}
                  </SongLink>
                  {!hasErrors && (
                    <VolumeIcon
                      $isPlaying={previewPlayingSong === song.filename}
                      onMouseEnter={() => handleSongPreviewHover(song)}
                      onMouseLeave={handleSongPreviewLeave}
                    />
                  )}
                </SongLinkContainer>
                {hasErrors ? (
                  <ErrorChords>
                    Parsing errors:{" "}
                    {songParsingErrors[song.filename].join(", ")}
                  </ErrorChords>
                ) : (
                  (hoveredSongs[song.filename] ||
                    previewPlayingSong === song.filename ||
                    autoPreviewSongs.includes(song.filename) ||
                    previewedSongs[song.filename]) && (
                    <SongPreviewComponent
                      song={parseChords(song)}
                      currentChordIndex={
                        previewPlayingSong === song.filename
                          ? previewCurrentChordIndexRef.current
                          : null
                      }
                    />
                  )
                )}
              </SongItem>
            );
          })}
          {visibleSongs < processedSongs.length && (
            <div ref={loadMoreRef} style={{ height: "20px" }}>
              Loading more...
            </div>
          )}
        </SongListContainer>
      </>
    );
  };

  const playChord = useCallback(
    (chord: string) => {
      if (sampler) {
        // Stop any ongoing playback
        sampler.releaseAll();

        // Get the notes for the chord
        const midiNotes = getMidiNotesForChord(chord);

        // Play the chord
        if (midiNotes.length > 0) {
          strum(sampler, midiNotes, 1, Tone.now());
        }
      }
    },
    [sampler]
  );

  return (
    <div className="App">
      <Header>
        <h1>Jazz Standards Corpus</h1>
        <RootDifferenceLegend />
      </Header>
      {!selectedSong ? (
        renderSongList()
      ) : (
        <TwoColumnLayout>
          <LeftColumn>
            <a href="#" onClick={() => window.history.back()}>
              Back to list
            </a>
            {selectedSongData && (
              <div>
                <h2>{selectedSongData.Title}</h2>
                <button onClick={togglePlay}>
                  {isPlaying ? "Stop" : "Play"}
                </button>
                <p>{selectedSongData.ComposedBy}</p>
                <p>
                  {selectedSongData.DBKeySig},{" "}
                  {selectedSongData.TimeSig.join("/")}, {selectedSongData.Bars}{" "}
                  bars
                </p>
                <div
                  className="chords"
                  onMouseEnter={() => setIsHoveringChords(true)}
                  onMouseLeave={() => setIsHoveringChords(false)}
                >
                  {selectedSongData.chords.map((barChords, barIndex) => (
                    <div key={barIndex} className="chord-bar">
                      {barChords.map((chord, chordIndex) => (
                        <React.Fragment key={`${barIndex}-${chordIndex}`}>
                          {chordIndex > 0 && " | "}
                          {chord.split(" ").map((chordName, i) => {
                            const linearIndex = getLinearIndex(
                              barIndex,
                              chordIndex,
                              i,
                              selectedSongData
                            );
                            return (
                              <span
                                key={`${chordIndex}-${i}`}
                                className={
                                  currentChordIndex === linearIndex
                                    ? "chord highlight"
                                    : "chord"
                                }
                              >
                                {chordName}&nbsp;
                              </span>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  ))}
                </div>
                {hoverInfo && (
                  <div className="chord-info">
                    <p>Root: {hoverInfo.root}</p>
                    <p>Suffix: {hoverInfo.suffix}</p>
                    <p>Available: {hoverInfo.available ? "Yes" : "No"}</p>
                  </div>
                )}
              </div>
            )}
          </LeftColumn>
          <RightColumn>
            <h3>Alternative Chord Representation:</h3>
            <AlternativeChordRepresentation
              chords={flattenedChords}
              currentChordIndex={currentChordIndex}
              handleChordHover={handleChordHover}
              handleChordLeave={handleChordLeave}
              playChord={playChord}
              disableVerticalScroll={false}
            />
          </RightColumn>
        </TwoColumnLayout>
      )}
      {hoverChord && !isHoveringChords && (
        <div
          style={{
            position: "fixed",
            top: "10px",
            right: "10px",
            backgroundColor: "white",
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "5px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h4>Chord Details</h4>
          <p>Root: {hoverChord.root}</p>
          <p>Original Root: {hoverChord.originalRoot}</p>
          <p>Suffix: {hoverChord.suffix}</p>
          <p>Original Suffix: {hoverChord.originalSuffix}</p>
          <p>Is Major: {hoverChord.isMajor ? "Yes" : "No"}</p>
          <p>Is Minor: {hoverChord.isMinor ? "Yes" : "No"}</p>
          {hoverChord.error && <p>Error: {hoverChord.error}</p>}
        </div>
      )}
    </div>
  );
}

function getLinearIndex(
  barIndex: number,
  chordIndex: number,
  chordNameIndex: number,
  songData: Song
): number {
  let linearIndex = 0;
  for (let i = 0; i < barIndex; i++) {
    const barChords = songData.chords[i] || [];
    for (let j = 0; j < barChords.length; j++) {
      const chordNames = barChords[j].split(" ");
      linearIndex += chordNames.length;
    }
  }
  const currentBarChords = songData.chords[barIndex] || [];
  for (let j = 0; j < chordIndex; j++) {
    const chordNames = currentBarChords[j].split(" ");
    linearIndex += chordNames.length;
  }
  return linearIndex + chordNameIndex;
}

// Rename this component
const SongPreviewComponent: React.FC<{
  song: Song;
  currentChordIndex: number | null;
}> = React.memo(({ song, currentChordIndex }) => {
  const [squashedChords, setSquashedChords] = useState<SquashedChordInfo[]>([]);
  const [totalWidth, setTotalWidth] = useState(0);
  const [totalHeight, setTotalHeight] = useState(0);

  useEffect(() => {
    const chords = getSquashedChords(song.chords);
    setSquashedChords(chords);
    setTotalWidth(calculateTotalWidth(chords));
    setTotalHeight(calculateTotalHeight(chords));
  }, [song]);

  return (
    <SongPreviewContainer height={totalHeight}>
      <ChordLine
        repLevel={4}
        chords={squashedChords}
        currentChordIndex={currentChordIndex}
        handleChordHover={() => {}}
        handleChordLeave={() => {}}
        playChord={() => {}}
        showOnlyLastRep={true}
        directIndex={currentChordIndex}
        verticalOffset={calculateVerticalOffset(squashedChords)}
        totalWidth={totalWidth}
        totalHeight={totalHeight}
      />
    </SongPreviewContainer>
  );
});

const SongPreviewContainer = styled.div<{ height: number }>`
  height: ${(props) => props.height}px;
  overflow: visible;
  margin-top: 10px;
`;

const ErrorChords = styled.div`
  color: red;
  font-size: 0.9em;
  margin-top: 5px;
`;

export default App;
