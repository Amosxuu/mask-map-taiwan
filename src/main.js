import Vue from 'vue'
import App from './App.vue'
Vue.config.ignoredElements = [/^ion-/]

import Loading from 'vue-loading-overlay'//Loading 導入
import 'vue-loading-overlay/dist/vue-loading.css'
Vue.component('Loading',Loading)

Vue.config.productionTip = false
new Vue({
  render: h => h(App)
}).$mount('#app')
