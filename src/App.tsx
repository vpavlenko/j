import React, { useState, useEffect } from "react";
import "./App.css";
import { CORPUS } from "./tinyCorpus";
import * as Tone from "tone";
import { Chord, Note } from "@tonaljs/tonal";

function App() {
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState<number | null>(
    null
  );
  const [chordSequence, setChordSequence] = useState<any[]>([]);
  const bpm = 120; // You can make this adjustable if you like

  const handleSongClick = (filename: string) => {
    setSelectedSong(filename);
  };

  const selectedSongData = CORPUS.find(
    (song) => song.filename === selectedSong
  );

  // Function to get chord sequence from song data
  function getChordSequence(song: any) {
    const chords = song.chords; // array of bars
    const timeSig = song.TimeSig; // [numerator, denominator]
    const numerator = timeSig[0];

    const chordSequence: any[] = []; // array of { chord: string, time: number, duration: number }

    let currentTime = 0; // in beats

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

  // Update chord sequence when song changes
  useEffect(() => {
    if (selectedSongData) {
      const sequence = getChordSequence(selectedSongData);
      setChordSequence(sequence);
    }
  }, [selectedSongData]);

  // Playback functions
  useEffect(() => {
    let synth: Tone.PolySynth;
    let metronome: Tone.Synth;

    const playChords = async () => {
      await Tone.start();
      Tone.Transport.bpm.value = bpm;
      Tone.Transport.timeSignature = selectedSongData?.TimeSig || [4, 4];

      synth = new Tone.PolySynth().toDestination();
      metronome = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0, decay: 0, sustain: 0, release: 0.1 },
      }).toDestination();

      const secondsPerBeat = 60 / bpm;

      // Start metronome
      Tone.Transport.scheduleRepeat((time) => {
        metronome.triggerAttackRelease("C6", "8n", time);
      }, secondsPerBeat);

      // Schedule chords
      chordSequence.forEach(({ chord, time, duration }, index) => {
        const midiNotes = getMidiNotesForChord(chord);
        const chordTime = time * secondsPerBeat;
        const chordDuration = duration * secondsPerBeat;

        Tone.Transport.schedule((playTime) => {
          if (midiNotes.length > 0) {
            synth.triggerAttackRelease(midiNotes, chordDuration, playTime);
          }
          setCurrentChordIndex(index);
        }, chordTime);
      });

      // Stop playback after the song is over
      const totalTime =
        chordSequence.reduce((acc, { duration }) => acc + duration, 0) *
        secondsPerBeat;

      Tone.Transport.schedule(() => {
        handleStop();
      }, totalTime);

      Tone.Transport.start();
    };

    if (isPlaying) {
      playChords();
    }

    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setCurrentChordIndex(null);
    };
  }, [isPlaying]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentChordIndex(null);
  };

  // Function to get MIDI notes for a chord
  function getMidiNotesForChord(chordName: string) {
    const chord = Chord.get(chordName);
    if (chord.empty) {
      console.error("Unknown chord:", chordName);
      return [];
    }
    const notes = chord.notes;
    const midiNotes = notes.map((note) => Note.midi(note));
    return midiNotes;
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
