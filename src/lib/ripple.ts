import { reducedMotion } from './motion';

/**
 * Tipp-Welle wie im Vorbild: ein flacher Kreis wächst vom Tippunkt aus und verblasst (base.css `.ripple-dot`).
 * Landet in einer Kindebene `.fx` (falls vorhanden, damit Effekte außerhalb nicht beschnitten werden),
 * sonst im Element selbst; das Element braucht dann `position: relative; overflow: hidden`.
 * Merkt den Tippunkt zusätzlich als `--px`/`--py` – dort startet z. B. der Sternenregen.
 */
export function ripple(node: HTMLElement) {
  const down = (e: PointerEvent) => {
    const r = node.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    node.style.setProperty('--px', `${x}px`);
    node.style.setProperty('--py', `${y}px`);
    if ((node as HTMLButtonElement).disabled || reducedMotion()) return;
    const size = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) * 2;
    const dot = document.createElement('span');
    dot.className = 'ripple-dot';
    dot.style.cssText = `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px`;
    (node.querySelector(':scope > .fx') ?? node).appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  };
  node.addEventListener('pointerdown', down);
  return { destroy: () => node.removeEventListener('pointerdown', down) };
}
