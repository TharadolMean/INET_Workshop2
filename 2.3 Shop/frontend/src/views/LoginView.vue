<template>
  <v-row justify="center">
    <v-col cols="12" sm="10" md="6" lg="4">
      <v-card class="app-shell-card pa-6">
        <div class="text-center mb-6">
          <v-avatar color="primary" size="58"><v-icon>mdi-lightning-bolt</v-icon></v-avatar>
          <h1 class="page-title mt-4">ยินดีต้อนรับ</h1>
          <p class="muted-text">เข้าสู่ ElectroHub ร้านอุปกรณ์อิเล็กทรอนิกส์</p>
        </div>
        <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
        <v-form ref="form" @submit.prevent="submit">
          <v-text-field v-model="form.email" label="อีเมล" type="email" prepend-inner-icon="mdi-email-outline" :rules="[required, email]" outlined />
          <v-text-field v-model="form.password" label="รหัสผ่าน" type="password" prepend-inner-icon="mdi-lock-outline" :rules="[required]" outlined />
          <v-btn block large color="primary" type="submit" :loading="loading">เข้าสู่ระบบ</v-btn>
        </v-form>
        <div class="text-center mt-6">
          ยังไม่มีบัญชี?
          <router-link to="/register">สมัครสมาชิก</router-link>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { getApiError } from '../services/api';

export default {
  name: 'LoginView',
  data: () => ({
    form: { email: '', password: '' },
    error: '',
  }),
  computed: {
    loading() {
      return this.$store.state.auth.loading;
    },
  },
  methods: {
    required(value) {
      return Boolean(value) || 'กรุณากรอกข้อมูล';
    },
    email(value) {
      return /.+@.+\..+/.test(value) || 'รูปแบบอีเมลไม่ถูกต้อง';
    },
    async submit() {
      if (!this.$refs.form.validate()) return;
      this.error = '';
      try {
        await this.$store.dispatch('auth/login', this.form);
        this.$router.replace(this.$route.query.redirect || '/products');
      } catch (error) {
        this.error = getApiError(error, 'เข้าสู่ระบบไม่สำเร็จ');
      }
    },
  },
};
</script>
