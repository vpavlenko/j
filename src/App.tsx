import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import { CORPUS } from "./corpus";
import * as Tone from "tone";
import { Song } from "./corpus";
import guitarChords from "./guitarChords";
import { strum } from "./utils";

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

  const initializePiano = async () => {
    const piano = new Tone.Sampler({
      urls: {
        A0: "A0.mp3",
        C1: "C1.mp3",
        "D#1": "Ds1.mp3",
        "F#1": "Fs1.mp3",
        A1: "A1.mp3",
        C2: "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        A2: "A2.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
        C6: "C6.mp3",
        "D#6": "Ds6.mp3",
        "F#6": "Fs6.mp3",
        A6: "A6.mp3",
        C7: "C7.mp3",
        "D#7": "Ds7.mp3",
        "F#7": "Fs7.mp3",
        A7: "A7.mp3",
        C8: "C8.mp3",
      },
      release: 1,
      baseUrl: "https://tonejs.github.io/audio/salamander/",
    }).toDestination();

    await Tone.loaded();
    setSampler(piano);
  };

  useEffect(() => {
    initializePiano();
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
    const [root, suffix] = parseChordName(chordName);
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

  function parseChordName(chordName: string): [string, string] {
    const keys = guitarChords.keys;
    let root = "";
    let suffix = "";

    const rootMapping: { [key: string]: string } = {
      Cb: "B",
      Db: "Csharp",
      "D#": "Eb",
      "F#": "Fsharp",
      Gb: "Fsharp",
      "G#": "Ab",
      "A#": "Bb",
      "C#": "Csharp",
    };

    // First, check for keys that need to be mapped
    for (const [originalRoot, mappedRoot] of Object.entries(rootMapping)) {
      if (chordName.startsWith(originalRoot)) {
        root = mappedRoot;
        suffix = chordName.slice(originalRoot.length);
        break;
      }
    }

    // If no mapped key was found, then check the standard keys
    if (!root) {
      for (let i = 0; i < keys.length; i++) {
        if (chordName.startsWith(keys[i])) {
          root = keys[i];
          suffix = chordName.slice(keys[i].length);
          break;
        }
      }
    }

    suffix = suffixMapping(suffix);

    return [root, suffix];
  }

  const suffixMapping = (suffix: string): string => {
    if (suffix === "7") return "7";
    if (suffix === "7alt") return "7#9";
    if (suffix === "") return "major";
    if (suffix === "m") return "minor";
    if (suffix === "M") return "major";
    if (suffix === "M7") return "maj7";
    if (suffix === "M7#5") return "maj7#5";
    if (suffix === "M7b5") return "maj7b5";
    if (suffix === "6/9") return "69";
    if (suffix === "9b5") return "9b5";
    if (suffix === "dim7") return "dim7";
    if (suffix === "m7b5") return "m7b5";
    if (suffix === "m/M7") return "mmaj7";
    if (suffix === "mMaj7") return "mmaj7";
    if (suffix === "mM7") return "mmaj7";
    if (suffix === "m6/9") return "m69";
    if (suffix === "7b9") return "7b9";
    if (suffix === "7#9") return "7#9";
    if (suffix === "7#5") return "aug7";
    if (suffix === "7#5#9") return "alt";
    if (suffix === "m7") return "m7";
    if (suffix === "m9") return "m9";
    if (suffix === "maj7") return "maj7";
    if (suffix === "madd9") return "madd9";
    if (suffix === "maj9") return "maj9";
    if (suffix === "7b5") return "7b5";
    if (suffix === "aug") return "aug";
    if (suffix === "aug7") return "aug7";
    if (suffix === "add9") return "add9";
    if (suffix === "add11") return "add11";
    if (suffix === "dim") return "dim";
    if (suffix === "mmaj7b5") return "mmaj7b5";
    if (suffix === "mmaj9") return "mmaj9";
    if (suffix === "mmaj11") return "mmaj11";
    if (suffix === "7sus4") return "7sus4";
    if (suffix === "11") return "11";
    if (suffix === "9#11") return "9#11";
    if (suffix === "13") return "13";
    if (suffix === "o7") return "dim7";
    if (suffix === "+") return "aug";
    if (suffix === "+7") return "aug7";
    if (suffix === "7+") return "aug7";
    if (suffix === "7sus") return "7sus4";
    if (suffix === "9sus4") return "7sus4";
    if (suffix === "o") return "dim";
    if (suffix === "M6") return "6";
    if (suffix === "7#11") return "9#11";
    if (suffix === "M7#11") return "maj7b5";
    if (suffix.includes("m7/")) return suffix.replace("m7/", "m/");
    if (suffix.includes("/")) return suffix;
    if (suffix.includes("sus")) return suffix;

    return suffix;
  };

  const checkChordAvailability = useCallback((root: string, suffix: string) => {
    console.log(
      `Checking availability for root: "${root}", suffix: "${suffix}"`
    );
    const chordData = guitarChords.chords[root]?.find(
      (chord) => chord.suffix === suffix
    );
    return !!chordData;
  }, []);

  const handleChordHover = useCallback(
    (chordName: string) => {
      console.log(`Original chord name: ${chordName}`);

      const [root, suffix] = parseChordName(chordName);
      console.log(
        `Parsed chord: ${chordName} -> root: ${root}, suffix: ${suffix}`
      );

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
          console.log(
            `- Closest matching suffixes:`,
            guitarChords.chords[root]
              .map((chord) => ({
                suffix: chord.suffix,
                similarity: stringSimilarity(suffix, chord.suffix),
              }))
              .sort((a, b) => b.similarity - a.similarity)
              .slice(0, 3)
          );
        } else {
          console.log(`- Available roots:`, Object.keys(guitarChords.chords));
        }
      }

      setHoverInfo({ root, suffix, available });
      setHoverChord({ chord: chordName, root, suffix });
    },
    [checkChordAvailability]
  );

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
            const [root, suffix] = parseChordName(chordName);
            if (!checkChordAvailability(root, suffix)) {
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
        <div>
          <button onClick={() => setSelectedSong(null)}>Back to list</button>
          {selectedSongData && (
            <div>
              <h2>{selectedSongData.Title}</h2>
              <p>Composed by: {selectedSongData.ComposedBy}</p>
              <p>Key: {selectedSongData.DBKeySig}</p>
              <p>Time Signature: {selectedSongData.TimeSig.join("/")}</p>
              <p>Bars: {selectedSongData.Bars}</p>
              <h3>Chords:</h3>
              <div className="chords">
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
                              onMouseEnter={() => handleChordHover(chordName)}
                              onMouseLeave={handleChordLeave}
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
              {!isPlaying ? (
                <button onClick={handlePlay}>Play</button>
              ) : (
                <button onClick={handleStop}>Stop</button>
              )}
            </div>
          )}
        </div>
      )}
      {hoverChord && (
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

function stringSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / longerLength;
}

function editDistance(s1: string, s2: string): number {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
}

export default App;
