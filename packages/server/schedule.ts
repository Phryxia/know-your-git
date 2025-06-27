import type { RateLimit } from './shared/RateLimit.ts'

export function getNextPeriod(
  remainPoint: number,
  remainTime: number,
  lastCost = 0,
) {
  return Math.floor((lastCost * remainTime) / remainPoint)
}

export async function wait(time: number) {
  return new Promise((resolve) => setTimeout(() => resolve(true), time))
}

export function waitBasedOnRateLimit(rateLimit: RateLimit) {
  const waitTime = getNextPeriod(
    rateLimit.remaining,
    new Date(rateLimit.resetAt).getTime() - Date.now(),
    rateLimit.cost,
  )
  return wait(waitTime)
}
