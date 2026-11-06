<script lang="ts">
  /** Suchfeld des Sprachführers (Übersicht und Situation): Lupe, Eingabe, Löschen-Knopf. */
  let {
    value,
    oninput,
    label = 'Suchen',
    placeholder = 'Suchen, auch ohne Akzente',
  }: { value: string; oninput: (value: string) => void; label?: string; placeholder?: string } = $props();
</script>

<div class="search">
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.3 4.3-1.4 1.4-4.3-4.3A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" fill="currentColor" />
  </svg>
  <input
    type="search"
    aria-label={label}
    {placeholder}
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    enterkeyhint="search"
    {value}
    oninput={(e) => oninput(e.currentTarget.value)}
  />
  {#if value}
    <button class="clear" aria-label="Suche löschen" onclick={() => oninput('')}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" fill="currentColor" />
      </svg>
    </button>
  {/if}
</div>

<style>
  .search {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 0 6px 0 18px;
    border-radius: var(--radius-pill);
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 4px 0 var(--item-edge, var(--paper-2));
  }
  .search:focus-within {
    outline: 3px solid var(--red);
    outline-offset: 2px;
  }
  svg {
    flex: none;
  }
  input {
    flex: 1;
    min-width: 0;
    min-height: 52px;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-body);
    appearance: none;
  }
  input::placeholder {
    color: var(--ink-2);
  }
  input::-webkit-search-cancel-button {
    appearance: none;
    display: none;
  }
  .clear {
    flex: none;
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
</style>
