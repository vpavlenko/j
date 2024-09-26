import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { CORPUS } from "./tinyCorpus";
import * as Tone from "tone";
import { Song } from "./corpus";
import guitarChords from "./guitarChords";

interface ChordEvent {
  chord: string;
  time: number;
  duration: number;
}

function App() {
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState<number | null>(
    null
  );
  const [chordSequence, setChordSequence] = useState<ChordEvent[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const bpm = 120;

  const debugLogRef = useRef<HTMLDivElement>(null);

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
      const chordNames = barChords.flatMap((chordStr) => chordStr.split(" "));
      const numChordsInBar = chordNames.length;
      const chordDuration = numerator / numChordsInBar;

      chordNames.forEach((chord) => {
        chordSequence.push({
          chord: chord,
          time: currentTime,
          duration: chordDuration,
        });
        currentTime += chordDuration;
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
    let synth: Tone.PolySynth;
    let metronome: Tone.Synth;

    const addDebugLog = (message: string) => {
      setDebugLogs((prevLogs) => [...prevLogs, message]);
      if (debugLogRef.current) {
        debugLogRef.current.scrollTop = debugLogRef.current.scrollHeight;
      }
    };

    const playChords = async () => {
      await Tone.start();
      addDebugLog("Tone.start() called");
      Tone.Transport.bpm.value = bpm;
      addDebugLog(`Tone.Transport.bpm set to ${bpm}`);
      Tone.Transport.timeSignature = selectedSongData?.TimeSig || [4, 4];
      addDebugLog(
        `Tone.Transport.timeSignature set to ${Tone.Transport.timeSignature}`
      );

      synth = new Tone.PolySynth().toDestination();
      addDebugLog("Tone.PolySynth created and connected to destination");
      metronome = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0, decay: 0, sustain: 0, release: 0.1 },
      }).toDestination();
      addDebugLog("Metronome synth created and connected to destination");

      const secondsPerBeat = 60 / bpm;

      Tone.Transport.scheduleRepeat((time) => {
        metronome.triggerAttackRelease("C6", "8n", time);
        addDebugLog(`Metronome triggered at ${time}`);
      }, secondsPerBeat);

      chordSequence.forEach(({ chord, time, duration }, index) => {
        const midiNotes = getMidiNotesForChord(chord);
        const chordTime = time * secondsPerBeat;
        const chordDuration = duration * secondsPerBeat;

        Tone.Transport.schedule((playTime) => {
          if (midiNotes.length > 0) {
            synth.triggerAttackRelease(
              midiNotes.map((midi) =>
                Tone.Frequency(midi, "midi").toFrequency()
              ), // Convert to Frequency
              chordDuration,
              playTime
            );
            addDebugLog(
              `Chord ${chord} played at ${playTime}, duration: ${chordDuration}, notes: ${midiNotes.join(
                ", "
              )}`
            );
          } else {
            addDebugLog(`No valid notes for chord ${chord} at ${playTime}`);
          }
          Tone.Draw.schedule(() => {
            setCurrentChordIndex(index);
            addDebugLog(`Current chord index set to ${index} at ${playTime}`);
          }, playTime);
        }, chordTime);
      });

      const totalTime =
        chordSequence.reduce((acc, { duration }) => acc + duration, 0) *
        secondsPerBeat;

      Tone.Transport.schedule(() => {
        handleStop();
        addDebugLog("Playback completed, stopping transport");
      }, totalTime);

      Tone.Transport.start();
      addDebugLog("Tone.Transport.start() called");
    };

    if (isPlaying) {
      playChords();
    }

    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setCurrentChordIndex(null);
      addDebugLog(
        "Cleanup: Transport stopped and cancelled, currentChordIndex reset"
      );
    };
  }, [isPlaying, chordSequence, selectedSongData]);

  const handlePlay = () => {
    setIsPlaying(true);
    setDebugLogs([]); // Clear previous logs when starting new playback
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentChordIndex(null);
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

    // Get the first position of the chord (you might want to randomize this or use a specific position)
    const position = chordData.positions[0];

    if (position.midi) {
      return position.midi;
    } else {
      // If midi property is not available, calculate it based on frets and tuning
      const tuning = guitarChords.tunings.standard.map((note) =>
        Tone.Frequency(note).toMidi()
      );
      return position.frets
        .map((fret, index) => {
          if (fret === -1) return -1; // Muted string
          return tuning[index] + fret + position.baseFret - 1;
        })
        .filter((note) => note !== -1);
    }
  }

  function parseChordName(chordName: string): [string, string] {
    const keys = guitarChords.keys;
    let root = "";
    let suffix = "";

    // Find the root
    for (let i = 0; i < keys.length; i++) {
      if (chordName.startsWith(keys[i])) {
        root = keys[i];
        suffix = chordName.slice(keys[i].length);
        break;
      }
    }

    // Handle special cases
    if (suffix === "7alt") suffix = "7#5#9";
    if (suffix === "") suffix = "major";

    return [root, suffix];
  }

  return (
    <div className="App">
      <h1>Jazz Standards Corpus</h1>
      {!selectedSong ? (
        <ul>
          {CORPUS.map((song) => (
            <li key={song.filename}>
              <a
                href={`#${song.filename}`}
                onClick={() => handleSongClick(song.filename)}
              >
                {song.Title}
              </a>
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
                {chordSequence.map((chordEvent, index) => (
                  <span
                    key={index}
                    className={
                      currentChordIndex === index ? "chord highlight" : "chord"
                    }
                  >
                    {chordEvent.chord}
                  </span>
                ))}
              </div>
              {!isPlaying ? (
                <button onClick={handlePlay}>Play</button>
              ) : (
                <button onClick={handleStop}>Stop</button>
              )}
              <div className="debug-log" ref={debugLogRef}>
                <h3>Debug Log:</h3>
                {debugLogs.map((log, index) => (
                  <p key={index}>{log}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
