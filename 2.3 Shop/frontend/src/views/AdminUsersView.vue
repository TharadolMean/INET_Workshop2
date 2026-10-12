<template>
  <div class="admin-page">
    <v-row align="center" class="admin-page-header mb-5">
      <v-col>
        <div class="text-overline primary--text">ADMIN CONSOLE</div>
        <h1 class="page-title">จัดการผู้ใช้</h1>
        <p class="muted-text mb-0">ดูภาพรวม ค้นหา และจัดการสถานะสมาชิก</p>
      </v-col>
      <v-col cols="auto"><v-btn icon color="primary" aria-label="โหลดรายชื่อผู้ใช้อีกครั้ง" title="โหลดอีกครั้ง" :loading="loading" @click="load"><v-icon>mdi-refresh</v-icon></v-btn></v-col>
    </v-row>
    <v-alert v-if="error" type="error" outlined>{{ error }}</v-alert>

    <v-row class="mb-2">
      <v-col cols="6" sm="4">
        <v-card class="app-shell-card admin-stat-card" :class="{ 'admin-stat-card--selected': statusFilter === 'all' }" role="button" tabindex="0" aria-label="กรองผู้ใช้ทั้งหมด" :aria-pressed="statusFilter === 'all'" @click="setStatusFilter('all')" @keyup.enter="setStatusFilter('all')">
          <div class="admin-stat-icon"><v-icon color="primary">mdi-account-group-outline</v-icon></div>
          <div><div class="admin-stat-label">ผู้ใช้ทั้งหมด</div><div class="admin-stat-value">{{ users.length }}</div></div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4">
        <v-card class="app-shell-card admin-stat-card" :class="{ 'admin-stat-card--selected': statusFilter === 'pending' }" role="button" tabindex="0" aria-label="กรองผู้ใช้ที่รออนุมัติ" :aria-pressed="statusFilter === 'pending'" @click="setStatusFilter('pending')" @keyup.enter="setStatusFilter('pending')">
          <div class="admin-stat-icon"><v-icon color="warning">mdi-account-clock-outline</v-icon></div>
          <div><div class="admin-stat-label">รออนุมัติ</div><div class="admin-stat-value">{{ pendingCount }}</div></div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4">
        <v-card class="app-shell-card admin-stat-card" :class="{ 'admin-stat-card--selected': statusFilter === 'approved' }" role="button" tabindex="0" aria-label="กรองผู้ใช้ที่อนุมัติแล้ว" :aria-pressed="statusFilter === 'approved'" @click="setStatusFilter('approved')" @keyup.enter="setStatusFilter('approved')">
          <div class="admin-stat-icon"><v-icon color="success">mdi-account-check-outline</v-icon></div>
          <div><div class="admin-stat-label">อนุมัติแล้ว</div><div class="admin-stat-value">{{ approvedCount }}</div></div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="app-shell-card admin-table-card">
      <div class="user-table-toolbar pa-4">
        <v-text-field
          v-model="search"
          class="user-search"
          label="ค้นหาชื่อหรืออีเมล"
          prepend-inner-icon="mdi-magnify"
          clearable
          outlined
          dense
          hide-details
        />
      </div>
      <v-data-table :headers="responsiveHeaders" :items="filteredUsers" :loading="loading" loading-text="กำลังโหลดผู้ใช้งาน..." :no-data-text="emptyText" class="admin-data-table">
        <template v-slot:item.isApproved="{ item }"><v-chip small :color="item.isApproved ? 'success' : 'warning'">{{ item.isApproved ? 'อนุมัติแล้ว' : 'รออนุมัติ' }}</v-chip></template>
        <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
        <template v-slot:item.actions="{ item }">
          <v-btn v-if="!item.isApproved" small color="primary" :loading="approving === item._id" :aria-label="`อนุมัติผู้ใช้ ${item.name}`" @click="approve(item)">
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
    statusFilter: 'pending',
    search: '',
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
  computed: {
    responsiveHeaders() {
      if (this.$vuetify.breakpoint.xsOnly) {
        return this.headers.filter((header) => !['email', 'role', 'createdAt'].includes(header.value));
      }
      if (this.$vuetify.breakpoint.smAndDown) {
        return this.headers.filter((header) => header.value !== 'createdAt');
      }
      return this.headers;
    },
    pendingCount() {
      return this.users.filter((user) => !user.isApproved).length;
    },
    approvedCount() {
      return this.users.filter((user) => user.isApproved).length;
    },
    filteredUsers() {
      const keyword = this.search.trim().toLowerCase();
      return this.users.filter((user) => {
        const matchesStatus = this.statusFilter === 'all' ||
          (this.statusFilter === 'approved' ? user.isApproved : !user.isApproved);
        const matchesSearch = !keyword || `${user.name} ${user.email}`.toLowerCase().includes(keyword);
        return matchesStatus && matchesSearch;
      });
    },
    emptyText() {
      if (this.search) return 'ไม่พบผู้ใช้ที่ตรงกับคำค้นหา';
      if (this.statusFilter === 'approved') return 'ยังไม่มีผู้ใช้ที่อนุมัติแล้ว';
      if (this.statusFilter === 'all') return 'ยังไม่มีผู้ใช้';
      return 'ไม่มีผู้ใช้ที่รออนุมัติ';
    },
  },
  created() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.error = '';
      try {
        const { data } = await userService.list();
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
        const { data } = await userService.approve(user._id);
        this.users = this.users.map((entry) => entry._id === user._id ? data.data : entry);
        this.showMessage(`อนุมัติ ${user.name} สำเร็จ`, 'success');
      } catch (error) {
        this.showMessage(getApiError(error, 'อนุมัติผู้ใช้ไม่สำเร็จ'), 'error');
      } finally {
        this.approving = '';
      }
    },
    setStatusFilter(status) {
      this.statusFilter = status;
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
