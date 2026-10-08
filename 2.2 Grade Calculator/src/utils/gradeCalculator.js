export const gradeCriteria = [
  { grade: 'A', range: '80–100', min: 80, color: 'purple' },
  { grade: 'B', range: '70–79.99', min: 70, color: 'blue' },
  { grade: 'C', range: '60–69.99', min: 60, color: 'cyan' },
  { grade: 'D', range: '50–59.99', min: 50, color: 'orange' },
  { grade: 'F', range: '0–49.99', min: 0, color: 'red' }
]

export function calculateGrade(score) {
  if (score >= 80) return 'A'
  if (score >= 70) return 'B'
  if (score >= 60) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}
