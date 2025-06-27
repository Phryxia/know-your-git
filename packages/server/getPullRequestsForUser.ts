import { gql, OperationResult } from '@urql/core'
import { Gql } from './graphql.ts'
import { getNextPeriod, wait } from './schedule.ts'
import { RateLimitFragment } from './shared/RateLimit.ts'
import type { PullRequest } from './types/pullRequest.ts'

export function createQuery(isFlying: boolean) {
  return gql`
${isFlying ? RateLimitFragment : ''}
query GetPullRequestsForUser($login: String!, $cursor: String${isFlying ? ', $dryRun: Boolean' : ''}) {
  ${isFlying ? '...RateLimitFragment' : ''}
  user(login: $login) {
    login
    pullRequests(first: 100, after: $cursor) {
      pageInfo {
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          id
          title
          repository {
            owner {
              id
              login
            }
            name
          }
          number
          createdAt
          updatedAt
          body
          state
          baseRefOid
          headRefOid
        }
      }
    }
  }
}`
}

const LocalQuery = createQuery(false)
const ApiQuery = createQuery(true)

interface RateLimitResponse {
  rateLimit: {
    limit: number
    remaining: number
    resetAt: string
    cost: number
  }
}

interface QueryResponse {
  user: {
    login: string
    pullRequests: {
      pageInfo: {
        startCursor: string
        endCursor: string | null
      }
      edges: {
        cursor: string
        node: {
          title: string
          repository: {
            owner: {
              id: string
              login: string
            }
            name: string
          }
          number: number
          createdAt: string
          updatedAt: string
          body: string
          state: 'OPEN' | 'CLOSE' | 'MERGED'
          baseRefOid: string
          headRefOid: string
        }
      }[]
    }
  }
}

type TotalResponse = QueryResponse & RateLimitResponse

export async function getPullRequestsForRepository(
  login: string,
): Promise<PullRequest[]> {
  let remainPoint = Infinity
  let remainTime = 0
  let lastCost = 0
  let response: TotalResponse | undefined = undefined
  let cursor: string | null = null

  if (!remainPoint) {
    return []
  }

  let prs: any[] = []

  do {
    const cachedResult: OperationResult<TotalResponse, any> | null =
      Gql.readQuery<TotalResponse>(LocalQuery, {
        login,
        cursor,
      })

    if (cachedResult?.operation.context.meta?.cacheOutcome === 'hit') {
      response = cachedResult.data!
    } else {
      const { data, error } = await Gql.query<TotalResponse>(ApiQuery, {
        login,
        cursor,
        dryRun: false,
      }).toPromise()

      if (!data) {
        throw error ?? new Error('Unknown Error')
      }

      response = data

      remainPoint = response.rateLimit.remaining
      remainTime = new Date(response.rateLimit.resetAt).getTime() - Date.now()
      lastCost = response.rateLimit.cost

      const nextPeriod = getNextPeriod(remainPoint, remainTime, lastCost)

      console.log(`wait for ${nextPeriod}`)

      if (nextPeriod) {
        await wait(nextPeriod)
      }
      console.error(response.user.pullRequests.pageInfo.endCursor)
    }

    if (!response) {
      throw new Error('Unknown Error')
    }

    prs = response.user.pullRequests.edges.concat(prs)

    cursor = response.user.pullRequests.pageInfo.endCursor
  } while (remainPoint && cursor)

  return prs.map(transformEdgeToPullRequest)
}

function transformEdgeToPullRequest(
  edge: QueryResponse['user']['pullRequests']['edges'][number],
): PullRequest {
  return {
    title: edge.node.title,
    body: edge.node.body,
    number: edge.node.number,
    repository: {
      owner: edge.node.repository.owner.login,
      name: edge.node.repository.name,
    },
    baseRefOid: edge.node.baseRefOid,
    headRefOid: edge.node.headRefOid,
  }
}
