# Microsoft Authentication (Device Code Flow) Documentation

## Overview
JugeLauncher uses the official **Microsoft OAuth2 Device Code Flow**. This allows for a secure, browser-less sign-in experience where the user verifies their identity on a secondary device or browser tab using a unique code.

## Flow Diagram
```mermaid
sequenceDiagram
    participant User
    participant Hook (TS)
    participant Backend (Rust)
    participant Microsoft
    participant Minecraft

    Hook->>Backend: invoke('start_ms_auth')
    Backend->>Microsoft: POST /devicecode
    Microsoft-->>Hook: user_code, verification_uri
    Hook->>User: Display Code & URL
    
    loop Every 5s
        Hook->>Backend: invoke('complete_ms_auth')
        Backend->>Microsoft: POST /token
        alt Success
            Microsoft-->>Backend: AccessToken, RefreshToken
        else Pending
            Microsoft-->>Hook: Error: Pending
        end
    end

    Backend->>Microsoft: XBL & XSTS Auth
    Backend->>Minecraft: Login with XSTS
    Backend->>Minecraft: Fetch Profile (UUID, Skin)
    Backend-->>Hook: MicrosoftAccount JSON
    Hook->>User: Login Success!
```

## Integration Guide
The system is encapsulated in the `useMicrosoftLogin` hook.

### Basic Usage:
```typescript
import { useMicrosoftLogin } from '@/hooks/useMicrosoftLogin';

const MyComponent = () => {
    const { login, status, deviceCode, account } = useMicrosoftLogin();

    return (
        <button onClick={login}>
            {status === 'idle' ? 'Login with Microsoft' : 'Authenticating...'}
        </button>
    );
};
```

## Data Structure
The backend returns a strictly typed `MicrosoftAccount` object:
```json
{
  "uuid": "...",
  "username": "...",
  "accessToken": "...",
  "mcAccessToken": "...",
  "xboxToken": "...",
  "refreshToken": "...",
  "expiresAt": 1707768000
}
```

## Error Handling
The system handles the following states:
- **Pending**: User has not yet entered the code. Handled by the polling hook.
- **Expired**: User took too long to enter the code.
- **Denied**: User cancelled the request on the Microsoft page.
- **Network/Protocol**: Generic connectivity or API errors.
