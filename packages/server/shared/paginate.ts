import { waitBasedOnRateLimit } from '../schedule'
import { PageInfo } from './PageInfo'
import type { RateLimit } from './RateLimit'

export async function paginate<Chunk>({
  paginator,
  getPage,
  getRateLimit,
  isErrorOnTMR,
}: {
  paginator: (nextCursor: string | null, dryRun: boolean) => Promise<Chunk>
  getPage: (data: Chunk) => PageInfo
  getRateLimit: (data: Chunk) => RateLimit
  isErrorOnTMR?: boolean
}) {
  // dry run
  const partialChunk = await paginator(null, true)
  let rateLimit = getRateLimit(partialChunk)

  if (!rateLimit.remaining) {
    if (isErrorOnTMR) {
      throw new Error(`Rate limit exceeded: ${rateLimit.resetAt}`)
    }
    return []
  }

  const chunk = await paginator(null, false)
  const result: Chunk[] = [chunk]
  let pageInfo = getPage(chunk)

  let cursor = pageInfo.endCursor

  while (pageInfo.hasNextPage) {
    const nextChunk = await paginator(cursor, false)
    result.push(nextChunk)
    rateLimit = getRateLimit(nextChunk)
    pageInfo = getPage(nextChunk)
    cursor = pageInfo.endCursor

    if (!rateLimit.remaining) {
      if (isErrorOnTMR) {
        throw new Error(`Rate limit exceeded: ${rateLimit.resetAt}`)
      }
      break
    }

    await waitBasedOnRateLimit(rateLimit)
  }

  return result
}
