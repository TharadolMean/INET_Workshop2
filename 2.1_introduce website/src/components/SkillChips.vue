<template>
  <div>
    <div v-if="skills && skills.length" class="skill-list">
      <v-chip
        v-for="skill in skills"
        :key="skill"
        class="skill-chip"
        outlined
        color="deep-purple lighten-2"
      >
        <v-icon left x-small>mdi-check</v-icon>
        {{ skill }}
      </v-chip>
    </div>
    <p v-else class="muted-text mb-0">No skills added yet.</p>
  </div>
</template>

<script>
export default {
  name: 'SkillChips',
  props: {
    skills: {
      type: Array,
      default: () => []
    }
  }
}
</script>

<style scoped>
.skill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.skill-chip {
  background: rgba(139, 92, 246, 0.08);
  font-size: 0.82rem;
}
</style>
