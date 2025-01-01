// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

import type {GitRepoInfo} from '@dada78641/repo-version'

/**
 * Returns a URL for the current Git commit hash.
 */
export function formatGitCommitUrl(gitRepoInfo: GitRepoInfo | null, repositoryUrl: string): string | null {
  if (gitRepoInfo === null || (gitRepoInfo.branch === null && gitRepoInfo.shortHash === null)) {
    return null
  }
  return `${repositoryUrl}/commit/${gitRepoInfo.hash}`
}

/**
 * Formats a Git version string.
 */
export function formatGitVersion(gitRepoInfo: GitRepoInfo | null) {
  if (gitRepoInfo === null || (gitRepoInfo.branch === null && gitRepoInfo.shortHash === null)) {
    return null
  }
  const {branch, shortHash, commits} = gitRepoInfo
  if (branch) {
    return `${branch}-${commits} [${shortHash}]`
  }
  else {
    return `detached-${shortHash}`
  }
}
