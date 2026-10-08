<template>
  <v-app>
    <v-app-bar app flat color="transparent" class="app-bar">
      <v-container class="d-flex align-center py-0">
        <div class="brand-mark">
          <v-icon color="white">mdi-chart-box-outline</v-icon>
        </div>
        <div class="ml-3">
          <div class="brand-name">Grade Calculator</div>
          <div class="brand-caption">LEARNING TOOL</div>
        </div>
        <v-spacer />
        <v-chip small outlined color="secondary" class="header-chip">
          <v-icon left small>mdi-school-outline</v-icon>
          Vue.js Workshop
        </v-chip>
      </v-container>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');

* {
  box-sizing: border-box;
}

html {
  overflow-y: auto;
}

body {
  margin: 0;
  background: #0b1020;
  color: #f8fafc;
  font-family: 'Prompt', sans-serif;
}

.v-application {
  background:
    radial-gradient(circle at 12% 8%, rgba(124, 58, 237, 0.18), transparent 28%),
    radial-gradient(circle at 88% 18%, rgba(14, 165, 233, 0.12), transparent 25%),
    #0b1020 !important;
  font-family: 'Prompt', sans-serif !important;
}

.v-application .headline,
.v-application .title,
.v-application .subtitle-1,
.v-application .body-1,
.v-application .body-2,
.v-application button,
.v-application input {
  font-family: 'Prompt', sans-serif !important;
}

.app-bar {
  border-bottom: 1px solid rgba(148, 163, 184, 0.08) !important;
}

.brand-mark {
  align-items: center;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
  display: flex;
  height: 40px;
  justify-content: center;
  width: 40px;
}

.brand-name {
  color: #f8fafc;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.brand-caption {
  color: #64748b;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.16em;
}

.header-chip {
  background: rgba(56, 189, 248, 0.04);
}

@media (max-width: 600px) {
  .header-chip {
    display: none;
  }
}
</style>
