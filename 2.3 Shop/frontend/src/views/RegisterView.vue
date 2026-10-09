<template>
  <v-row justify="center" align="center" class="auth-shell">
    <v-col cols="12" md="5" class="d-none d-md-block">
      <div class="auth-aside pa-8">
        <v-icon color="primary" size="58">mdi-account-plus-outline</v-icon>
        <div class="text-overline primary--text mt-8">JOIN ELECTROHUB</div>
        <h1 class="display-1 font-weight-bold mt-2">สร้างพื้นที่สำหรับการช้อปของคุณ</h1>
        <p class="muted-text mt-4 mb-0">สมัครสมาชิกเพื่อเก็บสินค้าไว้ในตะกร้าและดำเนินการสั่งซื้อ</p>
      </div>
    </v-col>
    <v-col cols="12" sm="10" md="5" lg="4">
      <v-card class="app-shell-card pa-6 pa-md-8">
        <div class="mb-6">
          <div class="text-overline primary--text">CREATE ACCOUNT</div>
          <h1 class="page-title">สมัครสมาชิก</h1>
          <p class="muted-text">สร้างบัญชีเพื่อเลือกซื้ออุปกรณ์อิเล็กทรอนิกส์</p>
        </div>
        <v-alert v-if="success" type="success" prominent>
          สมัครสมาชิกสำเร็จ กรุณารอผู้ดูแลระบบอนุมัติบัญชี
          <template #append><v-btn text to="/login">ไปหน้า Login</v-btn></template>
        </v-alert>
        <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
        <v-form v-if="!success" ref="form" @submit.prevent="submit">
          <v-text-field v-model="form.name" label="ชื่อ" :rules="[required]" outlined dense />
          <v-text-field v-model="form.email" label="อีเมล" type="email" :rules="[required, email]" outlined dense />
          <v-text-field v-model="form.password" label="รหัสผ่าน" type="password" :rules="[required, password]" outlined dense />
          <v-btn block large color="primary" type="submit" :loading="loading">สมัครสมาชิก</v-btn>
        </v-form>
        <div v-if="!success" class="text-center mt-6 muted-text">
          มีบัญชีแล้ว? <router-link to="/login">เข้าสู่ระบบ</router-link>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { getApiError } from '../services/api';

export default {
  name: 'RegisterView',
  data: () => ({
    form: { name: '', email: '', password: '' },
    error: '',
    success: false,
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
    password(value) {
      return String(value).length >= 6 || 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    },
    async submit() {
      if (!this.$refs.form.validate()) return;
      this.error = '';
      try {
        await this.$store.dispatch('auth/register', this.form);
        this.success = true;
      } catch (error) {
        this.error = getApiError(error, 'สมัครสมาชิกไม่สำเร็จ');
      }
    },
  },
};
</script>
