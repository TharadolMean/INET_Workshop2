<template>
  <div class="admin-page">
    <v-row align="center" class="admin-page-header mb-5">
      <v-col>
        <div class="text-overline primary--text">ADMIN CONSOLE</div>
        <h1 class="page-title">จัดการสินค้า</h1>
        <p class="muted-text mb-0">ดูแลรายการอุปกรณ์อิเล็กทรอนิกส์และสต็อก</p>
      </v-col>
      <v-col cols="auto"><v-btn color="primary" class="admin-primary-action" @click="openCreate"><v-icon left>mdi-plus</v-icon>เพิ่มสินค้า</v-btn></v-col>
    </v-row>
    <v-alert v-if="error" type="error" outlined>{{ error }}</v-alert>
    <v-row class="mb-2">
      <v-col cols="6" sm="6" md="3">
        <v-card class="app-shell-card admin-stat-card stat-products" :class="{ 'admin-stat-card--selected': stockFilter === 'all' }" role="button" tabindex="0" :aria-pressed="stockFilter === 'all'" @click="setStockFilter('all')" @keyup.enter="setStockFilter('all')">
          <div class="admin-stat-icon"><v-icon color="primary">mdi-package-variant-closed</v-icon></div>
          <div><div class="admin-stat-label">สินค้าทั้งหมด</div><div class="admin-stat-value">{{ products.length }}</div></div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <v-card class="app-shell-card admin-stat-card stat-normal" :class="{ 'admin-stat-card--selected': stockFilter === 'normal' }" role="button" tabindex="0" :aria-pressed="stockFilter === 'normal'" @click="setStockFilter('normal')" @keyup.enter="setStockFilter('normal')">
          <div class="admin-stat-icon"><v-icon color="success">mdi-check-circle-outline</v-icon></div>
          <div><div class="admin-stat-label">สต็อกปกติ (&gt; {{ lowStockThreshold }})</div><div class="admin-stat-value">{{ normalStockCount }}</div></div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <v-card class="app-shell-card admin-stat-card stat-low" :class="{ 'admin-stat-card--selected': stockFilter === 'low' }" role="button" tabindex="0" :aria-pressed="stockFilter === 'low'" @click="setStockFilter('low')" @keyup.enter="setStockFilter('low')">
          <div class="admin-stat-icon"><v-icon color="warning">mdi-alert-circle-outline</v-icon></div>
          <div><div class="admin-stat-label">ใกล้หมด (1–{{ lowStockThreshold }})</div><div class="admin-stat-value">{{ lowStockProducts.length }}</div></div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <v-card class="app-shell-card admin-stat-card stat-out" :class="{ 'admin-stat-card--selected': stockFilter === 'out' }" role="button" tabindex="0" :aria-pressed="stockFilter === 'out'" @click="setStockFilter('out')" @keyup.enter="setStockFilter('out')">
          <div class="admin-stat-icon"><v-icon color="error">mdi-close-circle-outline</v-icon></div>
          <div><div class="admin-stat-label">หมดสต็อก</div><div class="admin-stat-value">{{ outOfStockCount }}</div></div>
        </v-card>
      </v-col>
    </v-row>
    <v-alert v-if="lowStockProducts.length" type="warning" outlined class="low-stock-alert mb-5">
      <div class="d-flex flex-wrap align-center justify-space-between low-stock-alert-content">
        <div>
          <strong>แจ้งเตือนสต็อกต่ำ</strong>
          <span class="ml-2">{{ lowStockSummary }}</span>
        </div>
        <v-btn small outlined color="warning" @click="setStockFilter('low')">
          ดูสินค้าใกล้หมด
        </v-btn>
      </div>
    </v-alert>
    <v-card class="app-shell-card admin-table-card">
      <div class="admin-list-toolbar pa-4">
        <v-text-field
          v-model="search"
          class="admin-list-search"
          label="ค้นหาชื่อสินค้า หรือรายละเอียด"
          prepend-inner-icon="mdi-magnify"
          clearable
          outlined
          dense
          hide-details
        />
      </div>
      <v-data-table :headers="responsiveHeaders" :items="filteredProducts" :loading="loading" loading-text="กำลังโหลดสินค้า..." :no-data-text="productEmptyText" class="admin-data-table">
        <template v-slot:item.name="{ item }">
          <div class="admin-product-name">{{ item.name }}</div>
          <div v-if="item.description" class="admin-product-description" :title="item.description">{{ item.description }}</div>
        </template>
        <template v-slot:item.category="{ item }">{{ categoryName(item) }}</template>
        <template v-slot:item.price="{ item }">{{ formatPrice(item.price) }} บาท</template>
        <template v-slot:item.stock="{ item }">
          <v-chip small :color="item.stock < 1 ? 'error' : item.stock <= lowStockThreshold ? 'warning' : 'success'">{{ stockLabel(item.stock) }}</v-chip>
        </template>
        <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
        <template v-slot:item.actions="{ item }">
          <v-btn icon small color="primary" :aria-label="`แก้ไขสินค้า ${item.name}`" title="แก้ไขสินค้า" @click="openEdit(item)"><v-icon small>mdi-pencil-outline</v-icon></v-btn>
          <v-btn icon small color="error" :aria-label="`ลบสินค้า ${item.name}`" title="ลบสินค้า" @click="askDelete(item)"><v-icon small>mdi-delete-outline</v-icon></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="620">
      <v-card class="app-shell-card admin-dialog-card">
        <v-card-title>{{ editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่' }}</v-card-title>
        <v-card-text><product-form :value="editing || undefined" :categories="categories" :loading="saving" @submit="save" @cancel="dialog = false" /></v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="deleteDialog" max-width="430">
      <v-card class="app-shell-card admin-dialog-card">
        <v-card-title>ยืนยันการลบสินค้า</v-card-title>
        <v-card-text>ต้องการลบ <strong>{{ deleting && deleting.name }}</strong> ใช่หรือไม่? Order ที่ผูกกับสินค้านี้จะถูกลบตาม Backend เดิม</v-card-text>
        <v-card-actions><v-spacer /><v-btn text @click="deleteDialog = false">ยกเลิก</v-btn><v-btn color="error" :loading="deletingNow" @click="remove">ลบสินค้า</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" :color="snackbarColor">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import ProductForm from '../components/products/ProductForm.vue';
import { getApiError } from '../services/api';
import categoryService from '../services/categoryService';

export default {
  name: 'AdminProductsView',
  components: { ProductForm },
  data: () => ({
    dialog: false,
    editing: null,
    deleting: null,
    deleteDialog: false,
    saving: false,
    deletingNow: false,
    search: '',
    stockFilter: 'all',
    lowStockThreshold: 5,
    error: '',
    snackbar: false,
    snackbarText: '',
    snackbarColor: 'success',
    categories: [],
    headers: [
      { text: 'สินค้า', value: 'name' },
      { text: 'หมวดหมู่', value: 'category', sortable: false },
      { text: 'ราคา', value: 'price' },
      { text: 'สต็อก', value: 'stock' },
      { text: 'สร้างเมื่อ', value: 'createdAt' },
      { text: 'การจัดการ', value: 'actions', sortable: false, align: 'right' },
    ],
  }),
  computed: {
    responsiveHeaders() {
      if (this.$vuetify.breakpoint.xsOnly) {
        return this.headers.filter((header) => !['category', 'description', 'createdAt'].includes(header.value));
      }
      if (this.$vuetify.breakpoint.smAndDown) {
        return this.headers.filter((header) => !['description', 'createdAt'].includes(header.value));
      }
      return this.headers;
    },
    products() {
      return this.$store.getters['products/products'];
    },
    loading() {
      return this.$store.state.products.loading;
    },
    lowStockProducts() {
      return this.products.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= this.lowStockThreshold);
    },
    lowStockSummary() {
      const names = this.lowStockProducts.slice(0, 3).map((product) => product.name).join(', ');
      const remaining = this.lowStockProducts.length - 3;
      return `${names}${remaining > 0 ? ` และอีก ${remaining} รายการ` : ''}`;
    },
    normalStockCount() {
      return this.products.filter((product) => Number(product.stock) > this.lowStockThreshold).length;
    },
    outOfStockCount() {
      return this.products.filter((product) => Number(product.stock) <= 0).length;
    },
    filteredProducts() {
      const keyword = this.search.trim().toLowerCase();
      return this.products.filter((product) => {
        const stock = Number(product.stock);
        const matchesStock = this.stockFilter === 'all' ||
          (this.stockFilter === 'normal' && stock > this.lowStockThreshold) ||
          (this.stockFilter === 'low' && stock > 0 && stock <= this.lowStockThreshold) ||
          (this.stockFilter === 'out' && stock <= 0);
        const matchesSearch = !keyword || `${product.name} ${product.description || ''}`.toLowerCase().includes(keyword);
        return matchesStock && matchesSearch;
      });
    },
    productEmptyText() {
      if (this.search) return 'ไม่พบสินค้าที่ตรงกับคำค้นหา';
      if (this.stockFilter === 'low') return 'ไม่มีสินค้าที่ใกล้หมด';
      if (this.stockFilter === 'normal') return 'ไม่มีสินค้าที่มีสต็อกปกติ';
      if (this.stockFilter === 'out') return 'ไม่มีสินค้าที่หมดสต็อก';
      return 'ยังไม่มีสินค้า';
    },
  },
  created() {
    this.load();
  },
  methods: {
    setStockFilter(filter) {
      this.stockFilter = filter;
    },
    stockLabel(stock) {
      if (Number(stock) <= 0) return 'หมดสต็อก';
      if (Number(stock) <= this.lowStockThreshold) return `ใกล้หมด · ${stock}`;
      return `ปกติ · ${stock}`;
    },
    async load() {
      this.error = '';
      try {
        const [, { data }] = await Promise.all([
          this.$store.dispatch('products/fetchProducts'),
          categoryService.list(),
        ]);
        this.categories = (data.data || []).filter((category) => category.isActive);
      } catch (error) {
        this.error = getApiError(error, 'โหลดสินค้าไม่สำเร็จ');
      }
    },
    openCreate() {
      this.editing = null;
      this.dialog = true;
    },
    openEdit(product) {
      this.editing = {
        ...product,
        category: product.category && product.category._id ? product.category._id : product.category,
      };
      this.dialog = true;
    },
    async save(payload) {
      this.saving = true;
      try {
        if (this.editing) {
          await this.$store.dispatch('products/updateProduct', { id: this.editing._id, payload });
          this.showMessage('แก้ไขสินค้าสำเร็จ', 'success');
        } else {
          await this.$store.dispatch('products/createProduct', payload);
          this.showMessage('เพิ่มสินค้าสำเร็จ', 'success');
        }
        this.dialog = false;
      } catch (error) {
        this.showMessage(getApiError(error, 'บันทึกสินค้าไม่สำเร็จ'), 'error');
      } finally {
        this.saving = false;
      }
    },
    askDelete(product) {
      this.deleting = product;
      this.deleteDialog = true;
    },
    async remove() {
      this.deletingNow = true;
      try {
        await this.$store.dispatch('products/deleteProduct', this.deleting._id);
        this.showMessage('ลบสินค้าสำเร็จ', 'success');
        this.deleteDialog = false;
      } catch (error) {
        this.showMessage(getApiError(error, 'ลบสินค้าไม่สำเร็จ'), 'error');
      } finally {
        this.deletingNow = false;
      }
    },
    formatPrice(value) {
      return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value);
    },
    categoryName(product) {
      return product.category?.name || 'ยังไม่ได้จัดหมวดหมู่';
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
