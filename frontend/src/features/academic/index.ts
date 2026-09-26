export { default as TermsTable } from './components/TermsTable'
export { useTerms } from './hooks/useTerms'
export {
  fetchCourses,
  fetchTerms,
  fetchTermsPaginated,
  createTerm,
  updateTerm,
  deleteTerm,
} from './services/academic.service'