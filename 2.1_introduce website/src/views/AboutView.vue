<template>
  <div class="page-shell">
    <v-container>
      <div class="mb-10">
        <div class="eyebrow mb-3">A little more about me</div>
        <h1 class="page-title mb-4">The things that make me, me.</h1>
        <p class="page-subtitle mb-0">
          Get to know my interests, preferences, and the details behind the profile.
        </p>
      </div>

      <v-row>
        <v-col cols="12" md="6">
          <InfoCard
            title="Introduction"
            icon="mdi-account-heart-outline"
            :items="[profile.introduction]"
            accent="#8B5CF6"
          />
        </v-col>
        <v-col cols="12" md="6">
          <InfoCard
            title="Hobbies"
            icon="mdi-palette-outline"
            :items="profile.hobbies"
            accent="#38BDF8"
          />
        </v-col>
        <v-col cols="12" md="6">
          <InfoCard
            title="Things I like"
            icon="mdi-heart-outline"
            :items="profile.likes"
            accent="#F472B6"
          />
        </v-col>
        <v-col cols="12" md="6">
          <InfoCard
            title="Things I avoid"
            icon="mdi-close-circle-outline"
            :items="profile.dislikes"
            accent="#F59E0B"
          />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import InfoCard from '@/components/InfoCard.vue'
import profile from '@/data/profile'

export default {
  name: 'AboutView',
  components: {
    InfoCard
  },
  data () {
    return {
      profile
    }
  }
}
</script>
