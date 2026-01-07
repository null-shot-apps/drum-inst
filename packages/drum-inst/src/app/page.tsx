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
const DEFAULT_BPM = 120;

type Pattern = boolean[][];

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [savedPatterns, setSavedPatterns] = useState<{ name: string; pattern: Pattern }[]>([]);
  const [showPatternPicker, setShowPatternPicker] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [patternName, setPatternName] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextStepTimeRef = useRef(0);
  const currentStepRef = useRef(-1);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Load saved patterns from localStorage
    const saved = localStorage.getItem('drumPatterns');
    if (saved) {
      try {
        setSavedPatterns(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load patterns:', e);
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Generate drum sounds using Web Audio API
  const playSound = useCallback((drumId: string, time: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    switch (drumId) {
      case 'kick':
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(20, time + 0.5);
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        break;
      case 'snare':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, time);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, time);
        gain.gain.setValueAtTime(0.7, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        break;
      case 'hihat':
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, time);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(5000, time);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        break;
      case 'openhat':
        osc.type = 'square';
        osc.frequency.setValueAtTime(250, time);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(4000, time);
        gain.gain.setValueAtTime(0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        break;
      case 'clap':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, time);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, time);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        break;
      case 'tom':
        osc.frequency.setValueAtTime(180, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.4);
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        break;
      case 'lowtom':
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(20, time + 0.5);
        gain.gain.setValueAtTime(0.85, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        break;
      case 'rim':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, time);
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        break;
      case 'cowbell':
        osc.type = 'square';
        osc.frequency.setValueAtTime(540, time);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, time);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        break;
      case 'crash':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, time);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(3000, time);
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
        break;
    }

    osc.start(time);
    osc.stop(time + 1);
  }, []);

  // Sequencer scheduler
  const scheduler = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const scheduleAheadTime = 0.1;
    const stepDuration = 60 / bpm / 4; // 16th notes

    while (nextStepTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const step = (currentStepRef.current + 1) % STEPS;
      currentStepRef.current = step;
      
      // Schedule sounds for this step
      pattern.forEach((drumPattern, drumIndex) => {
        if (drumPattern[step]) {
          playSound(DRUM_SOUNDS[drumIndex].id, nextStepTimeRef.current);
        }
      });

      // Update visual step indicator
      setCurrentStep(step);

      nextStepTimeRef.current += stepDuration;
    }

    schedulerRef.current = requestAnimationFrame(scheduler);
  }, [bpm, pattern, playSound]);

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

    const newPatterns = [...savedPatterns, { name: patternName, pattern }];
    setSavedPatterns(newPatterns);
    localStorage.setItem('drumPatterns', JSON.stringify(newPatterns));
    setShowSaveDialog(false);
    setPatternName('');
  };

  const handleLoad = (loadedPattern: Pattern) => {
    setPattern(loadedPattern);
    setIsPlaying(false);
  };

  const handleDelete = (index: number) => {
    const newPatterns = savedPatterns.filter((_, i) => i !== index);
    setSavedPatterns(newPatterns);
    localStorage.setItem('drumPatterns', JSON.stringify(newPatterns));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Drum Machine
        </h1>

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
            </div>
          </div>
        </div>

        {/* Sequencer Grid */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6 overflow-x-auto">
          <div className="min-w-[800px]">
            {DRUM_SOUNDS.map((drum, drumIndex) => (
              <div key={drum.id} className="flex items-center gap-2 mb-3">
                <div className="w-20 font-semibold text-sm">{drum.name}</div>
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


























