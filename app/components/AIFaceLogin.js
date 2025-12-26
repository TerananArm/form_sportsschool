'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Camera, X, Check, AlertCircle } from 'lucide-react';

export default function AIFaceLogin({ onCancel }) {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const streamRef = useRef(null);
    const videoRef = useRef(null);
    const faceApiRef = useRef(null);
    const router = useRouter();

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
                startVideo();
            } catch (e) {
                console.error("Error loading models:", e);
                setStatus('error');
                setMessage("Failed to load AI models");
                setLoading(false);
            }
        };
        loadModels();
        // Cleanup function to stop video when component unmounts
        return () => stopVideo();
    }, []);

    const startVideo = () => {
        setStatus('scanning');
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
            .then(stream => {
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error("Camera error:", err);
                setStatus('error');
                setMessage("Could not access camera");
            });
    };

    const stopVideo = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
    };

    const handleScan = async () => {
        if (!videoRef.current || status === 'verifying') return;
        setStatus('verifying');

        try {
            const faceapi = faceApiRef.current;
            if (!faceapi) return;

            const detections = await faceapi.detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detections) {
                const res = await fetch('/api/auth/face-ai/authenticate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ descriptor: Array.from(detections.descriptor) })
                });

                const data = await res.json();

                if (res.ok && data.verified && data.token) {
                    setStatus('success');
                    stopVideo();
                    const loginRes = await signIn('credentials', { token: data.token, redirect: false });
                    if (loginRes?.ok) {
                        setTimeout(() => router.push('/dashboard'), 1200);
                    } else {
                        setStatus('error');
                        setMessage("Session failed");
                        startVideo();
                    }
                } else {
                    setStatus('error');
                    setMessage(data.error || "Face not recognized");
                    setTimeout(() => setStatus('scanning'), 2000);
                }
            } else {
                setStatus('error');
                setMessage("No face detected");
                setTimeout(() => setStatus('scanning'), 1500);
            }
        } catch (e) {
            setStatus('error');
            setMessage("Error");
            setTimeout(() => setStatus('scanning'), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-500"
                onClick={() => { stopVideo(); onCancel(); }}
            />

            {/* Glassmorphism Card */}
            <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl dark:bg-slate-900/40 dark:border-white/10">

                {/* Close Button */}
                <button
                    onClick={() => { stopVideo(); onCancel(); }}
                    className="absolute right-5 top-5 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="mb-6 flex flex-col items-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-lg border border-white/10 backdrop-blur-md">
                        <Camera className="h-8 w-8 text-white drop-shadow-md" />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Face Login</h3>
                    <p className="text-sm text-blue-200/80 mt-1">Look at the camera to sign in</p>
                </div>

                {/* Video Area */}
                <div className="relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-[2rem] border-2 border-white/20 bg-black/20 shadow-inner">
                    {!loading && status !== 'success' && (
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                        </div>
                    )}

                    {/* Scan Overlay */}
                    <div className="pointer-events-none absolute inset-0">
                        {status === 'scanning' && (
                            <div className="absolute inset-8 rounded-[1.5rem] border-2 border-dashed border-white/30 opacity-50">
                                <div className="absolute inset-x-0 h-0.5 bg-blue-400/80 blur-[2px] animate-[scan_2s_ease-in-out_infinite]" />
                            </div>
                        )}

                        {status === 'verifying' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                                <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-400/30 border-t-blue-400" />
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-500">
                                <div className="flex flex-col items-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 border-2 border-green-500 mb-2 animate-[bounce_0.5s_ease-in-out]">
                                        <Check className="h-10 w-10 text-green-400" strokeWidth={3} />
                                    </div>
                                    <p className="text-xl font-bold text-green-400">Welcome Back!</p>
                                </div>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                <div className="flex flex-col items-center px-4 text-center">
                                    <AlertCircle className="mb-2 h-12 w-12 text-red-400" />
                                    <p className="text-lg font-semibold text-red-400">{message}</p>
                                    <button
                                        onClick={startVideo}
                                        className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 border border-white/10"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status / Action Button */}
                <div className="mt-8">
                    {status === 'scanning' ? (
                        <button
                            onClick={handleScan}
                            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-[1px] shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <div className="relative flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 transition-all group-hover:brightness-110">
                                <span className="font-semibold text-white">Scan My Face</span>
                            </div>
                        </button>
                    ) : (
                        <div className="h-[52px]" /> // Spacer to prevent layout jump
                    )}
                </div>

                {/* Footer Text */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-blue-200/50 flex items-center justify-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        Encrypted & Processed Locally
                    </p>
                </div>
            </div>

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
