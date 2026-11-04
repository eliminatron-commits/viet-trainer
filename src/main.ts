import { mount } from 'svelte';
import './styles/base.css';
import App from './App.svelte';
import { installAudioUnlock } from './lib/audio/player';
import { requestPersistence } from './lib/storage/persist';
import { initPwa } from './lib/pwa.svelte';
import { initTheme } from './lib/theme.svelte';

initTheme();
installAudioUnlock();
void requestPersistence();
initPwa();

export default mount(App, { target: document.getElementById('app')! });
