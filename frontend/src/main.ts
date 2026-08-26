/**
 * frontend/src/main.ts
 *
 * Main application entry point. Initializes the Vue 3 app instance,
 * registers Vue Router, and mounts to the DOM element #app.
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css' // Or your main CSS file

const app = createApp(App)

// Register Vue Router plugin
app.use(router)

app.mount('#app')