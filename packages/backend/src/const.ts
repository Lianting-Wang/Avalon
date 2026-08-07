export const backendPort = 3000;

// In production, set FRONTEND_URL to the exact browser-facing origin,
// e.g. https://avalon.example.com or http://192.168.1.50:8080.
// Development keeps the upstream localhost behavior.
export const frontendURL =
  process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:8080'
    : 'http://localhost:8080';
