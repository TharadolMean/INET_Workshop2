import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify)

export default new Vuetify({
  theme: {
    dark: true,
    themes: {
      dark: {
        primary: '#8B5CF6',
        secondary: '#38BDF8',
        accent: '#A78BFA',
        background: '#0B1120',
        surface: '#111827'
      }
    }
  },
  icons: {
    iconfont: 'mdi'
  }
})
