'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

export default function WebAuthnRegister() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'success', 'error'
    const [message, setMessage] = useState('');

    const register = async () => {
        setLoading(true);
        setStatus(null);
        setMessage('');

        try {
            // 1. Get options from server
            const resp = await fetch('/api/auth/webauthn/register', {
                method: 'POST',
            });

            if (!resp.ok) {
                throw new Error('Failed to start registration');
            }

            const options = await resp.json();

            // 2. Start registration (browser prompt)
            const attResp = await startRegistration(options);

            // 3. Verify response with server
            const verificationResp = await fetch('/api/auth/webauthn/register', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(attResp),
            });

            const verificationJSON = await verificationResp.json();

            if (verificationJSON && verificationJSON.verified) {
                setStatus('success');
                setMessage('Successfully registered Face ID / Touch ID!');
            } else {
                setStatus('error');
                setMessage(verificationJSON.error || 'Verification failed');
            }
        } catch (error) {
            console.error(error);
            if (error.name === 'NotAllowedError') { // User cancelled or timed out
                setStatus('error');
                setMessage('Canceled by user or timed out.');
            } else {
                setStatus('error');
                setMessage(error.message || 'An error occurred during registration.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 rounded-xl border bg-white/50 backdrop-blur-sm border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-2">Biometric Login</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Login faster using Face ID, Touch ID, or Windows Hello.
            </p>

            <button
                onClick={register}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition-all
          ${loading
                        ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 active:scale-95'
                    }
        `}
            >
                {loading ? 'Processing...' : 'Register Face ID / Passkey'}
            </button>

            {message && (
                <div className={`mt-3 text-sm font-medium p-2 rounded-lg flex items-center gap-2
          ${status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
        `}>
                    {status === 'success' && <span>✓</span>}
                    {message}
                </div>
            )}
        </div>
    );
}
