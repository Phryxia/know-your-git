import { gql } from '@urql/core'

export const RateLimitFragment = gql`
  fragment RateLimitFragment on Query {
    rateLimit(dryRun: $dryRun) {
      limit
      cost
      remaining
      resetAt
    }
  }
`

export interface RateLimit {
  limit: number
  cost: number
  remaining: number
  resetAt: string
}

export function addDryRunToQuery(query: string) {
  const parameterPosition = findQueryParameters(query)
  const dryRunParameter = 'dryRun: Boolean = false'

  if (!parameterPosition) {
    const indexOfQuery = query.indexOf('query')
    if (indexOfQuery === -1) {
      throw new Error(
        'Query does not contain a valid GraphQL query definition.',
      )
    }

    const startIndex = query.indexOf('{', indexOfQuery)

    return (
      query.slice(0, startIndex) +
      `(${dryRunParameter}) ` +
      query.slice(startIndex)
    )
  }

  const { startIndex, length } = parameterPosition
  const originalParameters = query.slice(startIndex, startIndex + length)
  const parameterWithComma = `${originalParameters}${length ? ', ' : ''}${dryRunParameter}`

  return (
    query.slice(0, startIndex) +
    parameterWithComma +
    query.slice(startIndex + length)
  )
}

function findQueryParameters(query: string) {
  const parameters = query.match(/query\s*\(([^)]*)\)/)?.[1]

  if (!parameters) {
    return null
  }

  return {
    startIndex: query.indexOf(parameters),
    length: parameters.length,
  }
}
