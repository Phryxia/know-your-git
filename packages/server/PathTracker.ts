/*
  Just random tree
*/
export class PathTracker {
  private aliases: Record<string, string> = {}

  assign(oldPath: string, newPath: string) {
    this.aliases[oldPath] = newPath
  }

  getLatestPath(path: string) {
    while (this.aliases[path]) {
      path = this.aliases[path]
    }
    return path
  }
}
