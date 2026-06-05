import { GRADE_COLOR } from '../data/talismans'

export function gradeColor(grade: string): string {
  return GRADE_COLOR[grade] ?? '#9CA3AF'
}
