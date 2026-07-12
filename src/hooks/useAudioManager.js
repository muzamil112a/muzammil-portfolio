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
// Rain and drone are never layered together — rain plays from the start,
// and hands off to drone the moment Hub is reached (hubActiveRef), never
// the two at once. A longer, deliberate ramp than the snappy scroll-
// reactive one above, so the handoff reads as a genuine scene change
// ("you've arrived at the mansion") rather than a quick modulation tick.
const HANDOFF_RAMP = 3;
// Terminal (the actual page footer) fades the whole bed out to silence
// rather than just leaving it running — a much longer, deliberate ramp than
// the snappy scroll-reactive one above, so it reads as "the story is over"
// rather than another quick modulation tick.
const FOOTER_FADE_RAMP = 2.5;

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
  const footerActiveRef = useRef(false);
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

      // Both loops start immediately and just run for the page's lifetime —
      // only their GAIN decides which one is actually audible (see
      // applyModulation), so there's no separate start/stop bookkeeping
      // needed when handing off between them later. droneGain stays at its
      // initial 0 here; rain is what plays first.
      playLoop('rain-loop', rainFilter, ctx);
      playLoop('drone-loop', droneGain, ctx);

      const now = ctx.currentTime;
      rainGain.gain.linearRampToValueAtTime(RAIN_BASE, now + 2);

      setMuted(startMuted);
      setReady(true);
    },
    [decodeAll, playLoop]
  );

  // Recomputes drone/rain targets from the current scroll-velocity intensity
  // (0-1) and Hub-arrival flag, and ramps toward them. Skipped while a
  // narration is ducking the beds (narration restore re-applies this itself).
  //
  // Rain and drone are never both audible: before Hub is reached, rain
  // plays (its own filter still brightens with scroll speed) and drone sits
  // at 0; the instant hubActiveRef flips true this crossfades — drone ramps
  // up (with its scroll/Hub boost) while rain ramps down to 0 — over
  // HANDOFF_RAMP rather than the snappy scroll-reactive MODULATION_RAMP, so
  // it reads as a scene change rather than a modulation tick. Once past
  // Hub, hubActiveRef stays true (nothing un-sets it within the canvas) so
  // there's no drone-back-to-rain handoff later — just Terminal's footer
  // override, below, taking it the rest of the way to silence.
  //
  // Experience.jsx's ScrollTrigger — the only thing that ever calls
  // setScrollIntensity/setHubActive — only covers Hero through Hub (the
  // sticky canvas); once the visitor scrolls past it into Contact/Terminal
  // (plain document flow, no ScrollTrigger watching them) those two refs
  // simply freeze at whatever they last were, which was usually "fast
  // scroll, Hub active" right as the visitor left the canvas. That's what
  // the footer override below is for: Terminal.jsx calls
  // setFooterActive(true) once it's in view and this takes over
  // unconditionally, fading both layers to silence instead of leaving them
  // stuck at that frozen boosted level for the rest of the page. Contact.jsx
  // separately resets scrollIntensity/hubActive to a calm baseline on its
  // own entrance so the volume settles down section by section even before
  // the footer, and so scrolling back UP out of Terminal restores to that
  // calm baseline (rain, not drone) rather than the stale "still boosted
  // from Hub" values.
  const applyModulation = useCallback(() => {
    const ctx = ctxRef.current;
    const droneGain = droneGainRef.current;
    const rainGain = rainGainRef.current;
    const rainFilter = rainFilterRef.current;
    if (!ctx || !droneGain || !rainGain || !rainFilter || duckedRef.current) return;

    const now = ctx.currentTime;

    if (footerActiveRef.current) {
      droneGain.gain.linearRampToValueAtTime(0, now + FOOTER_FADE_RAMP);
      rainGain.gain.linearRampToValueAtTime(0, now + FOOTER_FADE_RAMP);
      return;
    }

    const intensity = scrollIntensityRef.current;
    const filterTarget = RAIN_FILTER_MIN_HZ + intensity * (RAIN_FILTER_MAX_HZ - RAIN_FILTER_MIN_HZ);
    rainFilter.frequency.linearRampToValueAtTime(filterTarget, now + MODULATION_RAMP);

    if (hubActiveRef.current) {
      const droneTarget = DRONE_BASE * (1 + intensity * DRONE_SCROLL_BOOST + DRONE_HUB_BOOST);
      droneGain.gain.linearRampToValueAtTime(droneTarget, now + HANDOFF_RAMP);
      rainGain.gain.linearRampToValueAtTime(0, now + HANDOFF_RAMP);
    } else {
      rainGain.gain.linearRampToValueAtTime(RAIN_BASE, now + MODULATION_RAMP);
      droneGain.gain.linearRampToValueAtTime(0, now + MODULATION_RAMP);
    }
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

  // Terminal.jsx calls this from its own IntersectionObserver (entering AND
  // leaving, not one-shot) — see the big comment on applyModulation above
  // for why this needs to unconditionally override the scroll/Hub-driven
  // targets rather than just being another input to that formula.
  const setFooterActive = useCallback(
    (active) => {
      if (footerActiveRef.current === active) return;
      footerActiveRef.current = active;
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
      const sfxGain = sfxGainRef.current;
      if (!ctx || !buffer || !narrationGain) {
        // No playable buffer (decode failure, missing asset, audio not yet
        // initialized) — Experience.jsx's auto-scroll orchestrator waits on
        // 'narration-end' for this exact index before advancing, so without
        // this it would sit on its NARRATION_WAIT_TIMEOUT_MS fallback (15s)
        // instead of recovering immediately.
        completedNarrationsRef.current.add(index);
        window.dispatchEvent(new CustomEvent('narration-end', { detail: { index } }));
        return;
      }

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
      // Only duck whichever of rain/drone is actually the active layer right
      // now (see applyModulation's hubActiveRef branch) — the other is
      // already sitting at 0, and ducking it "up" to a fraction of its own
      // base would make it audibly wake up mid-narration despite rain/drone
      // never being meant to play together.
      if (hubActiveRef.current) {
        if (droneGain) droneGain.gain.linearRampToValueAtTime(DRONE_BASE * 0.4, now + RAMP);
      } else if (rainGain) {
        rainGain.gain.linearRampToValueAtTime(RAIN_BASE * 0.7, now + RAMP);
      }
      // Gate creak (played moments before narration-1) is still mid-decay when
      // the voice starts — measured envelope shows it stays loud through
      // ~1.9s of its own 3s length, not just a brief opening transient, so it
      // was still burying "In every fog..." even after nudging narration's
      // start later (reported as "narrator starts mid-sentence"). A fast duck
      // right as narration begins clears the voice regardless of exactly
      // where in the creak's decay it lands, rather than chasing the exact
      // timing offset again.
      if (sfxGain) sfxGain.gain.linearRampToValueAtTime(GATE_CREAK_GAIN * 0.12, now + 0.08);

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
        if (sfxGain) sfxGain.gain.linearRampToValueAtTime(GATE_CREAK_GAIN, end + RAMP);
        // No explicit rain/drone restore here (unlike sfxGain above) —
        // duckedRef flips false on the next line and applyModulation()
        // right after already restores whichever of the two is the
        // currently-active layer and leaves the other at 0, which a blind
        // "ramp both back to their base" here would get wrong.
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
    setFooterActive,
    toggleMute,
  };
}

export { NARRATION_URLS };
