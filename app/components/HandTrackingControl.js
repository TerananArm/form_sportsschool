'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { createPortal } from 'react-dom';

// --- Configuration ---
const SMOOTHING_FACTOR = 0.2; // ค่าความหน่วง (0.1 = นุ่มมากแต่ช้า, 0.9 = เร็วแต่สั่น)
const CLICK_THRESHOLD = 0.05; // ระยะห่างนิ้วโป้ง-ชี้ ที่ถือว่าคลิก
const SCROLL_SPEED = 15;      // ความเร็วการเลื่อน
const SCROLL_ZONE_SIZE = 0.15; // ขนาดพื้นที่ Scroll (15%)

export default function HandTrackingControl({ isActive }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const cursorRef = useRef(null);
    const scrollTopRef = useRef(null);
    const scrollBottomRef = useRef(null);

    // State
    const [isLoaded, setIsLoaded] = useState(false);
    const [statusText, setStatusText] = useState("Loading AI...");
    const [mounted, setMounted] = useState(false);

    // Logic Refs
    const currentPos = useRef({ x: 0, y: 0 });
    const isClickingRef = useRef(false);

    // 1. Manual Script Loader
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = "anonymous";
            script.onload = () => resolve();
            script.onerror = (e) => reject(e);
            document.body.appendChild(script);
        });
    };

    // 2. Linear Interpolation
    const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

    // 3. Initialize on Mount
    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            currentPos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        }

        const initMediaPipe = async () => {
            try {
                setStatusText("Loading Scripts...");
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js");
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");

                console.log("MediaPipe Scripts Loaded");
                setIsLoaded(true);
                setStatusText("พร้อมใช้งาน");
            } catch (error) {
                console.error("Failed to load scripts", error);
                setStatusText("Load Error");
            }
        };

        if (typeof window !== 'undefined') {
            initMediaPipe();
        }
    }, []);

    // 4. Main AI Loop
    useEffect(() => {
        if (!isActive || !isLoaded || !mounted) return;

        let hands;
        let camera;

        const onResults = (results) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Setup Canvas (Clean & Simple)
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                setStatusText("ระบบพร้อมใช้งาน");
                const landmarks = results.multiHandLandmarks[0];

                // Draw Skeleton
                if (window.drawConnectors && window.drawLandmarks) {
                    window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, { color: '#00d2ff', lineWidth: 2 });
                    window.drawLandmarks(ctx, landmarks, { color: '#ff0055', lineWidth: 1, radius: 3 });
                }

                const indexTip = landmarks[8];
                const thumbTip = landmarks[4];

                // Logic: Smooth Cursor
                const targetX = (1 - indexTip.x) * window.innerWidth;
                const targetY = indexTip.y * window.innerHeight;

                currentPos.current.x = lerp(currentPos.current.x, targetX, SMOOTHING_FACTOR);
                currentPos.current.y = lerp(currentPos.current.y, targetY, SMOOTHING_FACTOR);

                if (cursorRef.current) {
                    cursorRef.current.style.left = `${currentPos.current.x}px`;
                    cursorRef.current.style.top = `${currentPos.current.y}px`;
                }

                // Logic: Click
                const distance = Math.sqrt(
                    Math.pow(indexTip.x - thumbTip.x, 2) +
                    Math.pow(indexTip.y - thumbTip.y, 2)
                );

                if (distance < CLICK_THRESHOLD) {
                    if (!isClickingRef.current) {
                        isClickingRef.current = true;
                        if (cursorRef.current) cursorRef.current.classList.add('cursor-active');

                        // Click action
                        if (cursorRef.current) cursorRef.current.style.display = 'none';
                        const el = document.elementFromPoint(currentPos.current.x, currentPos.current.y);
                        if (cursorRef.current) cursorRef.current.style.display = 'block';

                        if (el) {
                            el.click();
                            if (typeof el.focus === 'function') el.focus();
                        }
                    }
                } else {
                    if (isClickingRef.current) {
                        isClickingRef.current = false;
                        if (cursorRef.current) cursorRef.current.classList.remove('cursor-active');
                    }
                }

                // Logic: Scroll Zones with Visual Feedback
                const scrollTop = scrollTopRef.current;
                const scrollBottom = scrollBottomRef.current;
                const scrollTarget = document.getElementById('main-content') || window;

                // Reset visual feedback
                if (scrollTop) scrollTop.style.opacity = '0';
                if (scrollBottom) scrollBottom.style.opacity = '0';

                if (indexTip.y < SCROLL_ZONE_SIZE) {
                    // Scroll Up
                    scrollTarget.scrollBy(0, -SCROLL_SPEED);
                    if (scrollTop) scrollTop.style.opacity = '1';
                } else if (indexTip.y > (1 - SCROLL_ZONE_SIZE)) {
                    // Scroll Down
                    scrollTarget.scrollBy(0, SCROLL_SPEED);
                    if (scrollBottom) scrollBottom.style.opacity = '1';
                }

            } else {
                setStatusText("มองไม่เห็นมือ...");
            }
            ctx.restore();
        };

        const startAI = async () => {
            if (!videoRef.current || !window.Hands || !window.Camera) {
                console.log("Waiting for video/global refs...");
                return;
            }

            console.log("Starting Camera...");
            try {
                hands = new window.Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
                hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });
                hands.onResults(onResults);

                camera = new window.Camera(videoRef.current, {
                    onFrame: async () => {
                        if (videoRef.current) await hands.send({ image: videoRef.current });
                    },
                    width: 1280,
                    height: 720
                });
                await camera.start();
                console.log("Camera Started");
            } catch (e) {
                console.error("Camera Start Error", e);
                setStatusText("Cam Error");
            }
        };

        const timer = setTimeout(() => startAI(), 500);

        // Canvas Resize Loop
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        const resizeInterval = setInterval(handleResize, 1000);
        handleResize();

        return () => {
            clearTimeout(timer);
            clearInterval(resizeInterval);
            if (camera) camera.stop();
            if (hands) hands.close();
            window.removeEventListener('resize', handleResize);
        };
    }, [isActive, isLoaded, mounted]);


    // Return Component
    return (
        <>
            {/* NO Internal Toggle Button here anymore */}

            {/* Portal Overlay */}
            {mounted && isActive && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 pointer-events-none z-[9990]">

                    {/* HUD Box (Top Left) */}
                    <div className="fixed top-5 left-5 bg-zinc-900/90 border border-zinc-700 p-4 rounded-lg z-[1001] shadow-lg font-sans text-white min-w-[200px]">
                        <div className="flex items-center mb-2">
                            <span
                                className={`h-3 w-3 rounded-full mr-2 shadow-[0_0_5px] transition-colors duration-300 ${statusText.includes('พร้อม') || statusText.includes('Active') ? 'bg-green-500 shadow-green-500' : 'bg-gray-400 shadow-none'
                                    }`}
                            ></span>
                            <span className="font-bold text-sm">{statusText}</span>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1">
                            <div>- นิ้วชี้: เลื่อนเมาส์</div>
                            <div>- จีบนิ้ว (โป้ง+ชี้): คลิก</div>
                            <div>- ขอบจอ: Scroll</div>
                        </div>
                    </div>

                    {/* Debug Canvas (Mirrored via CSS) */}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
                        style={{ transform: 'scaleX(-1)' }}
                    />

                    {/* Scroll Zones */}
                    <div
                        ref={scrollTopRef}
                        className="fixed top-0 left-0 w-full h-[20vh] flex items-center justify-center bg-gradient-to-b from-cyan-500/20 to-transparent transition-opacity duration-300 pointer-events-none opacity-0 z-[1002]"
                    >
                        <span className="text-cyan-400 font-bold uppercase tracking-widest drop-shadow-md text-xl bg-black/50 px-4 py-1 rounded">Scroll Up</span>
                    </div>

                    <div
                        ref={scrollBottomRef}
                        className="fixed bottom-0 left-0 w-full h-[20vh] flex items-center justify-center bg-gradient-to-t from-cyan-500/20 to-transparent transition-opacity duration-300 pointer-events-none opacity-0 z-[1002]"
                    >
                        <span className="text-cyan-400 font-bold uppercase tracking-widest drop-shadow-md text-xl bg-black/50 px-4 py-1 rounded">Scroll Down</span>
                    </div>

                    {/* Cursor */}
                    <div
                        ref={cursorRef}
                        id="hand-cursor"
                        className="fixed pointer-events-none z-[10000] transition-all duration-75 ease-out"
                        style={{
                            width: '30px',
                            height: '30px',
                            backgroundColor: 'rgba(0, 255, 255, 0.3)',
                            border: '2px solid cyan',
                            borderRadius: '50%',
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 0 15px cyan',
                            left: '-100px', top: '-100px'
                        }}
                    >
                        <style jsx>{`
                            .cursor-active {
                                width: 20px !important;
                                height: 20px !important;
                                background-color: #ff0055 !important;
                                border-color: #ff0055 !important;
                                box-shadow: 0 0 20px #ff0055 !important;
                            }
                        `}</style>
                    </div>

                    {/* Video (Hidden) */}
                    <video ref={videoRef} className="hidden" playsInline muted />
                </div>,
                document.body
            )}
        </>
    );
}