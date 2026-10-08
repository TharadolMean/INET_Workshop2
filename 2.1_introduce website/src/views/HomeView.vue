<template>
  <div class="page-shell">
    <v-container>
      <v-row align="center" class="hero-row">
        <v-col cols="12" md="7" class="py-0">
          <div class="eyebrow mb-4">Welcome to my corner of the web</div>
          <h1 class="hero-title mb-5">
            Building ideas into
            <span>meaningful experiences.</span>
          </h1>
          <p class="hero-description mb-8">
            {{ profile.introduction }}
            This is a simple space to learn more about my background, interests, and strengths.
          </p>

          <div class="d-flex flex-wrap hero-actions">
            <v-btn
              color="deep-purple lighten-1"
              class="action-button"
              large
              depressed
              @click="goTo('/about')"
            >
              Explore my profile
              <v-icon right>mdi-arrow-right</v-icon>
            </v-btn>
            <v-btn
              outlined
              color="light-blue lighten-2"
              class="action-button"
              large
              @click="goTo('/strengths')"
            >
              View strengths
            </v-btn>
          </div>

          <div class="quick-facts mt-10">
            <div class="quick-fact">
              <v-icon color="deep-purple lighten-2" class="mr-3">mdi-map-marker-outline</v-icon>
              <div>
                <div class="fact-label">Currently studying at</div>
                <div class="fact-value">{{ profile.university }}</div>
              </div>
            </div>
            <div class="quick-fact">
              <v-icon color="light-blue lighten-2" class="mr-3">mdi-book-open-page-variant-outline</v-icon>
              <div>
                <div class="fact-label">Focused on</div>
                <div class="fact-value">{{ profile.major }}</div>
              </div>
            </div>
          </div>
        </v-col>

        <v-col cols="12" md="5" class="pt-10 pt-md-0">
          <ProfileCard :profile="profile" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import ProfileCard from '@/components/ProfileCard.vue'
import profile from '@/data/profile'

export default {
  name: 'HomeView',
  components: {
    ProfileCard
  },
  data () {
    return {
      profile
    }
  },
  methods: {
    goTo (path) {
      this.$router.push(path)
    }
  }
}
</script>

<style scoped>
.hero-row {
  min-height: calc(100vh - 168px);
}

.hero-title {
  color: #f8fafc;
  font-size: clamp(2.8rem, 6vw, 5.4rem);
  font-weight: 800;
  letter-spacing: -0.065em;
  line-height: 1.02;
  max-width: 820px;
}

.hero-title span {
  background: linear-gradient(100deg, #c4b5fd, #7dd3fc);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-description {
  color: #a7b1c2;
  font-size: 1.05rem;
  line-height: 1.8;
  max-width: 620px;
}

.hero-actions {
  gap: 12px;
}

.action-button {
  border-radius: 10px;
  text-transform: none;
}

.quick-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 26px;
}

.quick-fact {
  align-items: center;
  display: flex;
  min-width: 210px;
}

.fact-label {
  color: #7f8ba1;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.fact-value {
  color: #dbe4f0;
  font-size: 0.88rem;
  margin-top: 3px;
}

@media (max-width: 600px) {
  .hero-row {
    min-height: auto;
  }

  .hero-title {
    font-size: 2.9rem;
  }

  .hero-actions .v-btn {
    width: 100%;
  }

  .quick-facts {
    display: grid;
    gap: 18px;
  }
}
</style>
