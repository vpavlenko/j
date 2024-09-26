import * as Tone from "tone";

export function strum(
  sampler: Tone.Sampler,
  midiNotes: number[],
  duration: number,
  time: number
) {
  const strumDuration = 0.01; // 10ms between notes
  midiNotes.forEach((midi, index) => {
    const noteTime = time + index * strumDuration;
    const note = Tone.Frequency(midi, "midi").toNote();
    sampler.triggerAttackRelease(note, duration, noteTime);
  });
}
