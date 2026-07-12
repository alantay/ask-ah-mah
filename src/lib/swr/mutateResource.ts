import { mutate } from "swr";

type MutateResourceOptions<T> = {
  url: string;
  method: "PATCH" | "DELETE" | "POST";
  body: Record<string, unknown>;
  // Optimistic cache write applied before the request fires. `key` and
  // `optimisticData` must be supplied together to enable it — omit both for
  // call sites with no optimistic update.
  key?: string;
  optimisticData?: T;
};

/**
 * Shared skeleton for SWR-backed mutations: applies an optional optimistic
 * cache write, then fires the JSON request. Response handling (ok-check,
 * revalidation, toasts) stays with the caller — it varies too much between
 * call sites (static vs. interpolated toast text, server-supplied error
 * messages, revalidate-always vs. revalidate-on-success-only) to fold into a
 * single shape without speculative options.
 */
export async function mutateResource<T>({
  url,
  method,
  body,
  key,
  optimisticData,
}: MutateResourceOptions<T>): Promise<Response> {
  if (key && optimisticData !== undefined) {
    mutate<T>(key, optimisticData, { revalidate: false });
  }
  return fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
