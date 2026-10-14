import type { NextRequest } from "next/server";

const BACKEND_API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:5000/api"
).replace(/\/$/, "");

interface ServerApiOptions
  extends Omit<RequestInit, "headers"> {
  headers?: HeadersInit;
}

/**
 * Effectue une requête vers le backend Node.js
 * depuis une route serveur Next.js.
 *
 * Le token doit être transmis par le frontend
 * dans le header Authorization.
 */
export async function serverApiFetch<T>(
  request: NextRequest,
  endpoint: string,
  options: ServerApiOptions = {}
): Promise<T> {
  const authorization =
    request.headers.get("authorization");

  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (authorization) {
    headers.set(
      "Authorization",
      authorization
    );
  }

  const normalizedEndpoint =
    endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

  const response = await fetch(
    `${BACKEND_API_URL}${normalizedEndpoint}`,
    {
      ...options,
      headers,
      cache: "no-store",
    }
  );

  const contentType =
    response.headers.get("content-type");

  let responseData: unknown = null;

  if (
    contentType?.includes(
      "application/json"
    )
  ) {
    responseData =
      await response.json();
  } else {
    responseData =
      await response.text();
  }

  if (!response.ok) {
    const message =
      typeof responseData === "object" &&
      responseData !== null &&
      "message" in responseData &&
      typeof responseData.message ===
        "string"
        ? responseData.message
        : `Erreur backend ${response.status}`;

    const error = new Error(message) as Error & {
      status?: number;
      data?: unknown;
    };

    error.status = response.status;
    error.data = responseData;

    throw error;
  }

  return responseData as T;
}
