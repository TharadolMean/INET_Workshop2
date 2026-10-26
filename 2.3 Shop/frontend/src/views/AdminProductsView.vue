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
          <div><div class="admin-stat-label">สินค้าทั้งหมด</div><div class="admin-stat-value">{{ number(summary.activeProductCount + summary.archivedProductCount) }}</div></div>
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
        <div><div class="admin-stat-label">ใกล้หมด (1–{{ lowStockThreshold }})</div><div class="admin-stat-value">{{ number(summary.lowStockCount) }}</div></div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="6" md="3">
        <v-card class="app-shell-card admin-stat-card stat-out" :class="{ 'admin-stat-card--selected': stockFilter === 'out' }" role="button" tabindex="0" :aria-pressed="stockFilter === 'out'" @click="setStockFilter('out')" @keyup.enter="setStockFilter('out')">
          <div class="admin-stat-icon"><v-icon color="error">mdi-close-circle-outline</v-icon></div>
          <div><div class="admin-stat-label">หมดสต็อก</div><div class="admin-stat-value">{{ outOfStockCount }}</div></div>
        </v-card>
      </v-col>
    </v-row>
    <v-alert v-if="summary.lowStockCount" type="warning" outlined class="low-stock-alert mb-5">
      <div class="d-flex flex-wrap align-center justify-space-between low-stock-alert-content">
        <div>
          <strong>แจ้งเตือนสต็อกต่ำ</strong>
          <span class="ml-2">มีสินค้าเหลือไม่เกิน {{ lowStockThreshold }} ชิ้น {{ number(summary.lowStockCount) }} รายการ</span>
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
        <v-select v-model="sortBy" :items="sortOptions" item-text="text" item-value="value" label="เรียงสินค้า" outlined dense hide-details class="admin-product-sort" />
      </div>
      <v-data-table :headers="responsiveHeaders" :items="products" :loading="loading" loading-text="กำลังโหลดสินค้า..." :no-data-text="productEmptyText" hide-default-footer class="admin-data-table">
        <template v-slot:item.name="{ item }">
          <div class="admin-product-name">{{ item.name }}</div>
          <div v-if="item.description" class="admin-product-description" :title="item.description">{{ item.description }}</div>
        </template>
        <template v-slot:item.category="{ item }">{{ categoryName(item) }}</template>
        <template v-slot:item.price="{ item }">{{ formatPrice(item.price) }} บาท</template>
        <template v-slot:item.stock="{ item }">
          <v-chip small :color="item.stock < 1 ? 'error' : item.stock <= lowStockThreshold ? 'warning' : 'success'">{{ stockLabel(item.stock) }}</v-chip>
        </template>
        <template v-slot:item.isArchived="{ item }">
          <v-chip v-if="item.isArchived" small color="grey" text-color="white">เก็บถาวร</v-chip>
          <v-chip v-else small color="success">ใช้งาน</v-chip>
        </template>
        <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
        <template v-slot:item.actions="{ item }">
          <v-btn v-if="!item.isArchived" icon small color="primary" :aria-label="`แก้ไขสินค้า ${item.name}`" title="แก้ไขสินค้า" @click="openEdit(item)"><v-icon small>mdi-pencil-outline</v-icon></v-btn>
          <v-btn v-if="!item.isArchived" icon small color="secondary" :aria-label="`ปรับสต็อก ${item.name}`" title="ปรับสต็อกพร้อมบันทึกประวัติ" @click="openAdjustment(item)"><v-icon small>mdi-warehouse-edit-outline</v-icon></v-btn>
          <v-btn v-if="!item.isArchived" icon small color="error" :aria-label="`เก็บสินค้า ${item.name} เข้าคลัง`" title="เก็บเข้าคลังโดยคงประวัติ Order" @click="askDelete(item)"><v-icon small>mdi-archive-outline</v-icon></v-btn>
          <v-btn v-else icon small color="success" :aria-label="`กู้คืนสินค้า ${item.name}`" title="กู้คืนสินค้า" @click="restore(item)"><v-icon small>mdi-restore</v-icon></v-btn>
        </template>
      </v-data-table>
      <div v-if="pagination && pagination.totalPages > 1" class="d-flex flex-wrap align-center justify-space-between pa-4">
        <span class="caption muted-text">{{ number(pagination.totalItems) }} รายการ · หน้า {{ pagination.page }} จาก {{ pagination.totalPages }}</span>
        <v-pagination v-model="page" :length="pagination.totalPages" :total-visible="7" aria-label="เปลี่ยนหน้าสินค้าในระบบหลังบ้าน" />
      </div>
    </v-card>

    <v-card class="app-shell-card admin-table-card mt-6">
      <div class="dashboard-panel-heading pa-5 pb-2"><div class="text-overline primary--text">INVENTORY AUDIT</div><h2 class="section-heading">ประวัติปรับสต็อกล่าสุด</h2></div>
      <v-data-table :headers="adjustmentHeaders" :items="adjustments" :items-per-page="10" hide-default-footer class="admin-data-table" no-data-text="ยังไม่มีประวัติปรับสต็อก">
        <template v-slot:item.product="{ item }">{{ item.product?.name || 'สินค้าไม่พบ' }}</template>
        <template v-slot:item.quantityDelta="{ item }"><strong :class="item.quantityDelta > 0 ? 'success--text' : 'error--text'">{{ item.quantityDelta > 0 ? '+' : '' }}{{ item.quantityDelta }}</strong></template>
        <template v-slot:item.stockRange="{ item }">{{ item.stockBefore }} → {{ item.stockAfter }}</template>
        <template v-slot:item.actor="{ item }">{{ item.actor?.name || item.actor?.email || 'ผู้ใช้ไม่พบ' }}</template>
        <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
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
        <v-card-title>เก็บสินค้าเข้าคลัง?</v-card-title>
        <v-card-text>ต้องการเก็บ <strong>{{ deleting && deleting.name }}</strong> เข้าคลังหรือไม่? สินค้าจะไม่แสดงหน้าร้าน แต่ประวัติ Order จะคงอยู่</v-card-text>
        <v-card-actions><v-spacer /><v-btn text @click="deleteDialog = false">ยกเลิก</v-btn><v-btn color="error" :loading="deletingNow" @click="remove">เก็บเข้าคลัง</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="adjustmentDialog" max-width="520">
      <v-card class="app-shell-card admin-dialog-card">
        <v-card-title>ปรับสต็อกสินค้า</v-card-title>
        <v-card-text>
          <p class="mb-1"><strong>{{ adjustmentProduct?.name }}</strong> · คงเหลือ {{ adjustmentProduct?.stock }} ชิ้น</p>
          <v-text-field v-model.number="adjustment.delta" type="number" step="1" label="จำนวนที่ปรับ (+ เพิ่ม / − ลด)" :rules="[adjustmentDeltaRule]" outlined dense />
          <v-textarea v-model="adjustment.reason" label="เหตุผลในการปรับ" :rules="[adjustmentReasonRule]" rows="2" outlined dense />
          <v-alert v-if="adjustmentError" dense type="error" outlined>{{ adjustmentError }}</v-alert>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text @click="adjustmentDialog = false">ยกเลิก</v-btn><v-btn color="primary" :loading="savingAdjustment" @click="adjustStock">บันทึกการปรับ</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" :color="snackbarColor">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import ProductForm from '../components/products/ProductForm.vue';
import { getApiError } from '../services/api';
import categoryService from '../services/categoryService';
import inventoryService from '../services/inventoryService';

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
    sortBy: 'newest',
    sortOptions: [
      { text: 'เพิ่มล่าสุด', value: 'newest' }, { text: 'เพิ่มเก่าสุด', value: 'oldest' },
      { text: 'ชื่อ ก-ฮ', value: 'name-asc' }, { text: 'ชื่อ ฮ-ก', value: 'name-desc' },
      { text: 'ราคาต่ำไปสูง', value: 'price-asc' }, { text: 'ราคาสูงไปต่ำ', value: 'price-desc' },
    ],
    page: 1,
    pageSize: 25,
    searchTimer: null,
    lowStockThreshold: 5,
    error: '',
    snackbar: false,
    snackbarText: '',
    snackbarColor: 'success',
    categories: [],
    adjustments: [],
    adjustmentProduct: null,
    adjustmentDialog: false,
    savingAdjustment: false,
    adjustmentError: '',
    adjustment: { delta: 1, reason: '' },
    adjustmentHeaders: [
      { text: 'สินค้า', value: 'product' }, { text: 'เปลี่ยนแปลง', value: 'quantityDelta' },
      { text: 'ก่อน → หลัง', value: 'stockRange' }, { text: 'ผู้ดำเนินการ', value: 'actor' },
      { text: 'เหตุผล', value: 'reason' }, { text: 'เวลา', value: 'createdAt' },
    ],
    headers: [
      { text: 'สินค้า', value: 'name', sortable: false },
      { text: 'หมวดหมู่', value: 'category', sortable: false },
      { text: 'ราคา', value: 'price', sortable: false },
      { text: 'สต็อก', value: 'stock', sortable: false },
      { text: 'สถานะ', value: 'isArchived', sortable: false },
      { text: 'สร้างเมื่อ', value: 'createdAt', sortable: false },
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
    pagination() {
      return this.$store.state.products.pagination;
    },
    summary() {
      return this.$store.state.products.summary || { activeProductCount: 0, archivedProductCount: 0, lowStockCount: 0, outOfStockCount: 0 };
    },
    normalStockCount() {
      return Math.max(0, this.summary.activeProductCount - this.summary.lowStockCount - this.summary.outOfStockCount);
    },
    outOfStockCount() {
      return this.summary.outOfStockCount;
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
    if (['normal', 'low', 'out'].includes(this.$route.query.stock)) this.stockFilter = this.$route.query.stock;
    this.load();
  },
  beforeDestroy() { clearTimeout(this.searchTimer); },
  watch: {
    search() {
      clearTimeout(this.searchTimer);
      this.page = 1;
      this.searchTimer = setTimeout(() => this.loadProducts(), 250);
    },
    stockFilter() { this.page = 1; this.loadProducts(); },
    sortBy() { this.page = 1; this.loadProducts(); },
    page() { this.loadProducts(); },
    '$route.query.stock'(value) { if (['all', 'normal', 'low', 'out'].includes(value)) this.stockFilter = value; },
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
    number(value) { return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(value || 0); },
    async loadProducts() {
      try {
        await this.$store.dispatch('products/fetchProducts', {
          includeArchived: true, paged: 'true', page: this.page, limit: this.pageSize,
          stockStatus: this.stockFilter, sort: this.sortBy,
          ...(this.search.trim() ? { q: this.search.trim() } : {}),
        });
        const pagination = this.$store.state.products.pagination;
        if (pagination && this.page !== pagination.page) this.page = pagination.page;
      } catch (error) {
        this.error = getApiError(error, 'ค้นหาสินค้าไม่สำเร็จ');
      }
    },
    async load() {
      this.error = '';
      try {
        const [, { data }, adjustmentResponse] = await Promise.all([
          this.loadProducts(),
          categoryService.list(),
          inventoryService.listAdjustments({ limit: 10 }),
        ]);
        this.categories = (data.data || []).filter((category) => category.isActive);
        this.adjustments = adjustmentResponse.data.data.items || [];
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
    openAdjustment(product) {
      this.adjustmentProduct = product;
      this.adjustment = { delta: 1, reason: '' };
      this.adjustmentError = '';
      this.adjustmentDialog = true;
    },
    adjustmentDeltaRule(value) { return Number.isInteger(Number(value)) && Number(value) !== 0 || 'ระบุจำนวนเต็มที่ไม่ใช่ 0'; },
    adjustmentReasonRule(value) { return typeof value === 'string' && value.trim().length >= 3 || 'ระบุเหตุผลอย่างน้อย 3 ตัวอักษร'; },
    async adjustStock() {
      this.adjustmentError = '';
      if (this.adjustmentDeltaRule(this.adjustment.delta) !== true || this.adjustmentReasonRule(this.adjustment.reason) !== true) {
        this.adjustmentError = 'ตรวจสอบจำนวนและเหตุผลในการปรับสต็อก';
        return;
      }
      this.savingAdjustment = true;
      try {
        await inventoryService.adjust({ product: this.adjustmentProduct._id, delta: Number(this.adjustment.delta), reason: this.adjustment.reason });
        this.adjustmentDialog = false;
        this.showMessage('ปรับสต็อกและบันทึกประวัติแล้ว', 'success');
        await this.load();
      } catch (error) {
        this.adjustmentError = getApiError(error, 'ปรับสต็อกไม่สำเร็จ');
      } finally { this.savingAdjustment = false; }
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
        await this.load();
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
        await this.load();
      } catch (error) {
        this.showMessage(getApiError(error, 'ลบสินค้าไม่สำเร็จ'), 'error');
      } finally {
        this.deletingNow = false;
      }
    },
    async restore(product) {
      try {
        await this.$store.dispatch('products/restoreProduct', product._id);
        this.showMessage('กู้คืนสินค้าสำเร็จ', 'success');
        await this.load();
      } catch (error) {
        this.showMessage(getApiError(error, 'กู้คืนสินค้าไม่สำเร็จ'), 'error');
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
