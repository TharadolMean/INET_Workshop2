<template>
  <div class="admin-page dashboard-page">
    <v-row align="center" class="admin-page-header mb-3">
      <v-col>
        <div class="text-overline primary--text">ELECTROHUB / BUSINESS OVERVIEW</div>
        <h1 class="page-title">ภาพรวมร้านค้า</h1>
        <p class="muted-text mb-0">ติดตามคำสั่งซื้อ ลูกค้า สินค้า และสต็อก</p>
      </v-col>
      <v-col cols="auto">
        <v-btn outlined color="primary" class="mr-2" :loading="exporting" @click="downloadOrdersCsv">ส่งออก Order CSV</v-btn>
        <v-btn icon color="primary" :loading="loading" aria-label="โหลดข้อมูล Dashboard ใหม่" @click="load">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <v-card class="app-shell-card dashboard-filter-card pa-4 mb-5">
      <v-row align="center" dense>
        <v-col cols="12" sm="6" md="4">
          <v-text-field v-model="fromDate" type="date" label="ตั้งแต่วันที่ (UTC)" outlined dense hide-details />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-text-field v-model="toDate" type="date" label="ถึงวันที่ (UTC)" outlined dense hide-details />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-select v-model="interval" :items="intervalOptions" label="ช่วงกราฟ" outlined dense hide-details />
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-btn block color="primary" :loading="loading" @click="load">ใช้ตัวกรอง</v-btn>
        </v-col>
      </v-row>
      <div v-if="data" class="caption muted-text mt-3">แสดงข้อมูล {{ formatDateOnly(data.range.from) }} – {{ formatDateOnly(data.range.to) }}</div>
    </v-card>

    <v-alert v-if="error" type="error" outlined class="mb-5">
      {{ error }}
      <template #append><v-btn text @click="load">ลองใหม่</v-btn></template>
    </v-alert>
    <v-alert type="info" outlined dense class="mb-5 simulated-value-note">
      มูลค่าใน Dashboard เป็น <strong>มูลค่า Order จำลอง</strong> จากราคาที่บันทึกใน Order ไม่ใช่รายได้จากการชำระเงินจริง ระบบยังไม่มีการเชื่อมต่อ Payment Gateway
    </v-alert>

    <v-row v-if="loading && !data">
      <v-col v-for="n in 5" :key="n" cols="12" sm="6" lg="4" xl="2">
        <v-skeleton-loader type="card" class="app-shell-card" />
      </v-col>
    </v-row>

    <template v-else-if="data">
      <v-row class="mb-1">
        <v-col cols="12" sm="6" lg="4" xl="2">
          <v-card class="app-shell-card dashboard-stat-card">
            <div class="dashboard-stat-icon stat-orders"><v-icon color="primary">mdi-clipboard-list-outline</v-icon></div>
            <div class="dashboard-stat-label">Order ในช่วงวันที่</div>
            <div class="dashboard-stat-value">{{ number(data.metrics.orderCount) }}</div>
            <div class="dashboard-stat-foot">ยังไม่ยกเลิก {{ number(data.metrics.activeOrderCount) }} รายการ</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="2">
          <v-card class="app-shell-card dashboard-stat-card">
            <div class="dashboard-stat-icon stat-value"><v-icon color="success">mdi-cash-multiple</v-icon></div>
            <div class="dashboard-stat-label">มูลค่า Order จำลอง</div>
            <div class="dashboard-stat-value dashboard-stat-value--currency">{{ formatPrice(data.metrics.simulatedOrderValue) }}</div>
            <div class="dashboard-stat-foot">ไม่รวม Order ที่ยกเลิก</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="2">
          <v-card class="app-shell-card dashboard-stat-card">
            <div class="dashboard-stat-icon stat-customers"><v-icon color="secondary">mdi-account-group-outline</v-icon></div>
            <div class="dashboard-stat-label">ลูกค้าทั้งหมด</div>
            <div class="dashboard-stat-value">{{ number(data.metrics.customerCount) }}</div>
            <div class="dashboard-stat-foot">สมัครในช่วงนี้ {{ number(data.metrics.newCustomerCount) }} คน</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="2">
          <v-card class="app-shell-card dashboard-stat-card">
            <div class="dashboard-stat-icon stat-products"><v-icon color="primary">mdi-package-variant-closed</v-icon></div>
            <div class="dashboard-stat-label">สินค้าที่เปิดขาย</div>
            <div class="dashboard-stat-value">{{ number(data.metrics.activeProductCount) }}</div>
            <div class="dashboard-stat-foot">เก็บถาวร {{ number(data.metrics.archivedProductCount) }} รายการ</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="4" xl="2">
          <v-card class="app-shell-card dashboard-stat-card">
            <div class="dashboard-stat-icon stat-stock"><v-icon color="warning">mdi-warehouse</v-icon></div>
            <div class="dashboard-stat-label">สินค้าคงเหลือ</div>
            <div class="dashboard-stat-value">{{ number(data.metrics.totalStockUnits) }}</div>
            <div class="dashboard-stat-foot">ชิ้นรวมในคลัง</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" xl="8">
          <v-card class="app-shell-card dashboard-panel pa-5">
            <div class="d-flex flex-wrap align-center justify-space-between mb-4">
              <div>
                <div class="text-overline primary--text">ORDER TRENDS</div>
                <h2 class="section-heading">แนวโน้มคำสั่งซื้อ</h2>
              </div>
              <div class="dashboard-legend">
                <span><i class="legend-dot legend-orders" />Order ที่ไม่ยกเลิก</span>
                <span><i class="legend-dot legend-value" />มูลค่า Order จำลอง</span>
              </div>
            </div>
            <div v-if="data.trends.length" class="dashboard-trends" :class="{ 'dashboard-trends--dense': data.trends.length > 20 }">
              <div v-for="(trend, index) in data.trends" :key="trend.period" class="dashboard-trend-column">
                <div class="trend-bars" :title="trendTitle(trend)">
                  <div class="trend-bar trend-bar-orders" :style="{ height: `${barHeight(trend.activeOrderCount, maxTrendOrders)}%` }" />
                  <div class="trend-bar trend-bar-value" :style="{ height: `${barHeight(trend.simulatedOrderValue, maxTrendValue)}%` }" />
                </div>
                <div class="trend-period">{{ showPeriod(index) ? trend.period : '' }}</div>
              </div>
            </div>
            <div v-else class="dashboard-empty">ไม่มีข้อมูลคำสั่งซื้อในช่วงวันที่นี้</div>
            <div class="dashboard-trend-summary muted-text caption mt-3">
              <span>สูงสุดต่อช่วง: {{ number(maxTrendOrders) }} Order</span>
              <span>มูลค่าสูงสุด: {{ formatPrice(maxTrendValue) }} บาท</span>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" xl="4">
          <v-card class="app-shell-card dashboard-panel pa-5 dashboard-status-panel">
            <div class="text-overline primary--text">ORDER STATUS</div>
            <h2 class="section-heading mb-4">สัดส่วนสถานะ</h2>
            <div v-if="data.statusDistribution.length">
              <div v-for="item in statusRows" :key="item.status" class="dashboard-status-row">
                <div class="d-flex justify-space-between mb-1"><span>{{ statusLabel(item.status) }}</span><strong>{{ number(item.count) }}</strong></div>
                <v-progress-linear :value="statusPercent(item.count)" :color="statusColor(item.status)" rounded height="7" />
              </div>
            </div>
            <div v-else class="dashboard-empty">ไม่มี Order ในช่วงวันที่นี้</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" lg="6">
          <v-card class="app-shell-card dashboard-panel">
            <div class="dashboard-panel-heading pa-5 pb-2">
              <div class="text-overline primary--text">BEST SELLERS</div>
              <h2 class="section-heading">สินค้าขายดี</h2>
              <div class="caption muted-text">นับจากจำนวนชิ้นใน Order ที่ไม่ถูกยกเลิก</div>
            </div>
            <v-data-table :headers="bestSellerHeaders" :items="data.bestSellingProducts" :items-per-page="5" hide-default-footer class="dashboard-table" no-data-text="ไม่มีข้อมูลสินค้าขายดีในช่วงวันที่นี้">
              <template v-slot:item.quantity="{ item }"><strong>{{ number(item.quantity) }} ชิ้น</strong></template>
              <template v-slot:item.simulatedOrderValue="{ item }">{{ formatPrice(item.simulatedOrderValue) }} บาท</template>
            </v-data-table>
          </v-card>
        </v-col>
        <v-col cols="12" lg="6">
          <v-card class="app-shell-card dashboard-panel">
            <div class="dashboard-panel-heading pa-5 pb-2 d-flex align-center justify-space-between">
              <div>
                <div class="text-overline warning--text">INVENTORY ALERTS</div>
                <h2 class="section-heading">สินค้าใกล้หมด</h2>
              </div>
              <div class="d-flex align-center"><v-chip color="warning" small class="mr-2">{{ number(data.metrics.lowStockCount) }} รายการ</v-chip><v-btn small text color="warning" :to="{ name: 'admin-products', query: { stock: 'low' } }">จัดการสต็อก</v-btn></div>
            </div>
            <div class="px-5 pb-4 dashboard-stock-summary">
              <span>หมดสต็อก <strong class="error--text">{{ number(data.metrics.outOfStockCount) }}</strong></span>
              <span>แจ้งเตือนเมื่อเหลือไม่เกิน {{ data.metrics.lowStockThreshold }} ชิ้น</span>
            </div>
            <v-list v-if="data.lowStockProducts.length" dense class="dashboard-stock-list">
              <v-list-item v-for="product in data.lowStockProducts" :key="product._id">
                <v-list-item-content><v-list-item-title>{{ product.name }}</v-list-item-title><v-list-item-subtitle>{{ formatPrice(product.price) }} บาท</v-list-item-subtitle></v-list-item-content>
                <v-list-item-action><v-chip small :color="product.stock === 0 ? 'error' : 'warning'">{{ product.stock === 0 ? 'หมด' : `${product.stock} ชิ้น` }}</v-chip></v-list-item-action>
              </v-list-item>
            </v-list>
            <div v-else class="dashboard-empty mx-5 mb-5">ไม่มีสินค้าในระดับสต็อกต่ำ</div>
          </v-card>
        </v-col>
      </v-row>

      <v-card class="app-shell-card dashboard-panel mb-6">
        <div class="dashboard-panel-heading pa-5 pb-2">
          <div class="text-overline primary--text">RECENT ORDERS</div>
          <h2 class="section-heading">คำสั่งซื้อล่าสุดในช่วงวันที่</h2>
        </div>
        <v-data-table :headers="recentHeaders" :items="data.recentOrders" :items-per-page="8" hide-default-footer class="dashboard-table" no-data-text="ไม่มี Order ในช่วงวันที่นี้">
          <template v-slot:item._id="{ item }"><code>#{{ shortId(item._id) }}</code></template>
          <template v-slot:item.customer="{ item }">{{ item.customer?.name || item.customer?.email || 'ผู้ใช้ไม่พบ' }}</template>
          <template v-slot:item.status="{ item }"><order-status :order="item" /></template>
          <template v-slot:item.totalPrice="{ item }">{{ formatPrice(item.totalPrice) }} บาท</template>
          <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
        </v-data-table>
      </v-card>
    </template>
  </div>
</template>

<script>
import dashboardService from '../services/dashboardService';
import reportService from '../services/reportService';
import OrderStatus from '../components/orders/OrderStatus.vue';
import { getApiError } from '../services/api';

const statusLabels = {
  pending: 'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  packing: 'กำลังจัดเตรียม',
  shipped: 'จัดส่งแล้ว',
  delivered: 'ส่งถึงแล้ว',
  cancelled: 'ยกเลิกแล้ว',
};

const localDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const defaultFromDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return localDateValue(date);
};

export default {
  name: 'AdminDashboardView',
  components: { OrderStatus },
  data: () => ({
    data: null,
    loading: false,
    exporting: false,
    error: '',
    fromDate: defaultFromDate(),
    toDate: localDateValue(new Date()),
    interval: 'day',
    intervalOptions: [
      { text: 'รายวัน', value: 'day' },
      { text: 'รายเดือน', value: 'month' },
    ],
    bestSellerHeaders: [
      { text: 'สินค้า', value: 'name' },
      { text: 'ขายได้', value: 'quantity', align: 'end' },
      { text: 'มูลค่า Order จำลอง', value: 'simulatedOrderValue', align: 'end' },
    ],
    recentHeaders: [
      { text: 'Order', value: '_id' },
      { text: 'ลูกค้า', value: 'customer' },
      { text: 'สถานะ', value: 'status' },
      { text: 'มูลค่า Order จำลอง', value: 'totalPrice', align: 'end' },
      { text: 'วันที่', value: 'createdAt' },
    ],
  }),
  computed: {
    maxTrendOrders() {
      return Math.max(0, ...(this.data?.trends || []).map((item) => item.activeOrderCount));
    },
    maxTrendValue() {
      return Math.max(0, ...(this.data?.trends || []).map((item) => item.simulatedOrderValue));
    },
    statusRows() {
      const counts = new Map(this.data.statusDistribution.map((item) => [item.status, item.count]));
      return ['pending', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled']
        .map((status) => ({ status, count: counts.get(status) || 0 }));
    },
    totalStatusOrders() {
      return this.statusRows.reduce((sum, item) => sum + item.count, 0);
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
        const { data } = await dashboardService.getOverview({
          from: this.fromDate,
          to: this.toDate,
          interval: this.interval,
        });
        this.data = data.data;
      } catch (error) {
        this.error = getApiError(error, 'โหลด Dashboard ไม่สำเร็จ');
      } finally {
        this.loading = false;
      }
    },
    async downloadOrdersCsv() {
      this.exporting = true;
      try {
        const { data } = await reportService.exportOrders({ from: this.fromDate, to: this.toDate });
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `electrohub-orders-${this.fromDate}-to-${this.toDate}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } catch (error) {
        this.error = getApiError(error, 'ส่งออกรายงานไม่สำเร็จ');
      } finally { this.exporting = false; }
    },
    number(value) {
      return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(value || 0);
    },
    formatPrice(value) {
      return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value || 0);
    },
    formatDate(value) {
      return value ? new Date(value).toLocaleString('th-TH') : '-';
    },
    formatDateOnly(value) {
      return value ? new Date(`${value}T00:00:00Z`).toLocaleDateString('th-TH', { timeZone: 'UTC' }) : '-';
    },
    shortId(value) {
      return value ? `${value.slice(0, 8)}…` : '-';
    },
    statusLabel(status) {
      return statusLabels[status] || 'ไม่ทราบสถานะ';
    },
    statusColor(status) {
      return {
        pending: 'warning', confirmed: 'primary', packing: 'indigo',
        shipped: 'secondary', delivered: 'success', cancelled: 'error',
      }[status] || 'grey';
    },
    statusPercent(count) {
      return this.totalStatusOrders ? (count / this.totalStatusOrders) * 100 : 0;
    },
    barHeight(value, max) {
      if (!value || !max) return 0;
      return Math.max(4, (value / max) * 100);
    },
    showPeriod(index) {
      const length = this.data?.trends.length || 0;
      const step = Math.max(1, Math.ceil(length / 8));
      return index % step === 0 || index === length - 1;
    },
    trendTitle(trend) {
      return `${trend.period}: ${this.number(trend.activeOrderCount)} Order, มูลค่า Order จำลอง ${this.formatPrice(trend.simulatedOrderValue)} บาท`;
    },
  },
};
</script>
