import Vue from 'vue'
import Vuetify from 'vuetify/lib'
import {
  VAlert,
  VApp,
  VAppBar,
  VBtn,
  VCard,
  VChip,
  VCol,
  VContainer,
  VForm,
  VIcon,
  VMain,
  VRow,
  VSpacer,
  VTextField
} from 'vuetify/lib/components'

Vue.use(Vuetify, {
  components: {
    VAlert,
    VApp,
    VAppBar,
    VBtn,
    VCard,
    VChip,
    VCol,
    VContainer,
    VForm,
    VIcon,
    VMain,
    VRow,
    VSpacer,
    VTextField
  }
})

export default new Vuetify({
  theme: {
    dark: true,
    themes: {
      dark: {
        primary: '#8B5CF6',
        secondary: '#38BDF8',
        accent: '#C084FC',
        background: '#0B1020',
        surface: '#151D33',
        success: '#34D399',
        error: '#FB7185',
        warning: '#FBBF24'
      }
    }
  },
  icons: {
    iconfont: 'mdi'
  }
})
