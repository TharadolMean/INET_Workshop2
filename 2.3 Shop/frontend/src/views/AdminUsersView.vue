<template>
  <div>
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="text-overline primary--text">ADMIN CONSOLE</div>
        <h1 class="page-title">อนุมัติผู้ใช้งาน</h1>
        <p class="muted-text mb-0">ตรวจสอบและอนุมัติสมาชิกที่สมัครใหม่</p>
      </v-col>
      <v-col cols="auto"><v-btn icon color="secondary" :loading="loading" @click="load"><v-icon>mdi-refresh</v-icon></v-btn></v-col>
    </v-row>
    <v-alert v-if="error" type="error" outlined>{{ error }}</v-alert>
    <v-card class="app-shell-card">
      <v-data-table :headers="headers" :items="users" :loading="loading" loading-text="กำลังโหลดผู้ใช้งาน..." no-data-text="ไม่มีผู้ใช้ที่รออนุมัติ">
        <template v-slot:item.isApproved="{ item }"><v-chip small :color="item.isApproved ? 'success' : 'warning'">{{ item.isApproved ? 'อนุมัติแล้ว' : 'รออนุมัติ' }}</v-chip></template>
        <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
        <template v-slot:item.actions="{ item }">
          <v-btn v-if="!item.isApproved" small color="primary" :loading="approving === item._id" @click="approve(item)">
            <v-icon left small>mdi-check</v-icon>อนุมัติ
          </v-btn>
          <span v-else class="muted-text">เรียบร้อย</span>
        </template>
      </v-data-table>
    </v-card>
    <v-snackbar v-model="snackbar" :color="snackbarColor">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import userService from '../services/userService';
import { getApiError } from '../services/api';

export default {
  name: 'AdminUsersView',
  data: () => ({
    users: [],
    loading: false,
    approving: '',
    error: '',
    snackbar: false,
    snackbarText: '',
    snackbarColor: 'success',
    headers: [
      { text: 'ชื่อ', value: 'name' },
      { text: 'อีเมล', value: 'email' },
      { text: 'บทบาท', value: 'role' },
      { text: 'สถานะ', value: 'isApproved' },
      { text: 'สมัครเมื่อ', value: 'createdAt' },
      { text: 'การจัดการ', value: 'actions', sortable: false, align: 'right' },
    ],
  }),
  created() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.error = '';
      try {
        const { data } = await userService.list({ isApproved: false });
        this.users = data.data || [];
      } catch (error) {
        this.error = getApiError(error, 'โหลดรายชื่อผู้ใช้ไม่สำเร็จ');
      } finally {
        this.loading = false;
      }
    },
    async approve(user) {
      this.approving = user._id;
      try {
        await userService.approve(user._id);
        this.users = this.users.filter((entry) => entry._id !== user._id);
        this.showMessage(`อนุมัติ ${user.name} สำเร็จ`, 'success');
      } catch (error) {
        this.showMessage(getApiError(error, 'อนุมัติผู้ใช้ไม่สำเร็จ'), 'error');
      } finally {
        this.approving = '';
      }
    },
    formatDate(value) {
      return value ? new Date(value).toLocaleString('th-TH') : '-';
    },
    showMessage(text, color) {
      this.snackbarText = text;
      this.snackbarColor = color;
      this.snackbar = true;
    },
  },
};
</script>
