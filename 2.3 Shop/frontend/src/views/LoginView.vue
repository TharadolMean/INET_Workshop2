<template>
  <v-row justify="center" align="center" class="auth-shell">
    <v-col cols="12" md="5" class="d-none d-md-block">
      <div class="auth-aside pa-8">
        <v-avatar color="primary" size="58"><v-icon>mdi-lightning-bolt</v-icon></v-avatar>
        <div class="text-overline primary--text mt-8">WELCOME TO ELECTROHUB</div>
        <h1 class="display-1 font-weight-bold mt-2">เทคโนโลยีที่ใช่ เริ่มต้นที่นี่</h1>
        <p class="muted-text mt-4 mb-0">เข้าสู่ระบบเพื่อเลือกดูสินค้า จัดการตะกร้า และสั่งซื้อได้อย่างสะดวก</p>
      </div>
    </v-col>
    <v-col cols="12" sm="10" md="5" lg="4">
      <v-card class="app-shell-card pa-6 pa-md-8">
        <div class="mb-6">
          <div class="text-overline primary--text">ACCOUNT ACCESS</div>
          <h1 class="page-title mt-2">ยินดีต้อนรับกลับ</h1>
          <p class="muted-text mb-0">เข้าสู่ ElectroHub เพื่อเริ่มเลือกซื้อสินค้า</p>
        </div>
        <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
        <v-form ref="form" @submit.prevent="submit">
          <v-text-field v-model="form.email" label="อีเมล" type="email" prepend-inner-icon="mdi-email-outline" :rules="[required, email]" outlined dense />
          <v-text-field v-model="form.password" label="รหัสผ่าน" type="password" prepend-inner-icon="mdi-lock-outline" :rules="[required]" outlined dense />
          <v-btn block large color="primary" type="submit" :loading="loading">เข้าสู่ระบบ</v-btn>
        </v-form>
        <div class="text-center mt-6 muted-text">
          ยังไม่มีบัญชี?
          <router-link class="font-weight-medium" to="/register">สมัครสมาชิก</router-link>
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
