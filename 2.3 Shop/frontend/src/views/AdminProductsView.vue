<template>
  <div>
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="text-overline primary--text">ADMIN CONSOLE</div>
        <h1 class="page-title">จัดการสินค้า</h1>
        <p class="muted-text mb-0">ดูแลรายการอุปกรณ์อิเล็กทรอนิกส์และสต็อก</p>
      </v-col>
      <v-col cols="auto"><v-btn color="primary" @click="openCreate"><v-icon left>mdi-plus</v-icon>เพิ่มสินค้า</v-btn></v-col>
    </v-row>
    <v-alert v-if="error" type="error" outlined>{{ error }}</v-alert>
    <v-card class="app-shell-card">
      <v-data-table :headers="headers" :items="products" :loading="loading" loading-text="กำลังโหลดสินค้า..." no-data-text="ยังไม่มีสินค้า">
        <template v-slot:item.category="{ item }">{{ categoryName(item) }}</template>
        <template v-slot:item.price="{ item }">{{ formatPrice(item.price) }} บาท</template>
        <template v-slot:item.stock="{ item }">
          <v-chip small :color="item.stock > 0 ? 'success' : 'error'">{{ item.stock }}</v-chip>
        </template>
        <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
        <template v-slot:item.actions="{ item }">
          <v-btn icon small color="secondary" @click="openEdit(item)"><v-icon>mdi-pencil-outline</v-icon></v-btn>
          <v-btn icon small color="error" @click="askDelete(item)"><v-icon>mdi-delete-outline</v-icon></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="620">
      <v-card class="app-shell-card">
        <v-card-title>{{ editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่' }}</v-card-title>
        <v-card-text><product-form :value="editing || undefined" :categories="categories" :loading="saving" @submit="save" @cancel="dialog = false" /></v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="deleteDialog" max-width="430">
      <v-card class="app-shell-card">
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
    error: '',
    snackbar: false,
    snackbarText: '',
    snackbarColor: 'success',
    categories: [],
    headers: [
      { text: 'สินค้า', value: 'name' },
      { text: 'หมวดหมู่', value: 'category', sortable: false },
      { text: 'รายละเอียด', value: 'description', sortable: false },
      { text: 'ราคา', value: 'price' },
      { text: 'สต็อก', value: 'stock' },
      { text: 'สร้างเมื่อ', value: 'createdAt' },
      { text: 'การจัดการ', value: 'actions', sortable: false, align: 'right' },
    ],
  }),
  computed: {
    products() {
      return this.$store.getters['products/products'];
    },
    loading() {
      return this.$store.state.products.loading;
    },
  },
  created() {
    this.load();
  },
  methods: {
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
