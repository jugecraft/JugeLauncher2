import { useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface MicrosoftAccount {
    uuid: string;
    username: string;
    accessToken: string;
    mcAccessToken: string;
    xboxToken: string;
    refreshToken: string;
    expiresAt: number;
}

export interface DeviceCodeData {
    user_code: string;
    device_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
}

export type AuthStatus = 'idle' | 'starting' | 'polling' | 'success' | 'error';

export const useMicrosoftLogin = () => {
    const [status, setStatus] = useState<AuthStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [deviceCode, setDeviceCode] = useState<DeviceCodeData | null>(null);
    const [account, setAccount] = useState<MicrosoftAccount | null>(null);

    const pollInterval = useRef<number | null>(null);

    const stopPolling = useCallback(() => {
        if (pollInterval.current) {
            window.clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    }, []);

    const login = useCallback(async () => {
        setStatus('starting');
        setError(null);
        setDeviceCode(null);

        try {
            const data: DeviceCodeData = await invoke('start_ms_auth');
            setDeviceCode(data);
            setStatus('polling');

            // Start polling
            pollInterval.current = window.setInterval(async () => {
                try {
                    const result: MicrosoftAccount = await invoke('complete_ms_auth', {
                        deviceCode: data.device_code
                    });

                    setAccount(result);
                    setStatus('success');
                    stopPolling();
                } catch (err: any) {
                    // Logic to handle specific backend errors
                    if (typeof err === 'string' && err === 'Pending') {
                        // Keep polling
                        return;
                    }

                    if (err === 'Expired' || err === 'Denied') {
                        setError(`Authentication ${err}`);
                        setStatus('error');
                        stopPolling();
                    } else if (typeof err === 'object' && err.Protocol) {
                        setError(`Protocol Error: ${err.Protocol}`);
                        setStatus('error');
                        stopPolling();
                    } else if (err !== 'Pending') {
                        // Fallback for other errors
                        console.error("Polling error:", err);
                    }
                }
            }, data.interval * 1000 || 5000);

        } catch (err: any) {
            setError(typeof err === 'string' ? err : JSON.stringify(err));
            setStatus('error');
        }
    }, [stopPolling]);

    const cancel = useCallback(() => {
        stopPolling();
        setStatus('idle');
        setDeviceCode(null);
    }, [stopPolling]);

    return {
        status,
        error,
        deviceCode,
        account,
        login,
        cancel
    };
};
