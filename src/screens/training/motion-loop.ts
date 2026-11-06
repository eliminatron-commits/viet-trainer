/**
 * Endlos-Schleife per Web Animations für die Motive im Modus-Karussell. Alle Schleifen eines Motivs teilen
 * dieselbe Dauer; steht das Motiv still (`playing: false`), zeigt es die Pose zum Zeitpunkt `pose` – so laufen
 * die Teile beim Weiterspielen wieder gemeinsam los.
 */
export interface LoopOptions {
  frames: Keyframe[];
  duration: number;
  pose: number;
  playing: boolean;
}

export function loop(node: Element, opts: LoopOptions) {
  let key = '';
  let anim: Animation | null = null;
  const apply = (o: LoopOptions) => {
    const next = JSON.stringify(o.frames) + o.duration;
    if (next !== key) {
      anim?.cancel();
      anim = node.animate(o.frames, { duration: o.duration, iterations: Infinity, fill: 'both' });
      key = next;
    }
    if (o.playing) {
      if (anim!.playState !== 'running') {
        anim!.currentTime = o.pose;
        anim!.play();
      }
    } else {
      anim!.pause();
      anim!.currentTime = o.pose;
    }
  };
  apply(opts);
  return {
    update: apply,
    destroy: () => anim?.cancel(),
  };
}

/** Keyframe-Zeitpunkt in ms → Offset 0…1. */
export const at = (ms: number, duration: number) => Math.min(1, Math.max(0, ms / duration));
