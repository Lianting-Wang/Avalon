// In production the UI and Socket.IO endpoint are served from the same
// browser origin. nginx.selfhost.conf proxies /socket.io/ to the backend.
// This makes the built frontend portable across IP addresses and domains.
export const socketURL =
  process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:3000';
