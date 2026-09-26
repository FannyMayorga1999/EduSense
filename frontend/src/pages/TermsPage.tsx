import { TermsTable, useTerms } from '@/features/academic'

/**
 * Thin page for the "/terms" route: calls the academic terms module hook and
 * renders its table view. No fetch or complex state here.
 *
 * @author Fanny Mayorga | @date 20-09-2026
 */
export default function TermsPage() {
  const terms = useTerms()

  return <TermsTable {...terms} />
}