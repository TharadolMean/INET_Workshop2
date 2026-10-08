<template>
  <v-card class="info-card glass-card hover-lift pa-6" height="100%">
    <div class="d-flex align-center mb-5">
      <v-avatar :color="accent" size="42" class="mr-4">
        <v-icon color="white" small>{{ icon }}</v-icon>
      </v-avatar>
      <h3 class="card-title">{{ title }}</h3>
    </div>

    <p v-if="description" class="muted-text mb-4">{{ description }}</p>

    <div v-if="items && items.length" class="item-list">
      <div v-for="(item, index) in items" :key="`${title}-${index}`" class="item-row">
        <span class="item-dot" :style="{ backgroundColor: accent }"></span>
        <span>{{ item }}</span>
      </div>
    </div>
    <p v-else class="muted-text mb-0">No information added yet.</p>
  </v-card>
</template>

<script>
export default {
  name: 'InfoCard',
  props: {
    title: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    items: {
      type: Array,
      default: () => []
    },
    description: {
      type: String,
      default: ''
    },
    accent: {
      type: String,
      default: '#8B5CF6'
    }
  }
}
</script>

<style scoped>
.card-title {
  color: #f8fafc;
  font-size: 1.1rem;
  font-weight: 700;
}

.item-list {
  display: grid;
  gap: 14px;
}

.item-row {
  align-items: flex-start;
  color: #dbe4f0;
  display: flex;
  font-size: 0.92rem;
  line-height: 1.5;
}

.item-dot {
  border-radius: 50%;
  flex: 0 0 7px;
  height: 7px;
  margin: 8px 12px 0 2px;
  opacity: 0.9;
  width: 7px;
}
</style>
