export const API_SETUP_TS = String.raw`export interface ApiClientOptions {
  baseUrl: string;
  headers?: HeadersInit;
  getAccessToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
}

export interface ApiErrorPayload {
  message?: string;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    if (payload?.code !== undefined) this.code = payload.code;
    if (payload?.details !== undefined) this.details = payload.details;
  }
}

export interface ApiClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
  get<T>(path: string, init?: RequestInit): Promise<T>;
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  delete<T>(path: string, init?: RequestInit): Promise<T>;
  multipart<T>(path: string, form: FormData, init?: RequestInit): Promise<T>;
}

function isFormData(body: BodyInit | null | undefined): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function parseResponseBody(text: string, contentType: string): unknown {
  if (!text) return undefined;
  if (contentType.includes("application/json") || contentType.includes("+json")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { message: "The server returned invalid JSON.", raw: text };
    }
  }
  return text;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl.endsWith("/") ? options.baseUrl : options.baseUrl + "/";

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = new URL(path.replace(/^\/+/, ""), baseUrl);
    const headers = new Headers(options.headers);
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    headers.set("Accept", headers.get("Accept") ?? "application/json");

    const token = await options.getAccessToken?.();
    if (token) headers.set("Authorization", "Bearer " + token);

    let body = init.body;
    if (body !== undefined && body !== null && !isFormData(body) && typeof body !== "string" && !(typeof Blob !== "undefined" && body instanceof Blob) && !(body instanceof URLSearchParams) && !(body instanceof ArrayBuffer)) {
      body = JSON.stringify(body);
      headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
    }

    const requestInit: RequestInit = { ...init, headers };
    if (body === undefined) delete requestInit.body;
    else requestInit.body = body;
    const response = await fetch(url, requestInit);
    const text = response.status === 204 ? "" : await response.text();
    const payload = parseResponseBody(text, response.headers.get("content-type") ?? "");

    if (response.status === 401) options.onUnauthorized?.();
    if (!response.ok) {
      const data = payload && typeof payload === "object" ? payload as ApiErrorPayload : undefined;
      const message = data?.message ?? (typeof payload === "string" && payload.trim() ? payload : "Request failed with status " + response.status + ".");
      throw new ApiError(message, response.status, data);
    }

    return payload as T;
  }

  function requestJson<T>(path: string, method: string, body: unknown, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    if (body !== undefined) headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
    return request<T>(path, {
      ...init,
      headers,
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
  }

  return {
    request,
    get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "GET" }),
    post: <T>(path: string, body?: unknown, init?: RequestInit) => requestJson<T>(path, "POST", body, init),
    put: <T>(path: string, body?: unknown, init?: RequestInit) => requestJson<T>(path, "PUT", body, init),
    patch: <T>(path: string, body?: unknown, init?: RequestInit) => requestJson<T>(path, "PATCH", body, init),
    delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "DELETE" }),
    multipart: <T>(path: string, form: FormData, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.delete("Content-Type"); // The runtime must supply the multipart boundary.
      return request<T>(path, { ...init, headers, method: init?.method ?? "POST", body: form });
    }
  };
}`;
