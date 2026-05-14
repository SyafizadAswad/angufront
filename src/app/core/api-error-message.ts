import { HttpErrorResponse } from '@angular/common/http';

/**
 * Pulls a user-facing message from API error bodies (ASP.NET ProblemDetails,
 * validation `errors`, or simple `{ message: "..." }`). Prefer server text over duplicated frontend copies.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const fromBody = parseErrorBody(err.error);
    if (fromBody) {
      return fromBody;
    }
    if (err.status === 0) {
      return `${fallback} (no response — check network, CORS, and that the API is running.)`;
    }
    const fromStatus = statusFallback(err.status);
    if (fromStatus) {
      return fromStatus;
    }
    if (err.message) {
      return err.message;
    }
  }

  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim()) {
      return m.trim();
    }
  }

  return fallback;
}

function parseErrorBody(body: unknown): string | null {
  if (body == null) {
    return null;
  }

  if (typeof body === 'string') {
    const t = body.trim();
    if (!t) {
      return null;
    }
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        return parseErrorBody(JSON.parse(t) as unknown);
      } catch {
        return t;
      }
    }
    return t;
  }

  if (typeof body !== 'object') {
    return null;
  }

  const o = body as Record<string, unknown>;

  const detail = readString(o['detail']);
  if (detail) {
    return detail;
  }

  const errorsText = formatModelStateErrors(o['errors']);
  if (errorsText) {
    return errorsText;
  }

  for (const key of ['message', 'Message', 'error', 'Error', 'exceptionMessage', 'ExceptionMessage']) {
    const s = readString(o[key]);
    if (s) {
      return s;
    }
  }

  const title = readString(o['title']);
  if (title) {
    return title;
  }

  return null;
}

function readString(v: unknown): string | null {
  if (typeof v !== 'string') {
    return null;
  }
  const t = v.trim();
  return t ? t : null;
}

function formatModelStateErrors(errors: unknown): string | null {
  if (errors == null || typeof errors !== 'object' || Array.isArray(errors)) {
    return null;
  }
  const parts: string[] = [];
  for (const [, msgs] of Object.entries(errors as Record<string, unknown>)) {
    if (Array.isArray(msgs)) {
      for (const m of msgs) {
        const s = readString(m);
        if (s) {
          parts.push(s);
        }
      }
    } else {
      const s = readString(msgs);
      if (s) {
        parts.push(s);
      }
    }
  }
  return parts.length ? parts.join(' ') : null;
}

function statusFallback(status: number): string | null {
  switch (status) {
    case 400:
      return 'Bad request.';
    case 401:
      return 'Not authorized.';
    case 403:
      return 'Forbidden.';
    case 404:
      return 'Not found.';
    case 409:
      return 'Conflict.';
    case 422:
      return 'Validation failed.';
    case 500:
    case 502:
    case 503:
      return 'Server error.';
    default:
      return null;
  }
}
