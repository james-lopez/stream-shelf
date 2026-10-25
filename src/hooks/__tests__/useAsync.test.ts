import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useAsync } from '../useAsync';

it('surfaces an error, then succeeds on retry', async () => {
  const fn = jest
    .fn<Promise<string>, []>()
    .mockRejectedValueOnce(new Error('boom'))
    .mockResolvedValueOnce('ok');

  const { result } = await renderHook(() => useAsync(fn, []));

  await waitFor(() => expect(result.current.status).toBe('error'));
  expect(result.current.error?.message).toBe('boom');

  await act(async () => result.current.retry());

  await waitFor(() => expect(result.current.status).toBe('success'));
  expect(result.current.data).toBe('ok');
  expect(fn).toHaveBeenCalledTimes(2);
});

it('ignores a stale result that resolves after a retry', async () => {
  let resolveFirst!: (v: string) => void;
  const fn = jest
    .fn<Promise<string>, []>()
    .mockReturnValueOnce(new Promise((r) => (resolveFirst = r)))
    .mockResolvedValueOnce('fresh');

  const { result } = await renderHook(() => useAsync(fn, []));
  await act(async () => result.current.retry());
  await waitFor(() => expect(result.current.data).toBe('fresh'));

  await act(async () => resolveFirst('stale'));
  expect(result.current.data).toBe('fresh');
});
