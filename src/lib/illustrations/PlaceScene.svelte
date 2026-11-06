<script lang="ts">
  import type { Component } from 'svelte';
  import type { SituationTag } from '../../content/types';
  import { PLACE_LABEL } from '../logic/places';
  import Family from './places/Family.svelte';
  import Feelings from './places/Feelings.svelte';
  import Health from './places/Health.svelte';
  import Home from './places/Home.svelte';
  import Market from './places/Market.svelte';
  import Restaurant from './places/Restaurant.svelte';
  import Smalltalk from './places/Smalltalk.svelte';
  import Taxi from './places/Taxi.svelte';
  import Travel from './places/Travel.svelte';
  import Work from './places/Work.svelte';

  /** Ort je Situation des Sprachführers (viewBox 400×260 wie die Orts-Szenen der Regionen). */
  let { tag }: { tag: SituationTag } = $props();

  const SCENES: Record<SituationTag, Component<{ label?: string }>> = {
    restaurant: Restaurant,
    familie: Family,
    taxi: Taxi,
    markt: Market,
    smalltalk: Smalltalk,
    unterwegs: Travel,
    zuhause: Home,
    gefuehle: Feelings,
    gesundheit: Health,
    arbeit: Work,
  };
  const Place = $derived(SCENES[tag]);
</script>

<Place label={PLACE_LABEL[tag]} />
