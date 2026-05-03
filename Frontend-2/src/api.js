const API_BASE = "/api/v1";

let accessToken = null;

export const setToken = (token) => {
  accessToken = token;
};

export const getToken = () => accessToken;

export const clearToken = () => {
  accessToken = null;
};

const request = async (endpoint, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};

// Auth
export const register = (name, email, password) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

export const login = (email, password) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      device: { platform: "web", name: navigator.userAgent.slice(0, 80) },
    }),
  });

export const refreshToken = (token) =>
  request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: token }),
  });

export const logout = (token) =>
  request("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken: token }),
  });

export const getMe = () => request("/auth/me");

// AI Triage
export const triage = (symptoms, { sessionId, locale, lat, lng, age, sex, history } = {}) =>
  request("/ai/triage", {
    method: "POST",
    body: JSON.stringify({
      symptoms,
      sessionId: sessionId || crypto.randomUUID(),
      locale,
      lat,
      lng,
      age,
      sex,
      history,
    }),
  });

// Facility
export const getNearbyFacilities = (lat, lng, radius = 5000) =>
  request(`/facility/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);

// Sessions
export const createSession = (sessionId) =>
  request("/sessions", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });

export const getSessions = (cursor) =>
  request(`/sessions${cursor ? `?cursor=${cursor}` : ""}`);

export const getSession = (id) => request(`/sessions/${id}`);

export const getSessionMessages = (id) => request(`/sessions/${id}/messages`);

export const deleteSession = (id) =>
  request(`/sessions/${id}`, { method: "DELETE" });
