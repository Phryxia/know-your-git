export const PullRequestsPerUserQuery = `
query PullRequestsPerUserQuery($userId: String!, $pageSize: Int!, $cursor: String) {
  user(login: $userId) {
    pullRequests(first: $pageSize, after: $cursor) {
      pageInfo {
        endCursor
      }
      edges {
        node {
          title
          repository {
            owner {
              login
            }
            name
          }
          number
        }
      }
    }
  }
}
`

export interface PullRequestsPerUserQueryResponse {
  user: {
    pullRequests: {
      pageInfo: {
        endCursor: string | null
      }
      edges: {
        node: {
          title: string
          repository: {
            owner: {
              login: string
            }
            name: string
          }
          number: number
        }
      }[]
    }
  }
}
