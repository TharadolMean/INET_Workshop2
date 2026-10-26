<template>
  <div>
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="text-overline primary--text">YOUR ACCOUNT</div>
        <h1 class="page-title">คำสั่งซื้อของฉัน</h1>
        <p class="muted-text mb-0">ตรวจสอบรายการและยอดรวมจากคำสั่งซื้อที่ผ่านมา</p>
      </v-col>
      <v-col cols="auto">
        <v-btn icon color="primary" :loading="loading" aria-label="โหลดคำสั่งซื้อใหม่" @click="load">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" outlined class="mb-5">
      {{ error }}
      <template #append><v-btn text @click="load">ลองใหม่</v-btn></template>
    </v-alert>

    <v-card class="app-shell-card admin-table-card">
      <v-data-table
        :headers="headers"
        :items="orders"
        :loading="loading"
        loading-text="กำลังโหลดคำสั่งซื้อ..."
        no-data-text="ยังไม่มีคำสั่งซื้อ"
      >
        <template v-slot:item._id="{ item }"><code>{{ shortId(item._id) }}</code></template>
        <template v-slot:item.products="{ item }">{{ productSummary(item) }}</template>
        <template v-slot:item.quantity="{ item }">{{ totalQuantity(item) }} ชิ้น</template>
        <template v-slot:item.totalPrice="{ item }"><strong>{{ formatPrice(item.totalPrice) }} บาท</strong></template>
        <template v-slot:item.status="{ item }"><order-status :order="item" /></template>
        <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
        <template v-slot:item.actions="{ item }">
          <v-btn small text color="primary" @click="viewDetails(item)">
            <v-icon left small>mdi-eye-outline</v-icon>ดูรายละเอียด
          </v-btn>
          <v-btn v-if="canCancel(item)" small text color="error" :disabled="canceling" @click="askCancel(item)">
            <v-icon left small>mdi-cancel</v-icon>ยกเลิก
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
          <v-btn icon aria-label="ปิดรายละเอียด" @click="detailsDialog = false"><v-icon>mdi-close</v-icon></v-btn>
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
            <v-col cols="12">
              <div class="order-meta-label">สถานะปัจจุบัน</div>
              <order-status :order="selectedOrder" show-history />
            </v-col>
            <v-col cols="12">
              <div class="order-meta-label">จำนวนสินค้ารวม</div>
              <div class="order-meta-value">{{ totalQuantity(selectedOrder) }} ชิ้น</div>
            </v-col>
          </v-row>

          <div class="section-heading text-subtitle-1 mb-3">รายการสินค้า</div>
          <div class="order-lines">
            <div class="order-line order-line-heading">
              <span>สินค้า</span><span>ราคาต่อชิ้น</span><span>จำนวน</span><span>รวม</span>
            </div>
            <div
              v-for="(item, index) in orderItems(selectedOrder)"
              :key="`${item.product?._id || item.product || index}`"
              class="order-line"
            >
              <span class="font-weight-medium">{{ item.name || item.product?.name || 'สินค้าไม่พบ' }}</span>
              <span>{{ formatPrice(item.unitPrice) }} บาท</span>
              <span>{{ item.quantity }}</span>
              <strong>{{ formatPrice(itemTotal(item)) }} บาท</strong>
            </div>
          </div>

          <div class="d-flex justify-space-between align-center order-total mt-5">
            <span class="font-weight-medium">{{ selectedOrder.subtotalPrice !== undefined ? 'ยอดสุทธิหลังส่วนลด' : 'ยอดรวมทั้ง Order' }}</span>
            <strong class="price-text">{{ formatPrice(selectedOrder.totalPrice) }} บาท</strong>
          </div>
          <div v-if="selectedOrder.subtotalPrice !== undefined" class="mt-3 order-price-breakdown">
            <div class="d-flex justify-space-between"><span>ยอดสินค้าก่อนส่วนลด</span><span>{{ formatPrice(selectedOrder.subtotalPrice) }} บาท</span></div>
            <div class="d-flex justify-space-between"><span>ส่วนลด{{ selectedOrder.couponCode ? ` · ${selectedOrder.couponCode}` : '' }}</span><span>-{{ formatPrice(selectedOrder.discountAmount) }} บาท</span></div>
          </div>
          <div v-if="selectedOrder.shippingAddress && selectedOrder.shippingAddress.line1" class="mt-5">
            <div class="section-heading text-subtitle-1">ที่อยู่ใน Order</div>
            <div>{{ selectedOrder.shippingAddress.recipient }} · {{ selectedOrder.shippingAddress.phone }}</div>
            <div class="muted-text">{{ selectedOrder.shippingAddress.line1 }} {{ selectedOrder.shippingAddress.line2 }} {{ selectedOrder.shippingAddress.subdistrict }} {{ selectedOrder.shippingAddress.district }} {{ selectedOrder.shippingAddress.province }} {{ selectedOrder.shippingAddress.postalCode }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="cancelDialog" max-width="440">
      <v-card class="app-shell-card">
        <v-card-title>ยกเลิกคำสั่งซื้อ?</v-card-title>
        <v-card-text>ยกเลิก Order <code>{{ selectedOrder && shortId(selectedOrder._id) }}</code> ได้ก่อนเริ่มจัดเตรียมสินค้าเท่านั้น ระบบจะคืนสต็อกให้อัตโนมัติ</v-card-text>
        <v-card-actions><v-spacer /><v-btn text :disabled="canceling" @click="cancelDialog = false">กลับ</v-btn><v-btn color="error" :loading="canceling" @click="cancelOrder">ยืนยันยกเลิก</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" color="success" top>{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import orderService from '../services/orderService';
import { getApiError } from '../services/api';
import OrderStatus from '../components/orders/OrderStatus.vue';

export default {
  name: 'MyOrdersView',
  components: { OrderStatus },
  data: () => ({
    orders: [],
    loading: false,
    error: '',
    detailsDialog: false,
    selectedOrder: null,
    cancelDialog: false,
    canceling: false,
    snackbar: false,
    snackbarText: '',
    headers: [
      { text: 'Order ID', value: '_id' },
      { text: 'สินค้า', value: 'products' },
      { text: 'จำนวน', value: 'quantity' },
      { text: 'ยอดรวม', value: 'totalPrice' },
      { text: 'สถานะ', value: 'status' },
      { text: 'วันที่สั่งซื้อ', value: 'createdAt' },
      { text: 'รายละเอียด', value: 'actions', sortable: false, align: 'center' },
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
        const { data } = await orderService.listMine();
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
      const items = this.orderItems(order);
      const names = items.map((item) => item.name || item.product?.name || 'สินค้าไม่พบ');
      return names.length > 2 ? `${names.slice(0, 2).join(', ')} และอีก ${names.length - 2} รายการ` : names.join(', ');
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
    canCancel(order) {
      return ['pending', 'confirmed'].includes(order.status || 'pending');
    },
    askCancel(order) {
      this.selectedOrder = order;
      this.cancelDialog = true;
    },
    async cancelOrder() {
      if (!this.selectedOrder) return;
      this.canceling = true;
      try {
        await orderService.cancel(this.selectedOrder._id);
        this.cancelDialog = false;
        this.snackbarText = 'ยกเลิกคำสั่งซื้อและคืนสต็อกแล้ว';
        this.snackbar = true;
        await this.load();
        if (this.detailsDialog && this.selectedOrder) {
          this.selectedOrder = this.orders.find((order) => order._id === this.selectedOrder._id) || this.selectedOrder;
        }
      } catch (error) {
        this.error = getApiError(error, 'ยกเลิกคำสั่งซื้อไม่สำเร็จ');
      } finally {
        this.canceling = false;
      }
    },
    shortId(id) {
      return id ? `${id.slice(0, 8)}...` : '-';
    },
    formatPrice(value) {
      return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value || 0);
    },
    formatDate(value) {
      return value ? new Date(value).toLocaleString('th-TH') : '-';
    },
  },
};
</script>
