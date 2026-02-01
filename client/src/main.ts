import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './style.css' // keeping default scaffold style for now or empty it? We'll leave it but might overwrite.

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
