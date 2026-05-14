import { useQuery } from "@tanstack/react-query"
import { getActiveMesocycle, getInProgressWorkout, getSettings, recentSessions } from "../../../data/queries"
import { isDeloadWeek, currentWeek, isDeloadElapsed } from "../../../domain/mesocycle"
import { WORKOUT_ROTATION } from "../../../domain/plan"

export function useTodayState() {
  return useQuery({
    queryKey: ["today-state"],
    queryFn: async () => {
      const [meso, settings, inProgress, recent] = await Promise.all([
        getActiveMesocycle(),
        getSettings(),
        getInProgressWorkout(),
        recentSessions(3),
      ])
      if (!meso || !settings) throw new Error("App not seeded")
      const today = new Date()
      return {
        nextDay: WORKOUT_ROTATION[settings.rotationPointer],
        week: currentWeek(meso, today),
        weekLength: meso.weekLength,
        isDeload: isDeloadWeek(meso, today),
        deloadElapsed: isDeloadElapsed(meso, today),
        inProgress,
        recent,
      }
    },
  })
}
