<template>
  <div class="page-shell">
    <v-container>
      <div class="mb-10">
        <div class="eyebrow mb-3">Learning journey</div>
        <h1 class="page-title mb-4">Education & direction.</h1>
        <p class="page-subtitle mb-0">
          The foundation I am building as I learn, practice, and grow.
        </p>
      </div>

      <v-row>
        <v-col cols="12" md="7">
          <v-card class="glass-card hover-lift pa-6 pa-md-8" height="100%">
            <div class="d-flex align-start">
              <v-avatar color="deep-purple lighten-1" size="54" class="mr-5">
                <v-icon color="white">mdi-school-outline</v-icon>
              </v-avatar>
              <div>
                <div class="eyebrow mb-2">Current education</div>
                <h2 class="education-title">{{ profile.university }}</h2>
                <div v-if="profile.faculty" class="faculty-name">{{ profile.faculty }}</div>
                <div class="major-name">{{ profile.major }}</div>
              </div>
            </div>

            <v-divider class="my-7 divider" />

            <div v-if="profile.educationDetails" class="education-detail">
              <v-icon color="light-blue lighten-2" class="mr-3">mdi-information-outline</v-icon>
              <span>{{ profile.educationDetails }}</span>
            </div>
            <div v-else class="muted-text">Education details will be added soon.</div>
          </v-card>
        </v-col>

        <v-col cols="12" md="5">
          <v-card class="glass-card pa-6 pa-md-8 timeline-card" height="100%">
            <div class="eyebrow mb-5">How I learn</div>
            <div v-for="step in learningSteps" :key="step.title" class="timeline-item">
              <div class="timeline-icon">
                <v-icon small color="deep-purple lighten-2">{{ step.icon }}</v-icon>
              </div>
              <div>
                <h3 class="timeline-title">{{ step.title }}</h3>
                <p class="muted-text mb-0">{{ step.description }}</p>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import profile from '@/data/profile'

export default {
  name: 'EducationView',
  data () {
    return {
      profile,
      learningSteps: [
        {
          title: 'Understand',
          description: 'Break a topic into small, clear ideas.',
          icon: 'mdi-lightbulb-outline'
        },
        {
          title: 'Practice',
          description: 'Turn what I learn into a working project.',
          icon: 'mdi-hammer-wrench'
        },
        {
          title: 'Improve',
          description: 'Reflect, iterate, and keep moving forward.',
          icon: 'mdi-trending-up'
        }
      ]
    }
  }
}
</script>

<style scoped>
.education-title {
  color: #f8fafc;
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}

.faculty-name {
  color: #c4b5fd;
  font-size: 0.95rem;
  margin-top: 10px;
}

.major-name {
  color: #a7b1c2;
  font-size: 0.9rem;
  margin-top: 4px;
}

.divider {
  border-color: rgba(148, 163, 184, 0.12) !important;
}

.education-detail {
  align-items: flex-start;
  color: #dbe4f0;
  display: flex;
  line-height: 1.6;
}

.timeline-card {
  border-left: 2px solid rgba(139, 92, 246, 0.3) !important;
}

.timeline-item {
  display: flex;
  gap: 16px;
  margin-bottom: 26px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-icon {
  align-items: center;
  background: rgba(139, 92, 246, 0.13);
  border-radius: 50%;
  display: flex;
  flex: 0 0 34px;
  height: 34px;
  justify-content: center;
}

.timeline-title {
  color: #f8fafc;
  font-size: 0.98rem;
  font-weight: 700;
  margin-bottom: 5px;
}
</style>
