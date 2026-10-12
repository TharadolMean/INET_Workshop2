<template>
  <div class="admin-page">
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="text-overline primary--text">ADMIN CONSOLE</div>
        <h1 class="page-title">จัดการคำสั่งซื้อ</h1>
        <p class="muted-text mb-0">ดูรายการสั่งซื้อจากลูกค้าทั้งหมด</p>
      </v-col>
      <v-col cols="auto"><v-btn icon color="secondary" :loading="loading" @click="load"><v-icon>mdi-refresh</v-icon></v-btn></v-col>
    </v-row>
    <v-alert v-if="error" type="error" outlined>{{ error }}</v-alert>
    <v-card class="app-shell-card admin-table-card">
      <div class="admin-list-toolbar pa-4">
        <div class="muted-text caption order-result-count">แสดง {{ filteredOrders.length }} จาก {{ orders.length }} Order</div>
        <v-text-field
          v-model="search"
          class="admin-list-search order-search"
          label="ค้นหา Order ID, ลูกค้า หรือสินค้า"
          prepend-inner-icon="mdi-magnify"
          clearable
          outlined
          dense
          hide-details
        />
        <v-select
          v-model="dateFilter"
          class="order-date-filter"
          :items="dateFilterOptions"
          item-text="text"
          item-value="value"
          label="ช่วงเวลา"
          outlined
          dense
          hide-details
        />
      </div>
      <v-data-table :headers="responsiveHeaders" :items="filteredOrders" :loading="loading" loading-text="กำลังโหลดคำสั่งซื้อ..." :no-data-text="orderEmptyText">
        <template v-slot:item._id="{ item }"><code>{{ shortId(item._id) }}</code></template>
        <template v-slot:item.product="{ item }">{{ productSummary(item) }}</template>
        <template v-slot:item.user="{ item }">{{ userName(item) }}</template>
        <template v-slot:item.quantity="{ item }">{{ totalQuantity(item) }}</template>
        <template v-slot:item.unitPrice="{ item }">{{ priceSummary(item) }}</template>
        <template v-slot:item.totalPrice="{ item }"><strong>{{ formatPrice(item.totalPrice) }} บาท</strong></template>
        <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
        <template v-slot:item.actions="{ item }">
          <v-btn small text color="primary" @click="viewDetails(item)">
            <v-icon left small>mdi-eye-outline</v-icon>ดูรายละเอียด
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="detailsDialog" max-width="760">
      <v-card v-if="selectedOrder" class="app-shell-card order-details-card">
        <v-card-title class="order-details-header pa-6">
          <div>
            <div class="text-overline primary--text">ORDER DETAILS</div>
            <div class="section-heading">รายละเอียดคำสั่งซื้อ</div>
          </div>
          <v-spacer />
          <v-btn icon aria-label="ปิดรายละเอียด" @click="detailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="px-6 pb-6">
          <v-row class="mb-3">
            <v-col cols="12" sm="6">
              <div class="order-meta-label">หมายเลข Order</div>
              <code class="order-full-id">{{ selectedOrder._id }}</code>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="order-meta-label">วันที่สั่งซื้อ</div>
              <div class="order-meta-value">{{ formatDate(selectedOrder.createdAt) }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="order-meta-label">ลูกค้า</div>
              <div class="order-meta-value">{{ userName(selectedOrder) }}</div>
              <div v-if="selectedOrder.user?.email" class="muted-text caption">{{ selectedOrder.user.email }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="order-meta-label">จำนวนสินค้ารวม</div>
              <div class="order-meta-value">{{ totalQuantity(selectedOrder) }} ชิ้น</div>
            </v-col>
          </v-row>

          <div class="section-heading text-subtitle-1 mb-3">รายการสินค้า</div>
          <div class="order-lines">
            <div class="order-line order-line-heading">
              <span>สินค้า</span><span>ราคาต่อชิ้น</span><span>จำนวน</span><span>รวม</span>
            </div>
            <div v-for="(item, index) in orderItems(selectedOrder)" :key="`${item.product?._id || item.product || index}`" class="order-line">
              <span class="font-weight-medium">{{ item.name || item.product?.name || 'สินค้าไม่พบ' }}</span>
              <span>{{ formatPrice(item.unitPrice) }} บาท</span>
              <span>{{ item.quantity }}</span>
              <strong>{{ formatPrice(itemTotal(item)) }} บาท</strong>
            </div>
          </div>

          <div class="d-flex justify-space-between align-center order-total mt-5">
            <span class="font-weight-medium">ยอดรวมทั้ง Order</span>
            <strong class="price-text">{{ formatPrice(selectedOrder.totalPrice) }} บาท</strong>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import orderService from '../services/orderService';
import { getApiError } from '../services/api';

export default {
  name: 'AdminOrdersView',
  data: () => ({
    orders: [],
    loading: false,
    error: '',
    detailsDialog: false,
    selectedOrder: null,
    search: '',
    dateFilter: 'all',
    dateFilterOptions: [
      { text: 'ทุกช่วงเวลา', value: 'all' },
      { text: 'วันนี้', value: 'today' },
      { text: '7 วันล่าสุด', value: '7d' },
      { text: '30 วันล่าสุด', value: '30d' },
    ],
    headers: [
      { text: 'Order ID', value: '_id' },
      { text: 'สินค้า', value: 'product' },
      { text: 'ลูกค้า', value: 'user' },
      { text: 'จำนวน', value: 'quantity' },
      { text: 'ราคาต่อหน่วย', value: 'unitPrice' },
      { text: 'ยอดรวม', value: 'totalPrice' },
      { text: 'วันที่สร้าง', value: 'createdAt' },
      { text: 'รายละเอียด', value: 'actions', sortable: false, align: 'center' },
    ],
  }),
  computed: {
    responsiveHeaders() {
      if (this.$vuetify.breakpoint.xsOnly) {
        return this.headers.filter((header) => !['user', 'quantity', 'unitPrice', 'createdAt'].includes(header.value));
      }
      if (this.$vuetify.breakpoint.smAndDown) {
        return this.headers.filter((header) => !['unitPrice', 'createdAt'].includes(header.value));
      }
      return this.headers;
    },
    filteredOrders() {
      const keyword = this.search.trim().toLowerCase();
      const now = new Date();
      let startDate = null;

      if (this.dateFilter === 'today') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
      } else if (this.dateFilter === '7d' || this.dateFilter === '30d') {
        const days = this.dateFilter === '7d' ? 7 : 30;
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);
      }

      return this.orders.filter((order) => {
        const searchable = [order._id, order.user?.name, order.user?.email, this.productSummary(order)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const matchesSearch = !keyword || searchable.includes(keyword);
        const matchesDate = !startDate || new Date(order.createdAt) >= startDate;
        return matchesSearch && matchesDate;
      });
    },
    orderEmptyText() {
      if (this.search || this.dateFilter !== 'all') return 'ไม่พบ Order ที่ตรงกับตัวกรอง';
      return 'ยังไม่มีคำสั่งซื้อ';
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
        const { data } = await orderService.list();
        this.orders = data.data || [];
      } catch (error) {
        this.error = getApiError(error, 'โหลดคำสั่งซื้อไม่สำเร็จ');
      } finally {
        this.loading = false;
      }
    },
    orderItems(order) {
      if (Array.isArray(order.items) && order.items.length) return order.items;
      return order.product ? [{
        product: order.product,
        name: order.product.name,
        quantity: order.quantity,
        unitPrice: order.unitPrice,
      }] : [];
    },
    productSummary(order) {
      return this.orderItems(order)
        .map((item) => `${item.name || item.product?.name || 'สินค้าไม่พบ'} x${item.quantity}`)
        .join(', ') || 'สินค้าไม่พบ';
    },
    totalQuantity(order) {
      return this.orderItems(order).reduce((sum, item) => sum + item.quantity, 0);
    },
    itemTotal(item) {
      return item.totalPrice !== undefined ? item.totalPrice : item.unitPrice * item.quantity;
    },
    viewDetails(order) {
      this.selectedOrder = order;
      this.detailsDialog = true;
    },
    priceSummary(order) {
      const items = this.orderItems(order);
      if (items.length > 1) return items.map((item) => `${this.formatPrice(item.unitPrice)} บาท`).join(' + ');
      return items.length ? `${this.formatPrice(items[0].unitPrice)} บาท` : '-';
    },
    userName(order) {
      return order.user?.name || order.user?.email || 'ผู้ใช้ไม่พบ';
    },
    shortId(id) {
      return id ? `${id.slice(0, 8)}...` : '-';
    },
    formatPrice(value) {
      return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value);
    },
    formatDate(value) {
      return value ? new Date(value).toLocaleString('th-TH') : '-';
    },
  },
};
</script>
