// app/context/SoundContext.js
'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SoundContext = createContext();

export function SoundProvider({ children }) {
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Load preference from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sound-enabled');
        if (saved !== null) {
            setSoundEnabled(saved === 'true');
        }
    }, []);

    // Save preference
    const toggleSound = () => {
        setSoundEnabled(prev => {
            const newVal = !prev;
            localStorage.setItem('sound-enabled', String(newVal));
            return newVal;
        });
    };

    const play = useCallback((type = 'click', volume = 0.5) => {
        if (!soundEnabled) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const now = ctx.currentTime;

            // Master Gain (Volume)
            const masterGain = ctx.createGain();
            masterGain.connect(ctx.destination);
            masterGain.gain.setValueAtTime(volume, now);

            // Helper: Create an oscillator with envelope
            const playTone = (freq, type, duration, attack = 0.01, decay = 0.1) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(freq, now);

                osc.connect(gain);
                gain.connect(masterGain);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(1, now + attack);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

                osc.start(now);
                osc.stop(now + duration);
            };

            switch (type) {
                case 'click':
                    // ✨ Glass Tap: High sine + Bandpass (Subtle)
                    playTone(800, 'sine', 0.05, 0.005, 0.05);
                    break;

                case 'navigate':
                    // 🚀 Swoosh/Transition: Quick pitch ramp up
                    const oscNav = ctx.createOscillator();
                    const gainNav = ctx.createGain();
                    oscNav.type = 'sine';
                    oscNav.frequency.setValueAtTime(200, now);
                    oscNav.frequency.exponentialRampToValueAtTime(400, now + 0.1);
                    oscNav.connect(gainNav);
                    gainNav.connect(masterGain);
                    gainNav.gain.setValueAtTime(0, now);
                    gainNav.gain.linearRampToValueAtTime(0.3, now + 0.02);
                    gainNav.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    oscNav.start(now);
                    oscNav.stop(now + 0.1);
                    break;

                case 'card-open':
                    // 🃏 Card Flip: Fast low-to-high sweep
                    const oscCard = ctx.createOscillator();
                    const gainCard = ctx.createGain();
                    oscCard.type = 'triangle';
                    oscCard.frequency.setValueAtTime(150, now);
                    oscCard.frequency.linearRampToValueAtTime(300, now + 0.08);
                    oscCard.connect(gainCard);
                    gainCard.connect(masterGain);
                    gainCard.gain.setValueAtTime(0, now);
                    gainCard.gain.linearRampToValueAtTime(0.4, now + 0.01);
                    gainCard.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    oscCard.start(now);
                    oscCard.stop(now + 0.08);
                    break;

                case 'pop':
                case 'select':
                    // 💧 Bubble/Select: Resonant filter sweep
                    const oscPop = ctx.createOscillator();
                    const gainPop = ctx.createGain();
                    const filterPop = ctx.createBiquadFilter();

                    oscPop.type = 'sawtooth';
                    oscPop.frequency.value = 150;

                    filterPop.type = 'lowpass';
                    filterPop.frequency.setValueAtTime(200, now);
                    filterPop.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                    filterPop.Q.value = 5;

                    oscPop.connect(filterPop);
                    filterPop.connect(gainPop);
                    gainPop.connect(masterGain);

                    gainPop.gain.setValueAtTime(0, now);
                    gainPop.gain.linearRampToValueAtTime(0.4, now + 0.01);
                    gainPop.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

                    oscPop.start(now);
                    oscPop.stop(now + 0.1);
                    break;

                case 'success':
                    // 🌟 Premium Success: Arpeggio overlay
                    playTone(440, 'sine', 0.4, 0.01, 0.3); // A4
                    setTimeout(() => playTone(554.37, 'sine', 0.4, 0.01, 0.3), 60); // C#5
                    setTimeout(() => playTone(659.25, 'sine', 0.6, 0.01, 0.4), 120); // E5
                    break;

                case 'logout':
                    // 🚪 Logout: Descending tones
                    playTone(600, 'sine', 0.2, 0.01, 0.2);
                    setTimeout(() => playTone(400, 'sine', 0.3, 0.01, 0.3), 100);
                    break;

                case 'intro':
                    // 📇 Card Shuffle/Intro: Extended Rapid cascading ticks + Sweep
                    // 1. Ticks (simulating cards appearing) - Extended to 20 ticks (~1.6s)
                    for (let i = 0; i < 20; i++) {
                        setTimeout(() => {
                            const osc = ctx.createOscillator();
                            const g = ctx.createGain();
                            osc.type = 'triangle';
                            // Slight randomness in pitch for more organic feel
                            osc.frequency.value = 800 + (i * 50) + (Math.random() * 50);
                            osc.connect(g);
                            g.connect(masterGain);

                            // Slightly longer attack/decay for smoother cascade
                            g.gain.setValueAtTime(0, now + (i * 0.08));
                            g.gain.linearRampToValueAtTime(0.04, now + (i * 0.08) + 0.01);
                            g.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.08) + 0.05);

                            osc.start(now + (i * 0.08));
                            osc.stop(now + (i * 0.08) + 0.06);
                        }, i * 60); // Slower stagger for "running" feel
                    }

                    // 2. Underlying Swoosh - Extended to 1.8s
                    const oscSw = ctx.createOscillator();
                    const gSw = ctx.createGain();
                    const fSw = ctx.createBiquadFilter();
                    oscSw.type = 'sawtooth';
                    fSw.type = 'lowpass';
                    fSw.frequency.setValueAtTime(150, now);
                    fSw.frequency.linearRampToValueAtTime(2500, now + 1.8); // Longer sweep

                    oscSw.connect(fSw);
                    fSw.connect(gSw);
                    gSw.connect(masterGain);

                    gSw.gain.setValueAtTime(0, now);
                    gSw.gain.linearRampToValueAtTime(0.08, now + 0.4);
                    gSw.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

                    oscSw.start(now);
                    oscSw.stop(now + 1.8);
                    break;

                case 'error':
                    // ❌ Error: Low thud + dissonant interval
                    const oscErr1 = ctx.createOscillator();
                    const oscErr2 = ctx.createOscillator();
                    const gainErr = ctx.createGain();

                    oscErr1.type = 'sawtooth';
                    oscErr2.type = 'square';

                    oscErr1.frequency.setValueAtTime(100, now);
                    oscErr2.frequency.setValueAtTime(145, now); // Tritone-ish

                    oscErr1.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                    oscErr2.frequency.exponentialRampToValueAtTime(70, now + 0.3);

                    oscErr1.connect(gainErr);
                    oscErr2.connect(gainErr);
                    gainErr.connect(masterGain);

                    gainErr.gain.setValueAtTime(0, now);
                    gainErr.gain.linearRampToValueAtTime(0.4, now + 0.02);
                    gainErr.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

                    oscErr1.start(now);
                    oscErr2.start(now);
                    oscErr1.stop(now + 0.3);
                    oscErr2.stop(now + 0.3);
                    break;

                case 'toggle':
                    // 🔘 Switch: High click
                    const oscToggle = ctx.createOscillator();
                    const gainToggle = ctx.createGain();
                    oscToggle.type = 'sine';
                    oscToggle.frequency.setValueAtTime(1200, now);
                    oscToggle.frequency.exponentialRampToValueAtTime(1800, now + 0.05);
                    oscToggle.connect(gainToggle);
                    gainToggle.connect(masterGain);
                    gainToggle.gain.setValueAtTime(0, now);
                    gainToggle.gain.linearRampToValueAtTime(0.2, now + 0.005);
                    gainToggle.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                    oscToggle.start(now);
                    oscToggle.stop(now + 0.05);
                    break;

                default:
                    // Soft blip
                    playTone(800, 'sine', 0.05);
            }

            // Cleanup context after sound finishes (max duration + buffer)
            setTimeout(() => {
                if (ctx.state !== 'closed') ctx.close();
            }, 1000);

        } catch (e) {
            console.debug('Sound not available:', e);
        }
    }, [soundEnabled]);

    return (
        <SoundContext.Provider value={{ soundEnabled, toggleSound, play }}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    const context = useContext(SoundContext);
    if (!context) {
        return { soundEnabled: false, toggleSound: () => { }, play: () => { } };
    }
    return context;
}

export default SoundContext;
