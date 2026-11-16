export { SessionHistoryCard } from './components/SessionHistoryCard';
export { CompletedSessionDrawer } from './components/CompletedSessionDrawer';
export { EffortScale } from './components/EffortScale';
export { FeedbackTags } from './components/FeedbackTags';
export { PerformedFields } from './components/PerformedFields';
export { SessionCalendar } from './components/SessionCalendar';
export { SessionCalendarFilter } from './components/SessionCalendarFilter';
export { SuggestedDays } from './components/SuggestedDays';
export { ExerciseProgressions } from './components/ExerciseProgressions';
export { dayKey, formatDayLabel } from '@/domain/week/dates';
export {
  useCompleteSession,
  useUpdateCompletedSession,
} from './hooks/useCompleteSession';
export { useClientSessions } from './hooks/useClientSessions';
export { ClientTabBar } from './components/ClientTabBar';
export { GuidedSession } from './components/GuidedSession';
export { ClientNavRail } from './components/ClientNavRail';
export { CLIENT_CONTENT_MAX_W, CLIENT_GRID_MAX_W } from './constants';
export { getRelativeDate } from '@/domain/week/dates';
export {
  getSessionSummary,
  getSessionBlockTypes,
  getCompletedSessionBlockTypes,
} from '@/domain/session/measure';
export { getEffortSummary } from '@/domain/history/effort';
export { buildGuidedSteps } from './guidedSteps';
export type { GuidedStep } from './guidedSteps';
export {
  buildLastPerformanceIndex,
  formatLastPerformance,
  performedKey,
} from '@/domain/history/lastPerformance';
export type { LastPerformance } from '@/domain/history/lastPerformance';
export { lifetimeTotal } from './counts';
