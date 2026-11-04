<script lang="ts">
  import type { AccessoryId } from '../logic/accessories';
  import Accessory, { ACCESSORY_BOX } from './Accessory.svelte';

  /** Ein Accessoire allein, auf seinen Ausschnitt gezoomt (Profil, Truhe). */
  let { id, size = 56 }: { id: AccessoryId; size?: number } = $props();
</script>

<svg viewBox={ACCESSORY_BOX[id]} width={size} height={size} aria-hidden="true"><Accessory {id} /></svg>

<style>
  svg {
    display: block;
    overflow: visible;
  }
</style>
