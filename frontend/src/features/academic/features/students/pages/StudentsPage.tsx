import { StudentsListView, useStudents } from '@/features/academic/features/students'

/**
 * Thin page for the "/students" route: calls the students module hook and
 * renders its list view. No fetch or complex state here.
 *
 * @author Fanny Mayorga | @date 20-09-2026
 */
export default function StudentsPage() {
  const students = useStudents()

  return <StudentsListView {...students} />
}