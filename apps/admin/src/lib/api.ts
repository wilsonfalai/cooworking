const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type MemberRole = "OWNER" | "ADMIN" | "STAFF" | "MEMBER";
export type MemberStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";
export type OrganizationStatus = "ACTIVE" | "SUSPENDED" | "TRIAL";
export type LocationStatus = "ACTIVE" | "INACTIVE";

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  isCollaborator: boolean;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserLookup {
  id: string;
  name: string;
  email: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
  locations?: Location[];
}

export interface Location {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  phone: string | null;
  timezone: string;
  status: LocationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  userId: string;
  organizationId: string;
  locationId: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "id" | "name" | "email">;
  location?: Location;
}

export interface UserMembership {
  id: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: string;
  organization: Pick<Organization, "id" | "name" | "slug">;
  location: Pick<Location, "id" | "name" | "city" | "state">;
}

export interface UserDetail extends User {
  members: UserMembership[];
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateOrganizationInput {
  name: string;
  slug?: string;
  logo?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  logo?: string;
  status?: OrganizationStatus;
}

export interface CreateLocationInput {
  name: string;
  slug?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phone?: string;
  timezone?: string;
}

export interface UpdateLocationInput {
  name?: string;
  slug?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phone?: string;
  timezone?: string;
  status?: LocationStatus;
}

export interface CreateMemberInput {
  userId: string;
  locationId: string;
  role?: MemberRole;
}

export interface UpdateMemberInput {
  role?: MemberRole;
  status?: MemberStatus;
}

// ─── Infrastructure ───────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || res.statusText);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (null as T);
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ─── API client ───────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login(email: string, password: string) {
      return request<{ accessToken: string }>("/auth/login", {
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

  organizations: {
    list(token: string) {
      return request<Organization[]>("/organizations", {
        headers: authHeaders(token),
      });
    },
    getMine(token: string) {
      return request<Organization>("/organizations/my", {
        headers: authHeaders(token),
      });
    },
    get(token: string, id: string) {
      return request<Organization>(`/organizations/${id}`, {
        headers: authHeaders(token),
      });
    },
    create(token: string, data: CreateOrganizationInput) {
      return request<Organization>("/organizations", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      });
    },
    update(token: string, id: string, data: UpdateOrganizationInput) {
      return request<Organization>(`/organizations/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      });
    },
    remove(token: string, id: string) {
      return request<Organization>(`/organizations/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
    },
  },

  locations: {
    list(token: string, orgId: string) {
      return request<Location[]>(`/organizations/${orgId}/locations`, {
        headers: authHeaders(token),
      });
    },
    get(token: string, orgId: string, id: string) {
      return request<Location>(`/organizations/${orgId}/locations/${id}`, {
        headers: authHeaders(token),
      });
    },
    create(token: string, orgId: string, data: CreateLocationInput) {
      return request<Location>(`/organizations/${orgId}/locations`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      });
    },
    update(token: string, orgId: string, id: string, data: UpdateLocationInput) {
      return request<Location>(`/organizations/${orgId}/locations/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      });
    },
    remove(token: string, orgId: string, id: string) {
      return request<Location>(`/organizations/${orgId}/locations/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
    },
  },

  members: {
    list(token: string, orgId: string, locationId?: string) {
      const qs = locationId ? `?locationId=${locationId}` : "";
      return request<Member[]>(`/organizations/${orgId}/members${qs}`, {
        headers: authHeaders(token),
      });
    },
    get(token: string, orgId: string, id: string) {
      return request<Member>(`/organizations/${orgId}/members/${id}`, {
        headers: authHeaders(token),
      });
    },
    create(token: string, orgId: string, data: CreateMemberInput) {
      return request<Member>(`/organizations/${orgId}/members`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      });
    },
    update(token: string, orgId: string, id: string, data: UpdateMemberInput) {
      return request<Member>(`/organizations/${orgId}/members/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      });
    },
    remove(token: string, orgId: string, id: string) {
      return request<void>(`/organizations/${orgId}/members/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
    },
  },

  users: {
    list(token: string) {
      return request<User[]>("/users", {
        headers: authHeaders(token),
      });
    },
    get(token: string, id: string) {
      return request<UserDetail>(`/users/${id}`, {
        headers: authHeaders(token),
      });
    },
    lookup(token: string, email: string) {
      return request<UserLookup | null>(`/users/lookup?email=${encodeURIComponent(email)}`, {
        headers: authHeaders(token),
      });
    },
    create(token: string, data: { name: string; email: string; password: string }) {
      return request<User>("/users", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      });
    },
  },
};

export { ApiError };
