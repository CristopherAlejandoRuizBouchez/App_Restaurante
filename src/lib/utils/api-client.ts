interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: Record<string, unknown>;
}

interface ApiFailure {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const json = (await response.json()) as ApiSuccess<T> | ApiFailure;

  if (!json.success) {
    throw new ApiError(json.error.code, json.error.message, response.status);
  }

  return json.data;
}
