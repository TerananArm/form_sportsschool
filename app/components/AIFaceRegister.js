'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Check, AlertCircle, ScanFace } from 'lucide-react';

export default function AIFaceRegister({ onComplete }) {
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null); // Fix: Add streamRef for cleanup
    const faceApiRef = useRef(null);

    useEffect(() => {
        const loadModels = async () => {
            try {
                const faceapiModule = await import('face-api.js');
                const faceapi = faceapiModule.nets ? faceapiModule : (faceapiModule.default || faceapiModule);
                faceApiRef.current = faceapi;

                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setLoading(false);
            } catch (e) {
                console.error("Error loading models:", e);
                setError("Failed to load AI models");
                setLoading(false);
            }
        };
        loadModels();
        // Cleanup on unmount
        return () => stopVideo();
    }, []);

    const startVideo = () => {
        setScanning(true);
        setError(null);
        setSuccess(false);
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
            .then(stream => {
                streamRef.current = stream; // Store stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error("Camera error:", err);
                setError("Could not access camera");
                setScanning(false);
            });
    };

    const stopVideo = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setScanning(false);
    };

    const handleScan = async () => {
        if (!videoRef.current || !faceApiRef.current) return;

        try {
            const faceapi = faceApiRef.current;
            const detections = await faceapi.detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detections) {
                // Send descriptor to API
                const res = await fetch('/api/auth/face-ai/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ descriptor: Array.from(detections.descriptor) })
                });

                const data = await res.json();

                if (res.ok) {
                    setSuccess(true);
                    stopVideo();
                    if (onComplete) onComplete();
                } else {
                    setError(data.error || "Registration failed");
                }
            } else {
                setError("No face detected. Please try again.");
            }
        } catch (err) {
            console.error(err);
            setError("Processing error");
        }
    };

    if (loading) return (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 animate-pulse">
            <div className="h-5 w-5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
            <span className="text-slate-500 font-medium">Loading AI Models...</span>
        </div>
    );

    return (
        <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-xl dark:bg-slate-900/40 dark:border-white/10 transition-all duration-300 hover:shadow-2xl group">

            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg text-white">
                        <ScanFace size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Face ID Registration</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Secure biometric authentication</p>
                    </div>
                </div>
                {success && (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-500 border border-green-500/20">
                        <Check size={14} /> Registered
                    </span>
                )}
            </div>

            {/* Content Area */}
            {!scanning ? (
                <div className="text-center py-6">
                    {!success ? (
                        <>
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 transition-transform group-hover:scale-110">
                                <Camera size={32} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <button
                                onClick={startVideo}
                                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Start Registration
                            </button>
                        </>
                    ) : (
                        <div className="py-2">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                <Check size={40} className="text-green-500" />
                            </div>
                            <p className="text-green-600 dark:text-green-400 font-semibold mb-4">You can now use Face ID to login</p>
                            <button
                                onClick={startVideo}
                                className="text-sm text-slate-500 hover:text-blue-500 underline"
                            >
                                Register New Face
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Camera View */}
                    <div className="relative aspect-square w-full mx-auto max-w-[300px] overflow-hidden rounded-2xl bg-black border-2 border-white/20 shadow-inner group-hover:border-blue-500/50 transition-colors">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            className="h-full w-full object-cover transform scale-x-[-1]"
                        />
                        {/* Scan Overlay Container */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-4 rounded-xl border-2 border-dashed border-white/30 opacity-70">
                                {/* Scan Line */}
                                <div className="absolute inset-x-0 h-0.5 bg-blue-400/80 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleScan}
                            className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500 active:scale-[0.98]"
                        >
                            Capture Face
                        </button>
                        <button
                            onClick={stopVideo}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/30">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <style jsx>{`
                @keyframes scan {
                    0% { top: 10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 90%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}
