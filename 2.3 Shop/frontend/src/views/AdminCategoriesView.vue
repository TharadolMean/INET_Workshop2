<template>
  <div class="admin-page">
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="text-overline primary--text">ADMIN CONSOLE</div>
        <h1 class="page-title">จัดการหมวดหมู่</h1>
        <p class="muted-text mb-0">สร้างและจัดการหมวดหมู่สำหรับสินค้า</p>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" @click="openCreate">
          <v-icon left>mdi-plus</v-icon>เพิ่มหมวดหมู่
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" outlined>{{ error }}</v-alert>
    <v-row class="mb-2">
      <v-col cols="12" sm="4">
        <v-card class="app-shell-card admin-stat-card stat-products" :class="{ 'admin-stat-card--selected': statusFilter === 'all' }" role="button" tabindex="0" @click="setStatusFilter('all')" @keyup.enter="setStatusFilter('all')">
          <div class="admin-stat-icon"><v-icon color="primary">mdi-shape-outline</v-icon></div>
          <div><div class="admin-stat-label">หมวดหมู่ทั้งหมด</div><div class="admin-stat-value">{{ categories.length }}</div></div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="app-shell-card admin-stat-card stat-normal" :class="{ 'admin-stat-card--selected': statusFilter === 'active' }" role="button" tabindex="0" @click="setStatusFilter('active')" @keyup.enter="setStatusFilter('active')">
          <div class="admin-stat-icon"><v-icon color="success">mdi-eye-outline</v-icon></div>
          <div><div class="admin-stat-label">เปิดใช้งาน</div><div class="admin-stat-value">{{ activeCount }}</div></div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="app-shell-card admin-stat-card stat-out" :class="{ 'admin-stat-card--selected': statusFilter === 'inactive' }" role="button" tabindex="0" @click="setStatusFilter('inactive')" @keyup.enter="setStatusFilter('inactive')">
          <div class="admin-stat-icon"><v-icon color="secondary">mdi-eye-off-outline</v-icon></div>
          <div><div class="admin-stat-label">ปิดใช้งาน</div><div class="admin-stat-value">{{ inactiveCount }}</div></div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="app-shell-card admin-table-card">
      <v-data-table :headers="responsiveHeaders" :items="filteredCategories" :loading="loading" :no-data-text="categoryEmptyText">
        <template v-slot:item.isActive="{ item }">
          <v-chip small :color="item.isActive ? 'success' : 'grey'">
            {{ item.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน' }}
          </v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn icon small color="secondary" @click="openEdit(item)">
            <v-icon>mdi-pencil-outline</v-icon>
          </v-btn>
          <v-btn icon small :color="item.isActive ? 'warning' : 'success'" @click="toggle(item)">
            <v-icon>{{ item.isActive ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
          </v-btn>
          <v-btn icon small color="error" @click="remove(item)">
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="480">
      <v-card class="app-shell-card">
        <v-card-title>{{ editing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่' }}</v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="save">
            <v-text-field v-model="form.name" label="ชื่อหมวดหมู่" :rules="[required]" outlined dense />
            <v-text-field v-model="form.slug" label="Slug (ไม่บังคับ)" hint="เว้นว่างเพื่อให้ระบบสร้างจากชื่อ" persistent-hint outlined dense />
            <div class="d-flex justify-end">
              <v-btn text @click="dialog = false">ยกเลิก</v-btn>
              <v-btn type="submit" color="primary" :loading="saving">บันทึก</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" :color="snackbarColor">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import categoryService from '../services/categoryService';
import { getApiError } from '../services/api';

export default {
  name: 'AdminCategoriesView',
  data: () => ({
    categories: [],
    loading: false,
    saving: false,
    statusFilter: 'all',
    error: '',
    dialog: false,
    editing: null,
    form: { name: '', slug: '' },
    snackbar: false,
    snackbarText: '',
    snackbarColor: 'success',
    headers: [
      { text: 'ชื่อหมวดหมู่', value: 'name' },
      { text: 'Slug', value: 'slug' },
      { text: 'สถานะ', value: 'isActive' },
      { text: 'การจัดการ', value: 'actions', sortable: false, align: 'right' },
    ],
  }),
  computed: {
    responsiveHeaders() {
      if (this.$vuetify.breakpoint.xsOnly) return this.headers.filter((header) => header.value !== 'slug');
      return this.headers;
    },
    activeCount() {
      return this.categories.filter((category) => category.isActive).length;
    },
    inactiveCount() {
      return this.categories.filter((category) => !category.isActive).length;
    },
    filteredCategories() {
      if (this.statusFilter === 'active') return this.categories.filter((category) => category.isActive);
      if (this.statusFilter === 'inactive') return this.categories.filter((category) => !category.isActive);
      return this.categories;
    },
    categoryEmptyText() {
      if (this.statusFilter === 'active') return 'ไม่มีหมวดหมู่ที่เปิดใช้งาน';
      if (this.statusFilter === 'inactive') return 'ไม่มีหมวดหมู่ที่ปิดใช้งาน';
      return 'ยังไม่มีหมวดหมู่';
    },
  },
  created() {
    this.load();
  },
  methods: {
    setStatusFilter(status) {
      this.statusFilter = status;
    },
    async load() {
      this.loading = true;
      this.error = '';
      try {
        const { data } = await categoryService.list();
        this.categories = data.data || [];
      } catch (error) {
        this.error = getApiError(error, 'โหลดหมวดหมู่ไม่สำเร็จ');
      } finally {
        this.loading = false;
      }
    },
    openCreate() {
      this.editing = null;
      this.form = { name: '', slug: '' };
      this.dialog = true;
    },
    openEdit(category) {
      this.editing = category;
      this.form = { name: category.name, slug: category.slug };
      this.dialog = true;
    },
    async save() {
      if (!this.$refs.form.validate()) return;
      this.saving = true;
      try {
        if (this.editing) {
          await categoryService.update(this.editing._id, this.form);
          this.showMessage('แก้ไขหมวดหมู่สำเร็จ', 'success');
        } else {
          await categoryService.create(this.form);
          this.showMessage('เพิ่มหมวดหมู่สำเร็จ', 'success');
        }
        this.dialog = false;
        await this.load();
      } catch (error) {
        this.showMessage(getApiError(error, 'บันทึกหมวดหมู่ไม่สำเร็จ'), 'error');
      } finally {
        this.saving = false;
      }
    },
    async toggle(category) {
      try {
        await categoryService.update(category._id, { isActive: !category.isActive });
        await this.load();
      } catch (error) {
        this.showMessage(getApiError(error, 'เปลี่ยนสถานะหมวดหมู่ไม่สำเร็จ'), 'error');
      }
    },
    async remove(category) {
      if (!window.confirm(`ต้องการลบหมวดหมู่ "${category.name}" ใช่หรือไม่?`)) return;
      try {
        await categoryService.remove(category._id);
        this.showMessage('ลบหมวดหมู่สำเร็จ', 'success');
        await this.load();
      } catch (error) {
        this.showMessage(getApiError(error, 'ลบหมวดหมู่ไม่สำเร็จ'), 'error');
      }
    },
    required(value) {
      return Boolean(String(value || '').trim()) || 'กรุณากรอกชื่อหมวดหมู่';
    },
    showMessage(text, color) {
      this.snackbarText = text;
      this.snackbarColor = color;
      this.snackbar = true;
    },
  },
};
</script>
