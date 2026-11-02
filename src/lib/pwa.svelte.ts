import { registerSW } from 'virtual:pwa-register';

/** „Neue Version“-Hinweis: der SW wartet, bis Alex tippt. */
export const pwa = $state({ needRefresh: false });

let updateSW: ((reload?: boolean) => Promise<void>) | null = null;

export function initPwa(): void {
  if (import.meta.env.DEV) return;
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      pwa.needRefresh = true;
    },
  });
}

export function applyUpdate(): void {
  void updateSW?.(true);
}
