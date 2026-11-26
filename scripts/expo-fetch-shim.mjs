// Node stand-in for `expo/fetch` in check scripts. It drops the app's 10 s abort signal and
// retries connect failures: on slow networks Node's DNS + first connect can take longer
// (see AGENTS.md). The checks test the queries, not the timeout.
export async function fetch(url, init = {}) {
  const { signal: _ignored, ...rest } = init;
  for (let attempt = 1; ; attempt++) {
    try {
      return await globalThis.fetch(url, rest);
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}
