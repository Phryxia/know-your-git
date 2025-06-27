import { octokit } from '../../octokit'
import { paginate } from '../../shared/paginate'
import { addDryRunToQuery, RateLimit } from '../../shared/RateLimit'
import {
  PullRequestsPerUserQuery,
  PullRequestsPerUserQueryResponse,
} from './queries'

export async function getPullRequestsPerUser() {
  paginate<PullRequestsPerUserQueryResponse & { rateLimit: RateLimit }>({
    paginator: (cursor, dryRun) =>
      octokit.graphql(addDryRunToQuery(PullRequestsPerUserQuery), {
        userId: 'exampleUserId',
        pageSize: 10,
        cursor,
        dryRun,
      }),
    // getPage: (data) => da,
  })
}

interface PullRequestLocalType {
  owner: string
  repository: string
  title: string
  number: number
}

type GroupByRepositoryResponse = Record<
  string,
  Record<string, Map<number, PullRequestLocalType>>
>

function groupByRepository({
  user: { pullRequests },
}: PullRequestsPerUserQueryResponse): GroupByRepositoryResponse {
  // think step by step
}
