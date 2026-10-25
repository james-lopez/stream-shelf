import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Show, ShowSummary } from '../catalog/types';

/**
 * A snapshot of what My List needs to render, so the list shows instantly and offline
 * without refetching each show. Detail still fetches fresh data by id.
 */
export type MyListItem = ShowSummary & { addedAt: number };

type MyListState = {
  items: MyListItem[];
  add: (show: Show) => void;
  remove: (id: number) => void;
};

export const useMyList = create<MyListState>()(
  persist(
    (set) => ({
      items: [],
      add: (show) =>
        set((state) =>
          state.items.some((item) => item.id === show.id)
            ? state
            : { items: [{ id: show.id, name: show.name, image: show.image, addedAt: Date.now() }, ...state.items] },
        ),
      remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
    }),
    {
      name: 'stream-shelf/my-list',
      // async-storage over MMKV because it has a web (localStorage) backend.
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export const useIsInMyList = (id: number) => useMyList((state) => state.items.some((item) => item.id === id));

/**
 * Whether the persisted list has been read back. Until then the store holds its empty
 * default, so screens show a loading state and the toggle stays disabled (a write before
 * hydration would be overwritten by it).
 */
export function useMyListHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useMyList.persist.hasHydrated());
  useEffect(() => {
    const unsubscribe = useMyList.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useMyList.persist.hasHydrated());
    return unsubscribe;
  }, []);
  return hydrated;
}
