<template>
  <div>
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="text-overline primary--text">ADMIN CONSOLE</div>
        <h1 class="page-title">จัดการคำสั่งซื้อ</h1>
        <p class="muted-text mb-0">ดูรายการสั่งซื้อจากลูกค้าทั้งหมด</p>
      </v-col>
      <v-col cols="auto"><v-btn icon color="secondary" :loading="loading" @click="load"><v-icon>mdi-refresh</v-icon></v-btn></v-col>
    </v-row>
    <v-alert v-if="error" type="error" outlined>{{ error }}</v-alert>
    <v-card class="app-shell-card">
      <v-data-table :headers="headers" :items="orders" :loading="loading" loading-text="กำลังโหลดคำสั่งซื้อ..." no-data-text="ยังไม่มีคำสั่งซื้อ">
        <template v-slot:item._id="{ item }"><code>{{ shortId(item._id) }}</code></template>
        <template v-slot:item.product="{ item }">{{ productSummary(item) }}</template>
        <template v-slot:item.user="{ item }">{{ userName(item) }}</template>
        <template v-slot:item.quantity="{ item }">{{ totalQuantity(item) }}</template>
        <template v-slot:item.unitPrice="{ item }">{{ priceSummary(item) }}</template>
        <template v-slot:item.totalPrice="{ item }"><strong>{{ formatPrice(item.totalPrice) }} บาท</strong></template>
        <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
      </v-data-table>
    </v-card>
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
    headers: [
      { text: 'Order ID', value: '_id' },
      { text: 'สินค้า', value: 'product' },
      { text: 'ลูกค้า', value: 'user' },
      { text: 'จำนวน', value: 'quantity' },
      { text: 'ราคาต่อหน่วย', value: 'unitPrice' },
      { text: 'ยอดรวม', value: 'totalPrice' },
      { text: 'วันที่สร้าง', value: 'createdAt' },
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
