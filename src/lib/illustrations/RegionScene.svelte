<script lang="ts">
  import type { RegionId } from '../../content/types';
  import Hanoi from './Hanoi.svelte';
  import HoiAn from './HoiAn.svelte';
  import Hue from './Hue.svelte';
  import MarbleMountains from './MarbleMountains.svelte';
  import Saigon from './Saigon.svelte';

  /** Die lebendige Orts-Szene einer Region (Regionskarte im Lernpfad, Etappen-Ansicht, Ergebnis). */
  let { region }: { region: RegionId } = $props();

  const scenes = { danang: MarbleMountains, hoian: HoiAn, hue: Hue, hanoi: Hanoi, saigon: Saigon };
  const Comp = $derived(scenes[region]);
</script>

<Comp />
