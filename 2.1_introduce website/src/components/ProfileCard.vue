<template>
  <v-card class="profile-card glass-card hover-lift pa-6 pa-md-8" height="100%">
    <div class="d-flex flex-column align-center text-center">
      <v-avatar size="156" class="profile-avatar mb-6">
        <v-img
          v-if="profile.profileImage && !imageFailed"
          :src="profile.profileImage"
          alt="Profile placeholder"
          @error="handleImageError"
        />
        <v-icon v-else size="72" color="deep-purple lighten-2">mdi-account</v-icon>
      </v-avatar>

      <div class="eyebrow mb-3">Personal profile</div>
      <h2 class="profile-name">{{ profile.fullName }}</h2>
      <div class="nickname mb-5">“{{ profile.nickname }}”</div>

      <div class="d-flex flex-wrap justify-center profile-tags">
        <v-chip small color="deep-purple lighten-1" text-color="white">
          <v-icon left small>mdi-school-outline</v-icon>
          {{ profile.university }}
        </v-chip>
        <v-chip small outlined color="light-blue lighten-2">
          <v-icon left small>mdi-code-tags</v-icon>
          {{ profile.major }}
        </v-chip>
      </div>
    </div>
  </v-card>
</template>

<script>
export default {
  name: 'ProfileCard',
  props: {
    profile: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      imageFailed: false
    }
  },
  methods: {
    handleImageError () {
      this.imageFailed = true
    }
  }
}
</script>

<style scoped>
.profile-card {
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-avatar {
  background: linear-gradient(135deg, #8b5cf6, #38bdf8);
  border: 5px solid rgba(196, 181, 253, 0.25);
  box-shadow: 0 0 0 10px rgba(139, 92, 246, 0.08);
}

.profile-name {
  color: #f8fafc;
  font-size: clamp(1.65rem, 3vw, 2.15rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}

.nickname {
  color: #a78bfa;
  font-size: 0.95rem;
}

.profile-tags {
  gap: 8px;
}

.profile-tags .v-chip {
  max-width: 100%;
}
</style>
