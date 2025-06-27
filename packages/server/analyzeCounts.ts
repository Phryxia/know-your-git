import { PathTracker } from './PathTracker.ts'
import { AnalyzedDiffs } from './services/git.ts'

export function mergeAnalyzedDiffs(diffs: AnalyzedDiffs[]) {
  // connect same file path
  const tracker = new PathTracker()

  for (const diff of diffs) {
    for (const [from, to] of diff.aliases) {
      tracker.assign(from, to)
    }
  }

  // merge non-representative path into representative one
  const mergedCounts = new Map<string, number>()
  for (const diff of diffs) {
    for (const [path, count] of diff.counts.entries()) {
      const latestPath = tracker.getLatestPath(path)

      mergedCounts.set(latestPath, (mergedCounts.get(latestPath) ?? 0) + count)
    }
  }

  return mergedCounts
}
