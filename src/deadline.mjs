export class UpstreamDeadlineError extends Error {
  constructor(label, timeoutMs) {
    super(`${label} exceeded ${timeoutMs}ms deadline`);
    this.name = 'UpstreamDeadlineError';
    this.code = 'UPSTREAM_DEADLINE_EXCEEDED';
  }
}

export async function fetchWithDeadline(fetcher, input, init = {}, timeoutMs, label = 'upstream') {
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) throw new TypeError('Invalid upstream deadline');

  const controller = new AbortController();
  const upstream = Promise.resolve().then(() => fetcher(input, { ...init, signal: controller.signal }));
  // Promise.race observes the upstream rejection too, but this explicit handler
  // also keeps a losing request handled after the deadline has already won.
  upstream.catch(() => {});

  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new UpstreamDeadlineError(label, timeoutMs);
      try { controller.abort(error); } catch { /* best-effort cancellation */ }
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([upstream, deadline]);
  } finally {
    clearTimeout(timer);
  }
}
