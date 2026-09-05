import { createApp } from 'vue';
import { createToastAlerts } from 'vue-toast-alerts';
import App from './App.vue';
import './styles.css';

createApp(App).use(createToastAlerts()).mount('#app');
