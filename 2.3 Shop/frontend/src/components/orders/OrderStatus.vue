<template>
  <div>
    <v-chip small :color="statusColor(status)" :text-color="status === 'cancelled' ? 'white' : undefined">
      {{ statusLabel(status) }}
    </v-chip>
    <div v-if="showHistory" class="mt-5">
      <div class="text-subtitle-1 font-weight-medium mb-2">ประวัติสถานะ</div>
      <v-timeline v-if="history.length" dense class="order-status-timeline">
        <v-timeline-item
          v-for="(entry, index) in history"
          :key="`${entry.status}-${entry.changedAt}-${index}`"
          :color="statusColor(entry.status)"
          small
        >
          <div class="font-weight-medium">{{ statusLabel(entry.status) }}</div>
          <div class="caption muted-text">{{ formatDate(entry.changedAt) }}<span v-if="entry.changedBy"> · {{ entry.changedBy.name }}</span></div>
          <div v-if="entry.note" class="caption">{{ entry.note }}</div>
        </v-timeline-item>
      </v-timeline>
      <div v-else class="caption muted-text">Order เดิม ไม่มีประวัติสถานะก่อนติดตั้งระบบติดตาม</div>
    </div>
  </div>
</template>

<script>
const labels = {
  pending: 'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  packing: 'กำลังจัดเตรียม',
  shipped: 'จัดส่งแล้ว',
  delivered: 'ส่งถึงแล้ว',
  cancelled: 'ยกเลิกแล้ว',
};

export default {
  name: 'OrderStatus',
  props: {
    order: { type: Object, required: true },
    showHistory: { type: Boolean, default: false },
  },
  computed: {
    status() {
      return this.order.status || 'pending';
    },
    history() {
      return Array.isArray(this.order.statusHistory) ? this.order.statusHistory : [];
    },
  },
  methods: {
    statusLabel(status) {
      return labels[status] || 'ไม่ทราบสถานะ';
    },
    statusColor(status) {
      return {
        pending: 'warning',
        confirmed: 'primary',
        packing: 'indigo',
        shipped: 'secondary',
        delivered: 'success',
        cancelled: 'error',
      }[status] || 'grey';
    },
    formatDate(value) {
      return value ? new Date(value).toLocaleString('th-TH') : '-';
    },
  },
};
</script>
