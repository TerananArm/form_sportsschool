'use client';

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';

function ParticleField({ color }) {
    return (
        <group>
            {/* Main floating sparkles */}
            <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
                <Sparkles
                    count={150}
                    scale={12}
                    size={6}
                    speed={0.4}
                    opacity={0.8}
                    color={color}
                />
            </Float>

            {/* Background ambient dust */}
            <Sparkles
                count={300}
                scale={20}
                size={2}
                speed={0.2}
                opacity={0.4}
                color={color}
            />
        </group>
    );
}

export default function ThreeBackground({ isDarkMode }) {
    // Cyan for dark mode, Deep Blue/Purple for light mode to be visible on white
    const particleColor = isDarkMode ? "#06b6d4" : "#4f46e5";

    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none transition-opacity duration-1000 ease-in-out">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }} gl={{ alpha: true }}>
                <ParticleField color={particleColor} />
            </Canvas>
        </div>
    );
}
