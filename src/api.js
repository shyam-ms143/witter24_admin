// Thin client for the twitter24_node_be admin API (docs/ADMIN_API.md in that repo).
const BASE = `${import.meta.env.VITE_API_URL || ""}/api/admin`;
const TOKEN_KEY = "witter24_admin_token";

export const token = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(value) {
    try {
      localStorage.setItem(TOKEN_KEY, value);
    } catch {
      /* storage unavailable: the session lasts until reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

let on_unauthorized = () => {};
export const set_unauthorized_handler = (fn) => {
  on_unauthorized = fn;
};

// 401 { error }, 404 { error }, 422 { error } | { errors: [] }, 429 { error }
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || (Array.isArray(body?.errors) && body.errors.join(", ")) || `Request failed (${status})`);
    this.status = status;
    this.errors = Array.isArray(body?.errors) ? body.errors : null;
  }
}

const url_for = (path, query) => {
  const qs = typeof query === "string" ? query : query ? new URLSearchParams(query).toString() : "";
  return `${BASE}${path}${qs ? `?${qs}` : ""}`;
};

const auth_headers = () => {
  const t = token.get();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

async function send(method, path, { query, body } = {}) {
  const headers = { Accept: "application/json", ...auth_headers() };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(url_for(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, { error: "Cannot reach the server. Is the API running?" });
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // An expired / revoked admin token signs the panel out (login itself has no token).
    if (res.status === 401 && headers.Authorization) on_unauthorized();
    throw new ApiError(res.status, data);
  }
  return data;
}

export const api = {
  get: (path, query) => send("GET", path, { query }),
  post: (path, body = {}) => send("POST", path, { body }),
  put: (path, body = {}) => send("PUT", path, { body }),
  del: (path) => send("DELETE", path),
};

// "Download: CSV JSON" — needs the Authorization header, so it can't be a plain link.
export async function download(path, query, fallback_name) {
  let res;
  try {
    res = await fetch(url_for(path, query), { headers: auth_headers() });
  } catch {
    throw new ApiError(0, { error: "Cannot reach the server. Is the API running?" });
  }
  if (!res.ok) {
    if (res.status === 401) on_unauthorized();
    throw new ApiError(res.status, await res.json().catch(() => null));
  }
  const blob = await res.blob();
  const match = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") || "");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = match ? match[1] : fallback_name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
