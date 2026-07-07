export type PlanType = "free" | "pro"
export const PLAN_LIMITS = {
  free: {
    resume_tailor_per_month: 5,
    coach_messages_per_month: 25,
    job_scans_per_month: 10,
    interview_sessions_per_month: 5,
    cover_letters_per_month: 3,
  },
  pro: {
    resume_tailor_per_month: 150,
    coach_messages_per_month: 1000,
    job_scans_per_month: 300,
    interview_sessions_per_month: 999999, // effectively unlimited
    cover_letters_per_month: 100,
  },
} as const

export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}

