/* --------------------------------------------
   API BASE URL
---------------------------------------------*/

// If NEXT_PUBLIC_API_URL is set → use real backend.
// Otherwise default to http://localhost:8000 for dev.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* --------------------------------------------
   AUTHENTICATION HELPERS
---------------------------------------------*/

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
}

export function removeAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/* --------------------------------------------
   Authentication API
---------------------------------------------*/

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const resp = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!resp.ok) {
    const error = await resp.json();
    throw new Error(error.detail || "Login failed");
  }

  const data = await resp.json();
  setAuthToken(data.access_token);
  return data;
}

export async function register(userData: RegisterRequest): Promise<User> {
  const resp = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!resp.ok) {
    const error = await resp.json();
    throw new Error(error.detail || "Registration failed");
  }

  return resp.json();
}

export async function getCurrentUser(): Promise<User> {
  const resp = await fetch(`${API_BASE}/api/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!resp.ok) {
    throw new Error("Not authenticated");
  }

  return resp.json();
}

export function logout(): void {
  removeAuthToken();
}

/* --------------------------------------------
   Upload Image → POST /upload
   Returns: { jobId: number }
---------------------------------------------*/

export async function uploadImage(file: File): Promise<{ jobId: number }> {
  const form = new FormData();
  form.append("file", file);

  const token = getAuthToken();
  if (!token) {
    throw new Error("Please log in to upload images");
  }

  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const resp = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: form,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      let errorMessage = "Upload failed";
      try {
        const errorData = await resp.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        const errorText = await resp.text();
        errorMessage = errorText || errorMessage;
      }
      
      if (resp.status === 401) {
        errorMessage = "Please log in to upload images";
      } else if (resp.status === 500) {
        errorMessage = `Server error: ${errorMessage}`;
      }
      
      throw new Error(errorMessage);
    }

    return resp.json(); // { jobId }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Upload timeout - please try again");
    }
    throw error;
  }
}

/* --------------------------------------------
   Get Job Result → GET /jobs/:id
---------------------------------------------*/

export async function getJob(jobId: number) {
  const resp = await fetch(`${API_BASE}/jobs/${jobId}`, {
    headers: getAuthHeaders(),
  });

  if (!resp.ok) {
    throw new Error("Job not found");
  }

  return resp.json();
}

/* --------------------------------------------
   Get Dashboard (Recent Jobs) → GET /dashboard
---------------------------------------------*/

export async function getDashboard() {
  const resp = await fetch(`${API_BASE}/dashboard`, {
    headers: getAuthHeaders(),
  });

  if (!resp.ok) {
    throw new Error("Failed to load dashboard");
  }

  return resp.json();
}

/* --------------------------------------------
   SWR Fetcher (auto-prepends API_BASE)
---------------------------------------------*/

export const fetcher = (path: string) => {
  return fetch(`${API_BASE}${path}`, {
    headers: getAuthHeaders(),
  }).then((res) => {
    if (!res.ok) throw new Error("API Error");
    return res.json();
  });
};
