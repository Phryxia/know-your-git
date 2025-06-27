import { Client, fetchExchange } from '@urql/core'
import { cacheExchange } from '@urql/exchange-graphcache'
import { makeFileStorage } from './FileStorage.ts'

export const Gql = new Client({
  url: process.env.GITHUB_API_URL ?? '',
  exchanges: [
    cacheExchange({
      storage: makeFileStorage(),
      // 출력 데이터에 기반한 캐싱
      keys: {
        User: (user: any) => user?.login ?? '',
        RateLimit: () => null,
        Repository: (repository: any) => repository?.name ?? '',
        PageInfo: () => null,
        PullRequestConnection: (prConnection: any) =>
          prConnection?.pageInfo?.startCursor,
        PullRequestEdge: () => null,
        PullRequest: (pr: any) => pr?.number,
      },
    }),
    fetchExchange,
  ],
  fetchOptions: () => ({
    headers: { Authorization: `Bearer ${process.env.PAT}` },
  }),
})
