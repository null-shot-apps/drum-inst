'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// Drum kit configuration
const DRUM_SOUNDS = [
  { id: 'kick', name: 'Kick', color: 'bg-red-500' },
  { id: 'snare', name: 'Snare', color: 'bg-blue-500' },
  { id: 'hihat', name: 'Hi-Hat', color: 'bg-yellow-500' },
  { id: 'openhat', name: 'Open Hat', color: 'bg-amber-500' },
  { id: 'clap', name: 'Clap', color: 'bg-green-500' },
  { id: 'tom', name: 'Tom', color: 'bg-purple-500' },
  { id: 'lowtom', name: 'Low Tom', color: 'bg-violet-500' },
  { id: 'rim', name: 'Rim', color: 'bg-pink-500' },
  { id: 'cowbell', name: 'Cowbell', color: 'bg-orange-500' },
  { id: 'crash', name: 'Crash', color: 'bg-cyan-500' },
];

const STEPS = 16;
const DEFAULT_BPM = 145;

type Pattern = boolean[][];
type InstrumentSettings = {
  volume: number;
  reverb: number;
  delay: number;
  distortion: number;
};

// Preset patterns
const PRESET_PATTERNS = [
  {
    name: 'Hip Hop 1',
    pattern: [
      [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false], // Kick
      [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
      [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false], // Hi-Hat
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Open Hat
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Clap
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Tom
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Low Tom
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Rim
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Cowbell
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Crash
    ]
  },
  {
    name: 'Hip Hop 2',
    pattern: [
      [true, false, false, false, false, false, true, false, false, false, false, false, true, false, false, false], // Kick
      [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
      [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false], // Hi-Hat
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true], // Open Hat
      [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Clap
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Tom
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Low Tom
      [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false], // Rim
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Cowbell
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Crash
    ]
  },
  {
    name: 'Techno 1',
    pattern: [
      [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], // Kick
      [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
      [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false], // Hi-Hat
      [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, true], // Open Hat
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Clap
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Tom
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Low Tom
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Rim
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Cowbell
      [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Crash
    ]
  }
];

export default function DrumMachine() {
  const [pattern, setPattern] = useState<Pattern>(() => 
    Array(DRUM_SOUNDS.length).fill(null).map(() => Array(STEPS).fill(false))
  );

  // Keep pattern ref in sync for scheduler
  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [savedPatterns, setSavedPatterns] = useState<{ name: string; pattern: Pattern }[]>([]);
  const [showPatternPicker, setShowPatternPicker] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [patternName, setPatternName] = useState('');
  const [reverb, setReverb] = useState(0);
  const [delay, setDelay] = useState(0);
  const [distortion, setDistortion] = useState(0);
  const [instrumentSettings, setInstrumentSettings] = useState<InstrumentSettings[]>(() =>
    DRUM_SOUNDS.map(() => ({ volume: 100, reverb: 0, delay: 0, distortion: 0 }))
  );
  const [selectedInstrument, setSelectedInstrument] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextStepTimeRef = useRef(0);
  const currentStepRef = useRef(-1);
  const patternRef = useRef<Pattern>(pattern);
  const activeOscillatorsRef = useRef<Set<OscillatorNode>>(new Set());
  const reverbNodeRef = useRef<ConvolverNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);
  const distortionNodeRef = useRef<WaveShaperNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Initialize audio context
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    
    // Create master output
    masterGainRef.current = ctx.createGain();
    masterGainRef.current.connect(ctx.destination);

    // Create effects input node (where all sounds connect)
    effectsInputRef.current = ctx.createGain();

    // === REVERB with wet/dry mix ===
    reverbNodeRef.current = ctx.createConvolver();
    reverbWetRef.current = ctx.createGain();
    reverbDryRef.current = ctx.createGain();
    
    reverbWetRef.current.gain.value = 0; // Start with no reverb
    reverbDryRef.current.gain.value = 1;

    // Create impulse response for reverb
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 2;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    reverbNodeRef.current.buffer = impulse;

    // === DELAY with wet/dry mix ===
    delayNodeRef.current = ctx.createDelay(1);
    delayNodeRef.current.delayTime.value = 0.25;
    delayFeedbackRef.current = ctx.createGain();
    delayFeedbackRef.current.gain.value = 0;
    delayWetRef.current = ctx.createGain();
    delayDryRef.current = ctx.createGain();
    
    delayWetRef.current.gain.value = 0; // Start with no delay
    delayDryRef.current.gain.value = 1;
    
    delayNodeRef.current.connect(delayFeedbackRef.current);
    delayFeedbackRef.current.connect(delayNodeRef.current);

    // === DISTORTION with wet/dry mix ===
    distortionNodeRef.current = ctx.createWaveShaper();
    distortionNodeRef.current.curve = makeDistortionCurve(0);
    distortionWetRef.current = ctx.createGain();
    distortionDryRef.current = ctx.createGain();
    
    distortionWetRef.current.gain.value = 0; // Start with no distortion
    distortionDryRef.current.gain.value = 1;

    // === ROUTING ===
    // Input splits to dry and wet paths for each effect
    
    // Distortion routing
    effectsInputRef.current.connect(distortionNodeRef.current);
    distortionNodeRef.current.connect(distortionWetRef.current);
    effectsInputRef.current.connect(distortionDryRef.current);
    
    // Merge distortion and connect to delay
    const distortionMerge = ctx.createGain();
    distortionWetRef.current.connect(distortionMerge);
    distortionDryRef.current.connect(distortionMerge);
    
    // Delay routing
    distortionMerge.connect(delayNodeRef.current);
    delayNodeRef.current.connect(delayWetRef.current);
    distortionMerge.connect(delayDryRef.current);
    
    // Merge delay and connect to reverb
    const delayMerge = ctx.createGain();
    delayWetRef.current.connect(delayMerge);
    delayDryRef.current.connect(delayMerge);
    
    // Reverb routing
    delayMerge.connect(reverbNodeRef.current);
    reverbNodeRef.current.connect(reverbWetRef.current);
    delayMerge.connect(reverbDryRef.current);
    
    // Merge reverb and connect to master
    reverbWetRef.current.connect(masterGainRef.current);
    reverbDryRef.current.connect(masterGainRef.current);
    
    // Load saved patterns from localStorage
    try {
      const saved = localStorage.getItem('drumPatterns');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate structure
        if (Array.isArray(parsed)) {
          setSavedPatterns(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load patterns:', e);
      // Clear corrupted data
      localStorage.removeItem('drumPatterns');
    }

    return () => {
      // Clean up all active oscillators
      activeOscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          // Oscillator may already be stopped
        }
      });
      activeOscillatorsRef.current.clear();

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Create distortion curve
  const makeDistortionCurve = (amount: number) => {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  };

  // Wet/dry gain nodes for effects mixing
  const reverbWetRef = useRef<GainNode | null>(null);
  const reverbDryRef = useRef<GainNode | null>(null);
  const delayWetRef = useRef<GainNode | null>(null);
  const delayDryRef = useRef<GainNode | null>(null);
  const distortionWetRef = useRef<GainNode | null>(null);
  const distortionDryRef = useRef<GainNode | null>(null);
  const effectsInputRef = useRef<GainNode | null>(null);

  // Update effects - control wet/dry mix and parameters
  useEffect(() => {
    if (!audioContextRef.current) return;
    
    // Update delay feedback (controls delay intensity)
    if (delayFeedbackRef.current) {
      delayFeedbackRef.current.gain.value = delay / 100 * 0.5;
    }

    // Update delay wet/dry mix
    if (delayWetRef.current && delayDryRef.current) {
      const wetAmount = delay / 100;
      delayWetRef.current.gain.value = wetAmount;
      delayDryRef.current.gain.value = 1 - wetAmount;
    }

    // Update distortion curve (controls distortion amount)
    if (distortionNodeRef.current) {
      distortionNodeRef.current.curve = makeDistortionCurve(distortion / 10);
    }

    // Update distortion wet/dry mix
    if (distortionWetRef.current && distortionDryRef.current) {
      const wetAmount = distortion / 100;
      distortionWetRef.current.gain.value = wetAmount;
      distortionDryRef.current.gain.value = 1 - wetAmount;
    }

    // Update reverb wet/dry mix
    if (reverbWetRef.current && reverbDryRef.current) {
      const wetAmount = reverb / 100;
      reverbWetRef.current.gain.value = wetAmount;
      reverbDryRef.current.gain.value = 1 - wetAmount;
    }
  }, [reverb, delay, distortion]);

  // Generate drum sounds using Web Audio API
  const playSound = useCallback((drumId: string, time: number, drumIndex: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const settings = instrumentSettings[drumIndex];
    const volumeMultiplier = settings.volume / 100;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Create individual effects chain for this instrument
    const instDistortion = ctx.createWaveShaper();
    const instDelay = ctx.createDelay(1);
    const instDelayFeedback = ctx.createGain();
    const instReverb = ctx.createConvolver();
    
    // Create wet/dry gains for individual effects
    const instDistortionWet = ctx.createGain();
    const instDistortionDry = ctx.createGain();
    const instDelayWet = ctx.createGain();
    const instDelayDry = ctx.createGain();
    const instReverbWet = ctx.createGain();
    const instReverbDry = ctx.createGain();

    // Configure individual distortion
    instDistortion.curve = makeDistortionCurve(settings.distortion / 10);
    instDistortionWet.gain.value = settings.distortion / 100;
    instDistortionDry.gain.value = 1 - (settings.distortion / 100);

    // Configure individual delay
    instDelay.delayTime.value = 0.25;
    instDelayFeedback.gain.value = settings.delay / 100 * 0.5;
    instDelayWet.gain.value = settings.delay / 100;
    instDelayDry.gain.value = 1 - (settings.delay / 100);
    instDelay.connect(instDelayFeedback);
    instDelayFeedback.connect(instDelay);

    // Configure individual reverb
    const impulseLength = ctx.sampleRate * 2;
    const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < impulseLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
      }
    }
    instReverb.buffer = impulse;
    instReverbWet.gain.value = settings.reverb / 100;
    instReverbDry.gain.value = 1 - (settings.reverb / 100);

    // Build effects chain: osc -> filter -> gain -> distortion -> delay -> reverb -> master
    osc.connect(filter);
    filter.connect(gain);
    
    // Distortion routing
    gain.connect(instDistortion);
    instDistortion.connect(instDistortionWet);
    gain.connect(instDistortionDry);
    
    const distortionMerge = ctx.createGain();
    instDistortionWet.connect(distortionMerge);
    instDistortionDry.connect(distortionMerge);
    
    // Delay routing
    distortionMerge.connect(instDelay);
    instDelay.connect(instDelayWet);
    distortionMerge.connect(instDelayDry);
    
    const delayMerge = ctx.createGain();
    instDelayWet.connect(delayMerge);
    instDelayDry.connect(delayMerge);
    
    // Reverb routing
    delayMerge.connect(instReverb);
    instReverb.connect(instReverbWet);
    delayMerge.connect(instReverbDry);
    
    // Connect to master (also apply global effects if needed)
    if (effectsInputRef.current) {
      instReverbWet.connect(effectsInputRef.current);
      instReverbDry.connect(effectsInputRef.current);
    } else if (masterGainRef.current) {
      instReverbWet.connect(masterGainRef.current);
      instReverbDry.connect(masterGainRef.current);
    }

    // Track active oscillators for cleanup
    activeOscillatorsRef.current.add(osc);

    const MIN_FREQ = 0.01; // Minimum frequency for exponential ramps
    const MIN_GAIN = 0.001; // Minimum gain for exponential ramps

    switch (drumId) {
      case 'kick':
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(Math.max(MIN_FREQ, 20), time + 0.5);
        gain.gain.setValueAtTime(1 * volumeMultiplier, time);
        gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.5);
        break;
      case 'snare':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, time);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, time);
        gain.gain.setValueAtTime(0.7 * volumeMultiplier, time);
        gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.2);
        break;
      case 'hihat':
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, time);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(5000, time);
        gain.gain.setValueAtTime(0.3 * volumeMultiplier, time);
        gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.05);
        break;
      case 'openhat':
        osc.type = 'square';
        osc.frequency.setValueAtTime(250, time);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(4000, time);
        gain.gain.setValueAtTime(0.35 * volumeMultiplier, time);
        gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.3);
        break;
      case 'clap':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, time);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, time);
        gain.gain.setValueAtTime(0.5 * volumeMultiplier, time);
        gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.1);
        break;
      case 'tom':
        osc.frequency.setValueAtTime(180, time);
        osc.frequency.exponentialRampToValueAtTime(Math.max(MIN_FREQ, 30), time + 0.4);
        gain.gain.setValueAtTime(0.8 * volumeMultiplier, time);
        gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.4);
        break;
      case 'lowtom':
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(Math.max(MIN_FREQ, 20), time + 0.5);
        gain.gain.setValueAtTime(0.85 * volumeMultiplier, time);
        gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.5);
        break;
      case 'rim':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, time);
        gain.gain.setValueAtTime(0.4 * volumeMultiplier, time);
        gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.08);
        break;
      case 'cowbell':
        osc.type = 'square';
        osc.frequency.setValueAtTime(540, time);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, time);
        gain.gain.setValueAtTime(0.5 * volumeMultiplier, time);
        gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.15);
        break;
      case 'crash':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, time);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(3000, time);
        gain.gain.setValueAtTime(0.4 * volumeMultiplier, time);
        gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.8);
        break;
    }

    osc.start(time);
    osc.stop(time + 1);

    // Clean up oscillator reference after it stops
    osc.onended = () => {
      activeOscillatorsRef.current.delete(osc);
    };
  }, [instrumentSettings]);

  // Sequencer scheduler
  const scheduler = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const scheduleAheadTime = 0.1;
    const stepDuration = 60 / bpm / 4; // 16th notes

    while (nextStepTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const step = (currentStepRef.current + 1) % STEPS;
      currentStepRef.current = step;
      
      // Use pattern ref to avoid stale closure
      const currentPattern = patternRef.current;
      
      // Schedule sounds for this step
      currentPattern.forEach((drumPattern, drumIndex) => {
        if (drumPattern[step]) {
          playSound(DRUM_SOUNDS[drumIndex].id, nextStepTimeRef.current, drumIndex);
        }
      });

      // Update visual step indicator (batched by React)
      setCurrentStep(step);

      nextStepTimeRef.current += stepDuration;
    }

    schedulerRef.current = requestAnimationFrame(scheduler);
  }, [bpm, playSound]);

  // Play/pause control
  useEffect(() => {
    if (isPlaying) {
      const ctx = audioContextRef.current;
      if (!ctx) return;

      // Resume audio context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Only reset time if starting from stop (currentStepRef is -1)
      if (currentStepRef.current === -1) {
        nextStepTimeRef.current = ctx.currentTime;
      } else {
        // Resume from current position
        nextStepTimeRef.current = ctx.currentTime;
      }
      
      scheduler();
    } else {
      if (schedulerRef.current) {
        cancelAnimationFrame(schedulerRef.current);
        schedulerRef.current = null;
      }
      // Don't reset currentStep on pause - keep position
    }

    return () => {
      if (schedulerRef.current) {
        cancelAnimationFrame(schedulerRef.current);
      }
    };
  }, [isPlaying, scheduler]);

  const toggleStep = (drumIndex: number, step: number) => {
    setPattern(prev => {
      const newPattern = prev.map(row => [...row]);
      newPattern[drumIndex][step] = !newPattern[drumIndex][step];
      return newPattern;
    });
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    // Keep current position for resume
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentStep(-1);
    currentStepRef.current = -1; // Reset to beginning
  };

  const handleClear = () => {
    setPattern(Array(DRUM_SOUNDS.length).fill(null).map(() => Array(STEPS).fill(false)));
  };

  const handleSave = () => {
    setShowSaveDialog(true);
  };

  const confirmSave = () => {
    if (!patternName.trim()) return;

    try {
      const newPatterns = [...savedPatterns, { name: patternName, pattern }];
      setSavedPatterns(newPatterns);
      localStorage.setItem('drumPatterns', JSON.stringify(newPatterns));
      setShowSaveDialog(false);
      setPatternName('');
    } catch (e) {
      console.error('Failed to save pattern:', e);
      alert('Failed to save pattern. Storage may be full.');
    }
  };

  const handleLoad = (loadedPattern: Pattern) => {
    setPattern(loadedPattern);
    setIsPlaying(false);
  };

  const handleDelete = (index: number) => {
    try {
      const newPatterns = savedPatterns.filter((_, i) => i !== index);
      setSavedPatterns(newPatterns);
      localStorage.setItem('drumPatterns', JSON.stringify(newPatterns));
    } catch (e) {
      console.error('Failed to delete pattern:', e);
    }
  };

  const handleExport = async () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    setIsExporting(true);

    try {
      // Create offline context for rendering
      const stepDuration = 60 / bpm / 4;
      const totalBars = 4;
      const totalSteps = STEPS * totalBars;
      const duration = stepDuration * totalSteps + 1; // Add 1 second for reverb tail
      const sampleRate = 44100; // Standard sample rate
      
      const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
      
      // Create master output
      const offlineMaster = offlineCtx.createGain();
      offlineMaster.connect(offlineCtx.destination);

      // Create effects input
      const offlineEffectsInput = offlineCtx.createGain();

      // === REVERB with wet/dry mix ===
      const offlineReverb = offlineCtx.createConvolver();
      const offlineReverbWet = offlineCtx.createGain();
      const offlineReverbDry = offlineCtx.createGain();
      
      offlineReverbWet.gain.value = reverb / 100;
      offlineReverbDry.gain.value = 1 - (reverb / 100);
      
      // Create impulse response
      const impulseLength = offlineCtx.sampleRate * 2;
      const impulse = offlineCtx.createBuffer(2, impulseLength, offlineCtx.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < impulseLength; i++) {
          channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
        }
      }
      offlineReverb.buffer = impulse;

      // === DELAY with wet/dry mix ===
      const offlineDelay = offlineCtx.createDelay(1);
      offlineDelay.delayTime.value = 0.25;
      const offlineDelayFeedback = offlineCtx.createGain();
      offlineDelayFeedback.gain.value = delay / 100 * 0.5;
      const offlineDelayWet = offlineCtx.createGain();
      const offlineDelayDry = offlineCtx.createGain();
      
      offlineDelayWet.gain.value = delay / 100;
      offlineDelayDry.gain.value = 1 - (delay / 100);
      
      offlineDelay.connect(offlineDelayFeedback);
      offlineDelayFeedback.connect(offlineDelay);

      // === DISTORTION with wet/dry mix ===
      const offlineDistortion = offlineCtx.createWaveShaper();
      offlineDistortion.curve = makeDistortionCurve(distortion / 10);
      const offlineDistortionWet = offlineCtx.createGain();
      const offlineDistortionDry = offlineCtx.createGain();
      
      offlineDistortionWet.gain.value = distortion / 100;
      offlineDistortionDry.gain.value = 1 - (distortion / 100);

      // === ROUTING (same as live audio) ===
      // Distortion routing
      offlineEffectsInput.connect(offlineDistortion);
      offlineDistortion.connect(offlineDistortionWet);
      offlineEffectsInput.connect(offlineDistortionDry);
      
      const offlineDistortionMerge = offlineCtx.createGain();
      offlineDistortionWet.connect(offlineDistortionMerge);
      offlineDistortionDry.connect(offlineDistortionMerge);
      
      // Delay routing
      offlineDistortionMerge.connect(offlineDelay);
      offlineDelay.connect(offlineDelayWet);
      offlineDistortionMerge.connect(offlineDelayDry);
      
      const offlineDelayMerge = offlineCtx.createGain();
      offlineDelayWet.connect(offlineDelayMerge);
      offlineDelayDry.connect(offlineDelayMerge);
      
      // Reverb routing
      offlineDelayMerge.connect(offlineReverb);
      offlineReverb.connect(offlineReverbWet);
      offlineDelayMerge.connect(offlineReverbDry);
      
      offlineReverbWet.connect(offlineMaster);
      offlineReverbDry.connect(offlineMaster);

      // Schedule all sounds
      for (let bar = 0; bar < totalBars; bar++) {
        for (let step = 0; step < STEPS; step++) {
          const time = (bar * STEPS + step) * stepDuration;
          
          pattern.forEach((drumPattern, drumIndex) => {
            if (drumPattern[step]) {
              const drumId = DRUM_SOUNDS[drumIndex].id;
              
              // Create sound for offline rendering
              const osc = offlineCtx.createOscillator();
              const gain = offlineCtx.createGain();
              const filter = offlineCtx.createBiquadFilter();

              osc.connect(filter);
              filter.connect(gain);
              gain.connect(offlineEffectsInput);

              const MIN_FREQ = 0.01;
              const MIN_GAIN = 0.001;

              switch (drumId) {
                case 'kick':
                  osc.frequency.setValueAtTime(150, time);
                  osc.frequency.exponentialRampToValueAtTime(Math.max(MIN_FREQ, 20), time + 0.5);
                  gain.gain.setValueAtTime(1, time);
                  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.5);
                  break;
                case 'snare':
                  osc.type = 'triangle';
                  osc.frequency.setValueAtTime(200, time);
                  filter.type = 'highpass';
                  filter.frequency.setValueAtTime(1000, time);
                  gain.gain.setValueAtTime(0.7, time);
                  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.2);
                  break;
                case 'hihat':
                  osc.type = 'square';
                  osc.frequency.setValueAtTime(300, time);
                  filter.type = 'highpass';
                  filter.frequency.setValueAtTime(5000, time);
                  gain.gain.setValueAtTime(0.3, time);
                  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.05);
                  break;
                case 'openhat':
                  osc.type = 'square';
                  osc.frequency.setValueAtTime(250, time);
                  filter.type = 'highpass';
                  filter.frequency.setValueAtTime(4000, time);
                  gain.gain.setValueAtTime(0.35, time);
                  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.3);
                  break;
                case 'clap':
                  osc.type = 'sawtooth';
                  osc.frequency.setValueAtTime(400, time);
                  filter.type = 'bandpass';
                  filter.frequency.setValueAtTime(1500, time);
                  gain.gain.setValueAtTime(0.5, time);
                  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.1);
                  break;
                case 'tom':
                  osc.frequency.setValueAtTime(180, time);
                  osc.frequency.exponentialRampToValueAtTime(Math.max(MIN_FREQ, 30), time + 0.4);
                  gain.gain.setValueAtTime(0.8, time);
                  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.4);
                  break;
                case 'lowtom':
                  osc.frequency.setValueAtTime(120, time);
                  osc.frequency.exponentialRampToValueAtTime(Math.max(MIN_FREQ, 20), time + 0.5);
                  gain.gain.setValueAtTime(0.85, time);
                  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.5);
                  break;
                case 'rim':
                  osc.type = 'triangle';
                  osc.frequency.setValueAtTime(800, time);
                  gain.gain.setValueAtTime(0.4, time);
                  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.08);
                  break;
                case 'cowbell':
                  osc.type = 'square';
                  osc.frequency.setValueAtTime(540, time);
                  filter.type = 'bandpass';
                  filter.frequency.setValueAtTime(800, time);
                  gain.gain.setValueAtTime(0.5, time);
                  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.15);
                  break;
                case 'crash':
                  osc.type = 'sawtooth';
                  osc.frequency.setValueAtTime(450, time);
                  filter.type = 'highpass';
                  filter.frequency.setValueAtTime(3000, time);
                  gain.gain.setValueAtTime(0.4, time);
                  gain.gain.exponentialRampToValueAtTime(MIN_GAIN, time + 0.8);
                  break;
              }

              osc.start(time);
              osc.stop(time + 1);
            }
          });
        }
      }

      // Render audio
      const renderedBuffer = await offlineCtx.startRendering();

      // Convert to WAV
      const wav = audioBufferToWav(renderedBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      // Download
      const a = document.createElement('a');
      a.href = url;
      a.download = `drum-pattern-${Date.now()}.wav`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Write audio data
    const channels = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Drum Machine
        </h1>

        {/* Effects Controls */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-purple-300">Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-semibold">Reverb</span>
                <span className="text-sm text-gray-400">{reverb}%</span>
              </label>
              <input
                type="range"
                value={reverb}
                onChange={(e) => setReverb(parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full"
              />
            </div>
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-semibold">Delay</span>
                <span className="text-sm text-gray-400">{delay}%</span>
              </label>
              <input
                type="range"
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full"
              />
            </div>
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="font-semibold">Distortion</span>
                <span className="text-sm text-gray-400">{distortion}%</span>
              </label>
              <input
                type="range"
                value={distortion}
                onChange={(e) => setDistortion(parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handlePlay}
                disabled={isPlaying}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                Play
              </button>
              <button
                onClick={handlePause}
                disabled={!isPlaying}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                Pause
              </button>
              <button
                onClick={handleStop}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors"
              >
                Stop
              </button>
              <button
                onClick={handleClear}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <span className="font-semibold">BPM:</span>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(Math.max(40, Math.min(240, parseInt(e.target.value) || DEFAULT_BPM)))}
                  className="w-20 px-3 py-2 bg-gray-700 rounded-lg text-center"
                  min="40"
                  max="240"
                />
              </label>
              <input
                type="range"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                min="40"
                max="240"
                className="w-32"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
              >
                Save Pattern
              </button>
              <button
                onClick={() => setShowPatternPicker(true)}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-semibold transition-colors"
              >
                Load Pattern
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-6 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                {isExporting ? 'Exporting...' : 'Export Audio'}
              </button>
            </div>
          </div>
        </div>

        {/* Sequencer Grid */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6 overflow-x-auto">
          <div className="min-w-[800px]">
            {DRUM_SOUNDS.map((drum, drumIndex) => (
              <div key={drum.id} className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setSelectedInstrument(selectedInstrument === drumIndex ? null : drumIndex)}
                  className={`w-20 font-semibold text-sm text-left px-2 py-1 rounded transition-colors ${
                    selectedInstrument === drumIndex ? 'bg-purple-600' : 'hover:bg-gray-700'
                  }`}
                >
                  {drum.name}
                </button>
                <div className="flex gap-1 flex-1">
                  {Array.from({ length: STEPS }).map((_, step) => (
                    <button
                      key={step}
                      onClick={() => toggleStep(drumIndex, step)}
                      className={`
                        flex-1 aspect-square rounded transition-all
                        ${pattern[drumIndex][step] ? drum.color : 'bg-gray-700'}
                        ${currentStep === step ? 'ring-4 ring-white scale-110' : ''}
                        ${step % 4 === 0 ? 'ml-2' : ''}
                        hover:opacity-80
                      `}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Instrument Controls */}
        {selectedInstrument !== null && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-purple-300">
              {DRUM_SOUNDS[selectedInstrument].name} Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Volume</span>
                  <span className="text-sm text-gray-400">{instrumentSettings[selectedInstrument].volume}%</span>
                </label>
                <input
                  type="range"
                  value={instrumentSettings[selectedInstrument].volume}
                  onChange={(e) => {
                    const newSettings = [...instrumentSettings];
                    newSettings[selectedInstrument].volume = parseInt(e.target.value);
                    setInstrumentSettings(newSettings);
                  }}
                  min="0"
                  max="200"
                  className="w-full"
                />
              </div>
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Reverb</span>
                  <span className="text-sm text-gray-400">{instrumentSettings[selectedInstrument].reverb}%</span>
                </label>
                <input
                  type="range"
                  value={instrumentSettings[selectedInstrument].reverb}
                  onChange={(e) => {
                    const newSettings = [...instrumentSettings];
                    newSettings[selectedInstrument].reverb = parseInt(e.target.value);
                    setInstrumentSettings(newSettings);
                  }}
                  min="0"
                  max="100"
                  className="w-full"
                />
              </div>
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Delay</span>
                  <span className="text-sm text-gray-400">{instrumentSettings[selectedInstrument].delay}%</span>
                </label>
                <input
                  type="range"
                  value={instrumentSettings[selectedInstrument].delay}
                  onChange={(e) => {
                    const newSettings = [...instrumentSettings];
                    newSettings[selectedInstrument].delay = parseInt(e.target.value);
                    setInstrumentSettings(newSettings);
                  }}
                  min="0"
                  max="100"
                  className="w-full"
                />
              </div>
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Distortion</span>
                  <span className="text-sm text-gray-400">{instrumentSettings[selectedInstrument].distortion}%</span>
                </label>
                <input
                  type="range"
                  value={instrumentSettings[selectedInstrument].distortion}
                  onChange={(e) => {
                    const newSettings = [...instrumentSettings];
                    newSettings[selectedInstrument].distortion = parseInt(e.target.value);
                    setInstrumentSettings(newSettings);
                  }}
                  min="0"
                  max="100"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Dialog Modal */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Save Pattern</h2>
              <input
                type="text"
                value={patternName}
                onChange={(e) => setPatternName(e.target.value)}
                placeholder="Enter pattern name..."
                className="w-full px-4 py-3 bg-gray-700 rounded-lg mb-4 text-white placeholder-gray-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmSave();
                  if (e.key === 'Escape') {
                    setShowSaveDialog(false);
                    setPatternName('');
                  }
                }}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setPatternName('');
                  }}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  disabled={!patternName.trim()}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pattern Picker Modal */}
        {showPatternPicker && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Load Pattern</h2>
                <button
                  onClick={() => setShowPatternPicker(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Preset Patterns Section */}
                <div>
                  <h3 className="text-xl font-bold mb-3 text-purple-400">Preset Patterns</h3>
                  <div className="space-y-3">
                    {PRESET_PATTERNS.map((preset, index) => (
                      <div key={`preset-${index}`} className="bg-purple-900/30 rounded-lg p-4 flex justify-between items-center hover:bg-purple-900/50 transition-colors border border-purple-500/30">
                        <span className="font-semibold text-lg">{preset.name}</span>
                        <button
                          onClick={() => {
                            handleLoad(preset.pattern);
                            setShowPatternPicker(false);
                          }}
                          className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-semibold transition-colors"
                        >
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Saved Patterns Section */}
                <div>
                  <h3 className="text-xl font-bold mb-3 text-blue-400">Your Saved Patterns</h3>
                  {savedPatterns.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No saved patterns yet. Create and save a pattern first!</p>
                  ) : (
                    <div className="space-y-3">
                      {savedPatterns.map((saved, index) => (
                        <div key={index} className="bg-gray-700/50 rounded-lg p-4 flex justify-between items-center hover:bg-gray-700 transition-colors">
                          <span className="font-semibold text-lg">{saved.name}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                handleLoad(saved.pattern);
                                setShowPatternPicker(false);
                              }}
                              className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete pattern "${saved.name}"?`)) {
                                  handleDelete(index);
                                }
                              }}
                              className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



















































