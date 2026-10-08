<template>
  <v-container class="grade-page py-10">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="9">
        <section class="hero-section">
          <div class="eyebrow">
            <span class="eyebrow-dot" />
            SIMPLE • CLEAR • ACCURATE
          </div>
          <h1 class="hero-title">ระบบคำนวณ<span>เกรด</span></h1>
          <p class="hero-subtitle">กรอกคะแนนของคุณ แล้วค้นหาเกรดได้ทันที</p>
        </section>

        <v-row>
          <v-col cols="12" md="7">
            <v-card class="calculator-card pa-6 pa-sm-8" rounded="xl">
              <div class="card-heading">
                <div class="heading-icon purple-gradient">
                  <v-icon color="white">mdi-calculator-variant-outline</v-icon>
                </div>
                <div>
                  <h2 class="card-title">คำนวณเกรดของคุณ</h2>
                  <p class="card-description">กรอกคะแนนเต็ม 100 คะแนน</p>
                </div>
              </div>

              <v-form class="mt-8" @submit.prevent="calculate">
                <label class="input-label" for="score-input">คะแนนของคุณ</label>
                <v-text-field
                  id="score-input"
                  v-model="scoreInput"
                  outlined
                  hide-details="auto"
                  type="text"
                  inputmode="decimal"
                  placeholder="เช่น 79.5"
                  color="secondary"
                  class="score-field mt-2"
                  :error-messages="errorMessage"
                  @input="handleScoreInput"
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="secondary" class="mr-2">mdi-star-four-points-outline</v-icon>
                  </template>
                  <template v-slot:append>
                    <span class="score-suffix">/ 100</span>
                  </template>
                </v-text-field>

                <div class="button-row mt-5">
                  <v-btn
                    large
                    depressed
                    color="primary"
                    class="calculate-button"
                    @click="calculate"
                  >
                    <v-icon left>mdi-lightning-bolt-outline</v-icon>
                    คำนวณเกรด
                  </v-btn>
                  <v-btn
                    large
                    text
                    color="grey lighten-1"
                    class="reset-button"
                    @click="reset"
                  >
                    <v-icon left small>mdi-refresh</v-icon>
                    ล้างข้อมูล
                  </v-btn>
                </div>
              </v-form>

              <v-alert
                v-if="result"
                text
                dense
                type="success"
                class="success-message mt-6 mb-0"
              >
                คำนวณสำเร็จ! ตรวจสอบผลลัพธ์ของคุณได้ด้านล่าง
              </v-alert>
            </v-card>

            <v-card v-if="result" class="result-card mt-5 pa-6" rounded="xl">
              <div class="result-topline">
                <span class="result-label">
                  <v-icon small color="success" class="mr-1">mdi-check-circle-outline</v-icon>
                  ผลลัพธ์ของคุณ
                </span>
                <v-chip x-small color="success" text-color="white">COMPLETED</v-chip>
              </div>

              <div class="result-content">
                <div>
                  <div class="result-score">{{ formatScore(result.score) }} <small>/ 100</small></div>
                  <div class="result-caption">คะแนนที่กรอก</div>
                </div>
                <div class="result-divider" />
                <div class="grade-display">
                  <div class="grade-letter">{{ result.grade }}</div>
                  <div class="result-caption">เกรดที่ได้</div>
                </div>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="5">
            <v-card class="criteria-card pa-6 pa-sm-7" rounded="xl">
              <div class="card-heading compact">
                <div class="heading-icon blue-gradient">
                  <v-icon color="white">mdi-format-list-bulleted-square</v-icon>
                </div>
                <div>
                  <h2 class="card-title">เกณฑ์การให้เกรด</h2>
                  <p class="card-description">Grade criteria</p>
                </div>
              </div>

              <div class="criteria-list mt-6">
                <div
                  v-for="criterion in criteria"
                  :key="criterion.grade"
                  class="criteria-item"
                >
                  <div class="grade-badge" :class="`badge-${criterion.grade.toLowerCase()}`">
                    {{ criterion.grade }}
                  </div>
                  <div class="criteria-range">{{ criterion.range }}</div>
                  <v-icon small color="grey darken-1">mdi-chevron-right</v-icon>
                </div>
              </div>

              <div class="tip-box mt-6">
                <v-icon small color="secondary" class="mr-2">mdi-information-outline</v-icon>
                <span>ระบบจะไม่ปัดเศษคะแนนก่อนคำนวณ</span>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { calculateGrade, gradeCriteria } from '../utils/gradeCalculator'

export default {
  name: 'GradeCalculatorView',

  data() {
    return {
      scoreInput: '',
      errorMessage: '',
      result: null,
      criteria: gradeCriteria
    }
  },

  methods: {
    handleScoreInput() {
      this.errorMessage = ''
      this.result = null
    },

    calculate() {
      const value = this.scoreInput.trim()

      this.errorMessage = ''
      this.result = null

      if (!value) {
        this.errorMessage = 'กรุณากรอกคะแนน'
        return
      }

      const score = Number(value)

      if (!Number.isFinite(score)) {
        this.errorMessage = 'กรุณากรอกคะแนนเป็นตัวเลข'
        return
      }

      if (score < 0 || score > 100) {
        this.errorMessage = 'คะแนนต้องอยู่ระหว่าง 0 ถึง 100'
        return
      }

      this.result = {
        score,
        grade: calculateGrade(score)
      }
    },

    reset() {
      this.scoreInput = ''
      this.errorMessage = ''
      this.result = null
    },

    formatScore(score) {
      return Number.isInteger(score) ? score : score.toString()
    }
  }
}
</script>

<style scoped>
.grade-page {
  min-height: calc(100vh - 64px);
}

.hero-section {
  margin-bottom: 34px;
  text-align: center;
}

.eyebrow {
  align-items: center;
  color: #94a3b8;
  display: inline-flex;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
}

.eyebrow-dot {
  background: #38bdf8;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.85);
  height: 7px;
  margin-right: 10px;
  width: 7px;
}

.hero-title {
  color: #f8fafc;
  font-size: clamp(36px, 6vw, 56px);
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.15;
  margin: 14px 0 8px;
}

.hero-title span {
  background: linear-gradient(100deg, #a78bfa, #38bdf8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-left: 12px;
}

.hero-subtitle {
  color: #94a3b8;
  font-size: 15px;
  margin: 0;
}

.calculator-card,
.criteria-card,
.result-card {
  background: rgba(21, 29, 51, 0.82) !important;
  border: 1px solid rgba(148, 163, 184, 0.12) !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18) !important;
}

.calculator-card,
.criteria-card {
  height: 100%;
}

.card-heading {
  align-items: center;
  display: flex;
  gap: 15px;
}

.card-heading.compact {
  gap: 13px;
}

.heading-icon {
  align-items: center;
  border-radius: 13px;
  display: flex;
  height: 44px;
  justify-content: center;
  width: 44px;
}

.purple-gradient {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
}

.blue-gradient {
  background: linear-gradient(135deg, #38bdf8, #2563eb);
}

.card-title {
  color: #f8fafc;
  font-size: 17px;
  font-weight: 500;
  margin: 0;
}

.card-description {
  color: #64748b;
  font-size: 12px;
  margin: 2px 0 0;
}

.input-label {
  color: #cbd5e1;
  display: block;
  font-size: 13px;
  font-weight: 500;
}

.score-field >>> .v-input__slot {
  background: rgba(15, 23, 42, 0.55) !important;
  border-radius: 12px !important;
}

.score-field >>> input {
  color: #f8fafc !important;
  font-size: 20px;
  font-weight: 500;
}

.score-field >>> input::placeholder {
  color: #475569 !important;
  font-size: 15px;
}

.score-suffix {
  color: #64748b;
  font-size: 13px;
}

.button-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.calculate-button {
  background: linear-gradient(100deg, #8b5cf6, #6366f1) !important;
  border-radius: 10px;
  font-size: 13px;
  letter-spacing: 0;
  padding: 0 22px !important;
}

.calculate-button:hover {
  box-shadow: 0 8px 20px rgba(124, 58, 237, 0.35);
  transform: translateY(-1px);
}

.reset-button {
  font-size: 13px;
  letter-spacing: 0;
}

.success-message {
  background: rgba(52, 211, 153, 0.08) !important;
  font-size: 12px;
}

.result-card {
  background: linear-gradient(135deg, rgba(21, 29, 51, 0.96), rgba(30, 41, 75, 0.92)) !important;
}

.result-topline {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.result-label {
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 500;
}

.result-content {
  align-items: center;
  display: flex;
  justify-content: space-around;
  margin-top: 22px;
  text-align: center;
}

.result-score {
  color: #f8fafc;
  font-size: 30px;
  font-weight: 600;
  line-height: 1;
}

.result-score small {
  color: #64748b;
  font-size: 12px;
  font-weight: 400;
}

.result-caption {
  color: #64748b;
  font-size: 11px;
  margin-top: 8px;
}

.result-divider {
  background: rgba(148, 163, 184, 0.16);
  height: 48px;
  width: 1px;
}

.grade-letter {
  background: linear-gradient(135deg, #c084fc, #38bdf8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 42px;
  font-weight: 700;
  line-height: 0.85;
}

.criteria-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.criteria-item {
  align-items: center;
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.07);
  border-radius: 10px;
  display: flex;
  padding: 9px 12px;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.criteria-item:hover {
  border-color: rgba(56, 189, 248, 0.3);
  transform: translateX(3px);
}

.grade-badge {
  align-items: center;
  border-radius: 8px;
  display: flex;
  font-size: 13px;
  font-weight: 600;
  height: 30px;
  justify-content: center;
  margin-right: 13px;
  width: 30px;
}

.badge-a {
  background: rgba(168, 85, 247, 0.18);
  color: #c084fc;
}

.badge-b {
  background: rgba(59, 130, 246, 0.18);
  color: #60a5fa;
}

.badge-c {
  background: rgba(6, 182, 212, 0.18);
  color: #22d3ee;
}

.badge-d {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
}

.badge-f {
  background: rgba(244, 63, 94, 0.18);
  color: #fb7185;
}

.criteria-range {
  color: #cbd5e1;
  flex: 1;
  font-size: 13px;
}

.tip-box {
  align-items: flex-start;
  background: rgba(56, 189, 248, 0.06);
  border: 1px solid rgba(56, 189, 248, 0.12);
  border-radius: 10px;
  color: #7dd3fc;
  display: flex;
  font-size: 11px;
  line-height: 1.5;
  padding: 10px 12px;
}

@media (max-width: 600px) {
  .grade-page {
    padding-bottom: 36px !important;
    padding-top: 34px !important;
  }

  .hero-section {
    margin-bottom: 26px;
  }

  .hero-title {
    font-size: 38px;
  }

  .hero-title span {
    margin-left: 8px;
  }

  .button-row {
    align-items: stretch;
    flex-direction: column;
  }

  .calculate-button,
  .reset-button {
    width: 100%;
  }
}
</style>
