import { useCallback, useRef, useState } from 'react';

const NARRATION_URLS = {
  1: '/assets/audio/narration-1.mp3',
  2: '/assets/audio/narration-2.mp3',
  3: '/assets/audio/narration-3.mp3',
  4: '/assets/audio/narration-4.mp3',
};

const RAIN_BASE = 0.14;
const DRONE_BASE = 0.1;
// Gate creak is a 3s SFX measured at roughly the same loudness as the
// narration clips — played at full master gain it completely masks the
// voice's opening phrase ("In every fog...", the first ~1.9s of
// narration-1). This keeps it as atmosphere UNDER the voice, not over it.
const GATE_CREAK_GAIN = 0.35;
const DRONE_SCROLL_BOOST = 0.5; // up to +50% of base at max scroll velocity
const DRONE_HUB_BOOST = 0.2; // arrival weight at the Hub section
const RAIN_FILTER_MIN_HZ = 900;
const RAIN_FILTER_MAX_HZ = 4200;
const MODULATION_RAMP = 0.25;

export default function useAudioManager() {
  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);
  const rainGainRef = useRef(null);
  const rainFilterRef = useRef(null);
  const droneGainRef = useRef(null);
  const narrationGainRef = useRef(null);
  const terminalGainRef = useRef(null);
  const sfxGainRef = useRef(null);
  const scrollIntensityRef = useRef(0);
  const hubActiveRef = useRef(false);
  const duckedRef = useRef(false);
  const rawBuffersRef = useRef({}); // key -> ArrayBuffer (fetched during preload)
  const audioBuffersRef = useRef({}); // key -> decoded AudioBuffer
  const narrationSourceRef = useRef(null); // currently-playing narration source, if any
  const completedNarrationsRef = useRef(new Set()); // indices that finished naturally (not interrupted)
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);

  const storeRawBuffer = useCallback((key, arrayBuffer) => {
    rawBuffersRef.current[key] = arrayBuffer;
  }, []);

  const decodeAll = useCallback(async (ctx) => {
    const entries = Object.entries(rawBuffersRef.current);
    await Promise.all(
      entries.map(async ([key, arrayBuffer]) => {
        try {
          const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
          audioBuffersRef.current[key] = buffer;
        } catch {
          // Missing/undecodable optional audio must not break init.
        }
      })
    );
  }, []);

  const playLoop = useCallback((key, destinationNode, ctx) => {
    const buffer = audioBuffersRef.current[key];
    if (!buffer) return null;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(destinationNode);
    source.start(0);
    return source;
  }, []);

  const init = useCallback(
    async (startMuted) => {
      if (ctxRef.current) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') await ctx.resume();
      ctxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.value = startMuted ? 0 : 1;
      master.connect(ctx.destination);
      masterGainRef.current = master;

      const rainGain = ctx.createGain();
      rainGain.gain.value = 0;
      rainGain.connect(master);
      rainGainRef.current = rainGain;

      // Scroll-reactive lowpass: sits between the rain source and its gain
      // node, opening (higher cutoff) as scroll velocity rises — reads as
      // wind picking up rather than a volume change.
      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.value = RAIN_FILTER_MIN_HZ;
      rainFilter.connect(rainGain);
      rainFilterRef.current = rainFilter;

      const droneGain = ctx.createGain();
      droneGain.gain.value = 0;
      droneGain.connect(master);
      droneGainRef.current = droneGain;

      const narrationGain = ctx.createGain();
      narrationGain.gain.value = 0.9;
      narrationGain.connect(master);
      narrationGainRef.current = narrationGain;

      // Terminal typing/boot ticks — kept quiet (0.5) since these fire on
      // every keystroke and shouldn't compete with narration or the beds.
      const terminalGain = ctx.createGain();
      terminalGain.gain.value = 0.5;
      terminalGain.connect(master);
      terminalGainRef.current = terminalGain;

      const sfxGain = ctx.createGain();
      sfxGain.gain.value = GATE_CREAK_GAIN;
      sfxGain.connect(master);
      sfxGainRef.current = sfxGain;

      await decodeAll(ctx);

      playLoop('rain-loop', rainFilter, ctx);
      playLoop('drone-loop', droneGain, ctx);

      const now = ctx.currentTime;
      rainGain.gain.linearRampToValueAtTime(RAIN_BASE, now + 2);
      droneGain.gain.linearRampToValueAtTime(DRONE_BASE, now + 2);

      setMuted(startMuted);
      setReady(true);
    },
    [decodeAll, playLoop]
  );

  // Recomputes drone/rain targets from the current scroll-velocity intensity
  // (0-1) and Hub-arrival flag, and ramps toward them. Skipped while a
  // narration is ducking the beds (narration restore re-applies this itself).
  const applyModulation = useCallback(() => {
    const ctx = ctxRef.current;
    const droneGain = droneGainRef.current;
    const rainFilter = rainFilterRef.current;
    if (!ctx || !droneGain || !rainFilter || duckedRef.current) return;

    const intensity = scrollIntensityRef.current;
    const hubBoost = hubActiveRef.current ? DRONE_HUB_BOOST : 0;
    const droneTarget = DRONE_BASE * (1 + intensity * DRONE_SCROLL_BOOST + hubBoost);
    const filterTarget = RAIN_FILTER_MIN_HZ + intensity * (RAIN_FILTER_MAX_HZ - RAIN_FILTER_MIN_HZ);

    const now = ctx.currentTime;
    droneGain.gain.linearRampToValueAtTime(droneTarget, now + MODULATION_RAMP);
    rainFilter.frequency.linearRampToValueAtTime(filterTarget, now + MODULATION_RAMP);
  }, []);

  const setScrollIntensity = useCallback(
    (intensity) => {
      scrollIntensityRef.current = Math.min(1, Math.max(0, intensity));
      applyModulation();
    },
    [applyModulation]
  );

  const setHubActive = useCallback(
    (active) => {
      if (hubActiveRef.current === active) return;
      hubActiveRef.current = active;
      applyModulation();
    },
    [applyModulation]
  );

  const playOneShot = useCallback((key, gainNode) => {
    const ctx = ctxRef.current;
    const buffer = audioBuffersRef.current[key];
    if (!ctx || !buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode);
    source.start(0);
  }, []);

  const playGateCreak = useCallback(() => {
    playOneShot('gate-creak', sfxGainRef.current ?? masterGainRef.current);
  }, [playOneShot]);

  // Synthesized mechanical-key click (short bandpass-filtered noise burst)
  // rather than a file — typing-sound.mp3 was never actually supplied to the
  // repo across two rounds of asking for it, so this makes the "typing
  // sound synced to the terminal" feature work without waiting on an asset
  // upload. `variant` just picks a slightly deeper/longer click for the
  // boot cue vs. the per-character tick, so they don't sound identical.
  const playSynthClick = useCallback((variant) => {
    const ctx = ctxRef.current;
    const gainNode = terminalGainRef.current;
    if (!ctx || !gainNode) return;

    const now = ctx.currentTime;
    const duration = variant === 'boot' ? 0.05 : 0.025;

    const bufferSize = Math.max(1, Math.ceil(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = variant === 'boot' ? 1400 : 2200;
    filter.Q.value = 1.2;

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(variant === 'boot' ? 0.35 : 0.22, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(clickGain);
    clickGain.connect(gainNode);
    noise.start(now);
    noise.stop(now + duration);
  }, []);

  const playTypingTick = useCallback(() => playSynthClick('tick'), [playSynthClick]);
  const playTerminalBoot = useCallback(() => playSynthClick('boot'), [playSynthClick]);

  // Synthesized distant thunder — no audio asset, same philosophy as the
  // typing clicks above. Brown-ish noise (integrated white noise, so the
  // energy sits low) through a lowpass that closes from 220Hz to 60Hz as the
  // rumble dies, with a slow swell instead of a crack: this is thunder from
  // MILES away behind the rain, not a strike overhead. Peak gain is kept
  // under the narration bed and the filter ceiling (220Hz) leaves the whole
  // voice band untouched, so a rumble landing mid-narration can't mask it.
  const playThunder = useCallback(() => {
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const duration = 3.5;
    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const now = ctx.currentTime;
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(now);
    source.stop(now + duration);
  }, []);

  // Narration is replayable — SPEC: every section's narrator must speak
  // again on re-entry, regardless of scroll direction, not just once ever.
  // Stopping whatever's currently mid-playback (rather than a permanent
  // once-only guard) also prevents two narrations overlapping if the
  // visitor scrolls back and forth quickly across a boundary.
  const playNarration = useCallback(
    (index) => {
      const ctx = ctxRef.current;
      const buffer = audioBuffersRef.current[`narration-${index}`];
      const narrationGain = narrationGainRef.current;
      const rainGain = rainGainRef.current;
      const droneGain = droneGainRef.current;
      if (!ctx || !buffer || !narrationGain) return;

      if (narrationSourceRef.current) {
        try {
          narrationSourceRef.current.onended = null;
          narrationSourceRef.current.stop();
        } catch {
          // Already stopped/ended — fine.
        }
        narrationSourceRef.current = null;
      }

      // A fresh play of this index invalidates any previous "completed" mark
      // — the auto-scroll orchestrator (Experience.jsx) needs to wait for
      // *this* playthrough to finish, not treat a stale completion from an
      // earlier visit to this section as already satisfied.
      completedNarrationsRef.current.delete(index);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(narrationGain);
      narrationSourceRef.current = source;

      const now = ctx.currentTime;
      const RAMP = 0.2;
      duckedRef.current = true;
      if (rainGain) rainGain.gain.linearRampToValueAtTime(RAIN_BASE * 0.7, now + RAMP);
      if (droneGain) droneGain.gain.linearRampToValueAtTime(DRONE_BASE * 0.4, now + RAMP);

      source.start(0);
      // Subtitles.jsx listens for this to show the matching hardcoded line,
      // timed to `buffer.duration` — the *real* decoded length of this
      // narration clip, not a hand-guessed timing — so captions stay exactly
      // in sync with the actual voice-over regardless of section or replay.
      window.dispatchEvent(new CustomEvent('narration-start', { detail: { index, duration: buffer.duration } }));
      source.onended = () => {
        // Only reached on a *natural* finish — interrupting a still-playing
        // source for a replay/new section nulls `onended` before calling
        // `.stop()` above, so this never fires for an early cutoff. That's
        // exactly the "completely finished speaking" signal the audio-locked
        // auto-scroll orchestrator (Experience.jsx) waits on.
        if (narrationSourceRef.current === source) narrationSourceRef.current = null;
        completedNarrationsRef.current.add(index);
        window.dispatchEvent(new CustomEvent('narration-end', { detail: { index } }));
        const end = ctx.currentTime;
        if (rainGain) rainGain.gain.linearRampToValueAtTime(RAIN_BASE, end + RAMP);
        if (droneGain) droneGain.gain.linearRampToValueAtTime(DRONE_BASE, end + RAMP);
        duckedRef.current = false;
        applyModulation();
      };
    },
    [applyModulation]
  );

  // Race-safe check for the auto-scroll orchestrator: narration-1 in
  // particular can start (from Loading.jsx's gate timeline) well before
  // Experience.jsx's 'gate-opened' handler starts listening, so a plain
  // "wait for the next narration-end event" can miss one that already fired.
  const hasNarrationCompleted = useCallback((index) => completedNarrationsRef.current.has(index), []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      const master = masterGainRef.current;
      const ctx = ctxRef.current;
      if (master && ctx) {
        master.gain.linearRampToValueAtTime(next ? 0 : 1, ctx.currentTime + 0.15);
      }
      return next;
    });
  }, []);

  return {
    ready,
    muted,
    storeRawBuffer,
    init,
    playGateCreak,
    playNarration,
    hasNarrationCompleted,
    playTypingTick,
    playTerminalBoot,
    playThunder,
    setScrollIntensity,
    setHubActive,
    toggleMute,
  };
}

export { NARRATION_URLS };
