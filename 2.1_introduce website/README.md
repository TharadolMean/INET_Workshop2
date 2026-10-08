# Workshop 01 — Personal Profile Website

A responsive personal profile website built for Workshop 01 with Vue.js 2, Vuetify 2, and Vue Router 3.

## Tech stack

- Vue.js 2.7.16
- Vuetify 2.7.2
- Vue Router 3.6.5
- Vue CLI 5
- JavaScript with the Vue Options API

## Run locally

```bash
npm install
npm run serve
```

Open the local URL shown in the terminal, usually `http://localhost:8080`.

To create a production build:

```bash
npm run build
```

To run ESLint:

```bash
npm run lint
```

## Pages

- `/` — Home and profile introduction
- `/about` — Introduction, hobbies, likes, and dislikes
- `/education` — University and field of study
- `/strengths` — Personal strengths and technical skills

## Edit personal information

All editable profile information is centralized in:

```text
src/data/profile.js
```

Replace the placeholder values in that file with your own details. The Home, About, Education, and Strengths pages read from the same data source.

## Project structure

```text
src/
├── assets/styles/main.css
├── components/
│   ├── AppNavbar.vue
│   ├── InfoCard.vue
│   ├── ProfileCard.vue
│   └── SkillChips.vue
├── data/profile.js
├── plugins/vuetify.js
├── router/index.js
├── views/
│   ├── AboutView.vue
│   ├── EducationView.vue
│   ├── HomeView.vue
│   └── StrengthsView.vue
├── App.vue
└── main.js
```
# profile-workshop

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
