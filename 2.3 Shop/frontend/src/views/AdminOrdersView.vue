<template>
  <div class="admin-page">
    <v-row align="center" class="admin-page-header mb-5">
      <v-col>
        <div class="text-overline primary--text">ADMIN CONSOLE</div>
        <h1 class="page-title">จัดการคำสั่งซื้อ</h1>
        <p class="muted-text mb-0">ดูรายการสั่งซื้อจากลูกค้าทั้งหมด</p>
      </v-col>
      <v-col cols="auto"><v-btn icon color="primary" aria-label="โหลดคำสั่งซื้ออีกครั้ง" title="โหลดอีกครั้ง" :loading="loading" @click="load"><v-icon>mdi-refresh</v-icon></v-btn></v-col>
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
      <v-data-table :headers="responsiveHeaders" :items="filteredOrders" :loading="loading" loading-text="กำลังโหลดคำสั่งซื้อ..." :no-data-text="orderEmptyText" class="admin-data-table">
        <template v-slot:item._id="{ item }"><code class="admin-order-id" :title="item._id">#{{ shortId(item._id) }}</code></template>
        <template v-slot:item.user="{ item }">{{ userName(item) }}</template>
        <template v-slot:item.quantity="{ item }">{{ totalQuantity(item) }} ชิ้น</template>
        <template v-slot:item.totalPrice="{ item }"><strong>{{ formatPrice(item.totalPrice) }} บาท</strong></template>
        <template v-slot:item.status="{ item }"><order-status :order="item" /></template>
        <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
        <template v-slot:item.actions="{ item }">
          <v-btn small text color="primary" aria-label="ดูรายละเอียดคำสั่งซื้อ" @click="viewDetails(item)">
            <v-icon left small>mdi-eye-outline</v-icon>ดูรายละเอียด
          </v-btn>
          <v-btn small text color="secondary" :disabled="!availableTransitions(item).length" @click="openStatusDialog(item)">
            <v-icon left small>mdi-swap-horizontal</v-icon>สถานะ
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="detailsDialog" max-width="760">
      <v-card v-if="selectedOrder" class="app-shell-card admin-dialog-card order-details-card">
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
            <v-col cols="12">
              <div class="order-meta-label">สถานะและประวัติ</div>
              <order-status :order="selectedOrder" show-history />
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
          <v-divider class="my-6" />
          <div class="section-heading text-subtitle-1 mb-3">ประวัติการเคลื่อนไหวสต็อก</div>
          <v-progress-linear v-if="movementsLoading" indeterminate color="primary" class="mb-4" />
          <v-alert v-if="movementError" type="error" dense outlined>{{ movementError }}</v-alert>
          <v-simple-table v-else-if="movements.length" dense>
            <template v-slot:default>
              <thead><tr><th>เวลา</th><th>สินค้า</th><th>รายการ</th><th>จำนวน</th><th>สต็อกก่อน → หลัง</th><th>ผู้ทำรายการ</th></tr></thead>
              <tbody>
                <tr v-for="movement in movements" :key="movement._id">
                  <td>{{ formatDate(movement.createdAt) }}</td>
                  <td>{{ movement.product?.name || 'สินค้าไม่พบ' }}</td>
                  <td>{{ movementLabel(movement.type) }}</td>
                  <td>{{ movement.quantityDelta > 0 ? '+' : '' }}{{ movement.quantityDelta }}</td>
                  <td>{{ movement.stockBefore }} → {{ movement.stockAfter }}</td>
                  <td>{{ movement.actor?.name || 'ผู้ใช้ไม่พบ' }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
          <div v-else-if="!movementsLoading" class="caption muted-text">ไม่มีประวัติสต็อกสำหรับ Order นี้ (อาจเป็น Order เก่าก่อนเปิดใช้ audit)</div>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="statusDialog" max-width="480">
      <v-card class="app-shell-card admin-dialog-card">
        <v-card-title>อัปเดตสถานะคำสั่งซื้อ</v-card-title>
        <v-card-text>
          <div v-if="statusOrder" class="muted-text mb-4">Order #{{ shortId(statusOrder._id) }}</div>
          <v-select v-model="nextStatus" :items="statusOptions" item-text="text" item-value="value" label="สถานะใหม่" outlined dense />
          <v-textarea v-model="statusNote" label="หมายเหตุ (ไม่บังคับ)" outlined rows="2" auto-grow counter="500" maxlength="500" />
          <v-alert v-if="statusError" type="error" dense outlined>{{ statusError }}</v-alert>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text :disabled="statusSaving" @click="statusDialog = false">ปิด</v-btn><v-btn color="primary" :loading="statusSaving" :disabled="!nextStatus" @click="saveStatus">บันทึกสถานะ</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" color="success" top>{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import orderService from '../services/orderService';
import { getApiError } from '../services/api';
import OrderStatus from '../components/orders/OrderStatus.vue';

const statusLabels = {
  confirmed: 'ยืนยันคำสั่งซื้อ',
  packing: 'เริ่มจัดเตรียม',
  shipped: 'จัดส่งแล้ว',
  delivered: 'ส่งถึงลูกค้าแล้ว',
  cancelled: 'ยกเลิกและคืนสต็อก',
};

const statusTransitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packing', 'cancelled'],
  packing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export default {
  name: 'AdminOrdersView',
  components: { OrderStatus },
  data: () => ({
    orders: [],
    loading: false,
    error: '',
    detailsDialog: false,
    selectedOrder: null,
    movements: [],
    movementsLoading: false,
    movementError: '',
    statusOrder: null,
    statusDialog: false,
    statusSaving: false,
    statusError: '',
    nextStatus: '',
    statusNote: '',
    snackbar: false,
    snackbarText: '',
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
      { text: 'ลูกค้า', value: 'user' },
      { text: 'จำนวนสินค้า', value: 'quantity', align: 'end' },
      { text: 'ยอดรวม', value: 'totalPrice', align: 'end' },
      { text: 'สถานะ', value: 'status', sortable: false },
      { text: 'วันที่สร้าง', value: 'createdAt', width: '170px' },
      { text: 'รายละเอียด', value: 'actions', sortable: false, align: 'center' },
    ],
  }),
  computed: {
    statusOptions() {
      if (!this.statusOrder) return [];
      return this.availableTransitions(this.statusOrder).map((value) => ({ text: statusLabels[value], value }));
    },
    responsiveHeaders() {
      if (this.$vuetify.breakpoint.xsOnly) {
        return this.headers.filter((header) => !['user', 'createdAt'].includes(header.value));
      }
      if (this.$vuetify.breakpoint.smAndDown) {
        return this.headers.filter((header) => header.value !== 'createdAt');
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
    async viewDetails(order) {
      this.selectedOrder = order;
      this.movements = [];
      this.movementError = '';
      this.detailsDialog = true;
      this.movementsLoading = true;
      try {
        const { data } = await orderService.listMovements({ order: order._id, limit: 100 });
        if (this.selectedOrder?._id === order._id) this.movements = data.data || [];
      } catch (error) {
        if (this.selectedOrder?._id === order._id) {
          this.movementError = getApiError(error, 'โหลดประวัติสต็อกไม่สำเร็จ');
        }
      } finally {
        if (this.selectedOrder?._id === order._id) this.movementsLoading = false;
      }
    },
    movementLabel(type) {
      return type === 'order_cancelled' ? 'คืนสต็อก' : 'ตัดสต็อก';
    },
    availableTransitions(order) {
      return statusTransitions[order.status || 'pending'] || [];
    },
    openStatusDialog(order) {
      this.statusOrder = order;
      this.nextStatus = '';
      this.statusNote = '';
      this.statusError = '';
      this.statusDialog = true;
    },
    async saveStatus() {
      if (!this.statusOrder || !this.nextStatus) return;
      this.statusSaving = true;
      this.statusError = '';
      try {
        await orderService.updateStatus(this.statusOrder._id, this.nextStatus, this.statusNote);
        const id = this.statusOrder._id;
        this.statusDialog = false;
        this.snackbarText = 'อัปเดตสถานะคำสั่งซื้อแล้ว';
        this.snackbar = true;
        await this.load();
        this.statusOrder = this.orders.find((order) => order._id === id) || null;
        if (this.selectedOrder?._id === id) {
          this.selectedOrder = this.orders.find((order) => order._id === id) || this.selectedOrder;
        }
      } catch (error) {
        this.statusError = getApiError(error, 'อัปเดตสถานะไม่สำเร็จ');
      } finally {
        this.statusSaving = false;
      }
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
