import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({ baseURL: BASE_URL });

/** Register a new user */
export const registerUser = (data) =>
  api.post('/api/users/register', data).then((r) => r.data);

/** Login with email + phone number */
export const loginUser = (data) =>
  api.post('/api/users/login', data).then((r) => r.data);

/** Join matchmaking queue */
export const startChat = (userId, vibe) =>
  api.post('/api/chat/start', { userId, vibe }).then((r) => r.data);

/** Skip to next user */
export const nextUser = (userId) =>
  api.post('/api/chat/next', { userId }).then((r) => r.data);

/** End current session */
export const endChat = (userId) =>
  api.post('/api/chat/end', { userId }).then((r) => r.data);

/** Get queue size */
export const getQueueSize = () =>
  api.get('/api/chat/queue/size').then((r) => r.data);

/** Get current room for a user */
export const getUserStatus = (userId) =>
  api.get(`/api/chat/status/${userId}`).then((r) => r.data);

/** Get message history for a room */
export const getRoomHistory = (roomId) =>
  api.get(`/api/chat/history/${roomId}`).then((r) => r.data);

/** Submit post-chat star rating */
export const submitRating = (roomId, userId, stars) =>
  api.post('/api/chat/rate', { roomId, userId, stars }).then((r) => r.data);

/** Get matched vibe for a room */
export const getRoomVibe = (roomId) =>
  api.get(`/api/chat/vibe/${roomId}`).then((r) => r.data);
