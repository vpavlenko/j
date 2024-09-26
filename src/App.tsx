import { useState } from "react";
import "./App.css";
import { CORPUS } from "./tinyCorpus";

function App() {
  const [selectedSong, setSelectedSong] = useState<string | null>(null);

  const handleSongClick = (filename: string) => {
    setSelectedSong(filename);
  };

  const selectedSongData = CORPUS.find(
    (song) => song.filename === selectedSong
  );

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
              <pre>
                {selectedSongData.chords
                  .map((bar) => bar.join(" | "))
                  .join("\n")}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
