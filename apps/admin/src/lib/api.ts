const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "PLATFORM_ADMIN" | "USER";
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  accessToken: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || res.statusText);
  }

  return res.json();
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  auth: {
    login(email: string, password: string) {
      return request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    me(token: string) {
      return request<User>("/auth/me", {
        headers: authHeaders(token),
      });
    },
  },
};

export { ApiError };
