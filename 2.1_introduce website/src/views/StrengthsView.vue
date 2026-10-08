<template>
  <div class="page-shell">
    <v-container>
      <div class="mb-10">
        <div class="eyebrow mb-3">What I bring</div>
        <h1 class="page-title mb-4">Strengths that keep me growing.</h1>
        <p class="page-subtitle mb-0">
          A mix of personal qualities and practical tools I use to turn challenges into progress.
        </p>
      </div>

      <v-row>
        <v-col cols="12" md="7">
          <InfoCard
            title="Personal strengths"
            icon="mdi-star-four-points-outline"
            :items="profile.strengths"
            accent="#8B5CF6"
          />
        </v-col>
        <v-col cols="12" md="5">
          <v-card class="glass-card pa-6 pa-md-8" height="100%">
            <div class="d-flex align-center mb-5">
              <v-avatar color="light-blue darken-1" size="42" class="mr-4">
                <v-icon color="white" small>mdi-tools</v-icon>
              </v-avatar>
              <h2 class="card-title">Technical toolkit</h2>
            </div>
            <SkillChips :skills="profile.technicalSkills" />
          </v-card>
        </v-col>
      </v-row>

      <v-card class="glass-card quote-card pa-6 pa-md-8 mt-6">
        <v-icon color="deep-purple lighten-2" size="36" class="mb-4">mdi-format-quote-open</v-icon>
        <p class="quote-text mb-3">
          “The best way to learn is to stay curious, start small, and keep building.”
        </p>
        <div class="eyebrow">Personal motto</div>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import InfoCard from '@/components/InfoCard.vue'
import SkillChips from '@/components/SkillChips.vue'
import profile from '@/data/profile'

export default {
  name: 'StrengthsView',
  components: {
    InfoCard,
    SkillChips
  },
  data () {
    return {
      profile
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

.quote-card {
  background: linear-gradient(120deg, rgba(139, 92, 246, 0.17), rgba(17, 24, 39, 0.8)) !important;
}

.quote-text {
  color: #e2e8f0;
  font-size: clamp(1.2rem, 3vw, 1.65rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.5;
  max-width: 760px;
}
</style>
