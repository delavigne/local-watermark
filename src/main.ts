import { createApp } from 'vue';
import App from './App.vue';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('localwatermark-app');
  if (container) {
    const app = createApp(App);
    app.mount(container);
  }
});
