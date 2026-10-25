import { useCallback, useEffect, useState, type DependencyList } from 'react';

export type AsyncState<T> =
  | { status: 'loading'; data: undefined; error: undefined }
  | { status: 'success'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: Error };

const LOADING = { status: 'loading', data: undefined, error: undefined } as const;

/**
 * Runs `fn` on mount and whenever `deps` change; `retry` reruns it.
 * Results from superseded runs are dropped so a slow first attempt can't overwrite a retry.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>(LOADING);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setState(LOADING);
    fn().then(
      (data) => current && setState({ status: 'success', data, error: undefined }),
      (error: unknown) =>
        current &&
        setState({
          status: 'error',
          data: undefined,
          error: error instanceof Error ? error : new Error(String(error)),
        }),
    );
    return () => {
      current = false;
    };
    // `fn` is intentionally excluded: callers pass inline closures, `deps` says when to rerun.
  }, [...deps, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
