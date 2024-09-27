import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import AlternativeChordRepresentation from "./components/AlternativeChordRepresentation";

interface ChordEvent {
  chord: string;
  time: number;
  duration: number;
}

function App() {
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chordSequence, setChordSequence] = useState<ChordEvent[]>([]);
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null);
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

  const [hoverChord, setHoverChord] = useState<{
    chord: string;
    root: string;
    suffix: string;
  } | null>(null);

  const [isHoveringChords, setIsHoveringChords] = useState(false);

  const handleSongClick = (filename: string) => {
    setSelectedSong(filename);
  };

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

      const secondsPerBeat = 20 / bpm;
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
    setHoverChord({ chord: chordName, root, suffix });
  }, []);

  const handleChordLeave = useCallback(() => {
    setHoverInfo(null);
    setHoverChord(null);
  }, []);

  useEffect(() => {
    const errors: { [key: string]: string[] } = {};

    CORPUS.forEach((song) => {
      const songErrors: string[] = [];

      song.chords.forEach((barChords) => {
        barChords.forEach((chord) => {
          chord.split(" ").forEach((chordName) => {
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
    });

    setSongParsingErrors(errors);
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

  return (
    <div className="App">
      <h1>Jazz Standards Corpus</h1>
      {!selectedSong ? (
        <ul>
          {CORPUS.sort((a, b) => a.Title.localeCompare(b.Title)).map((song) => (
            <li
              key={song.filename}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <a
                href={`#${song.filename}`}
                onClick={() => handleSongClick(song.filename)}
                style={{
                  color: songParsingErrors[song.filename] ? "red" : "inherit",
                  marginRight: "10px",
                }}
              >
                {song.Title}
              </a>
              {songParsingErrors[song.filename] && (
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {songParsingErrors[song.filename].map((chord, index) => (
                    <span
                      key={index}
                      onMouseEnter={() => handleChordHover(chord)}
                      onMouseLeave={handleChordLeave}
                      style={{
                        backgroundColor: "#f0f0f0",
                        padding: "2px 5px",
                        margin: "0 2px",
                        borderRadius: "3px",
                        cursor: "pointer",
                      }}
                    >
                      {chord}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="song-content">
          <div className="original-chords">
            <button onClick={() => setSelectedSong(null)}>Back to list</button>
            {selectedSongData && (
              <div>
                <h2>{selectedSongData.Title}</h2>
                <button onClick={togglePlay}>
                  {isPlaying ? "Stop" : "Play"}
                </button>
                <p>Composed by: {selectedSongData.ComposedBy}</p>
                <p>Key: {selectedSongData.DBKeySig}</p>
                <p>Time Signature: {selectedSongData.TimeSig.join("/")}</p>
                <p>Bars: {selectedSongData.Bars}</p>
                <h3>Chords:</h3>
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
                                {chordName}
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
          </div>
          <div className="alternative-representation">
            <h3>Alternative Chord Representation:</h3>
            <AlternativeChordRepresentation
              chords={flattenedChords}
              currentChordIndex={currentChordIndex}
              handleChordHover={handleChordHover}
              handleChordLeave={handleChordLeave}
            />
          </div>
        </div>
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
          <p>Chord: {hoverChord.chord}</p>
          <p>Root: {hoverChord.root}</p>
          <p>Suffix: {hoverChord.suffix}</p>
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

export default App;
