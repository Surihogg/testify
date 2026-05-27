import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'
import { promises as fs } from 'fs'
import path from 'path'

class GitService {
  async clone(url: string, localPath: string, options?: { branch?: string; username?: string; token?: string }): Promise<void> {
    const auth = options?.token
      ? {
          onAuth: () => ({ username: options.username || 'token', password: options.token }),
        }
      : {}

    await git.clone({
      fs,
      http,
      dir: localPath,
      url,
      ref: options?.branch,
      depth: 1,
      singleBranch: true,
      ...auth,
    })
  }

  async pull(localPath: string, options?: { username?: string; token?: string }): Promise<void> {
    const auth = options?.token
      ? {
          onAuth: () => ({ username: options.username || 'token', password: options.token }),
        }
      : {}

    await git.pull({
      fs,
      http,
      dir: localPath,
      author: { name: 'Testify', email: 'testify@app.local' },
      ...auth,
    })
  }

  async push(localPath: string, options?: { username?: string; token?: string }): Promise<void> {
    const auth = options?.token
      ? {
          onAuth: () => ({ username: options.username || 'token', password: options.token }),
        }
      : {}

    await git.push({
      fs,
      http,
      dir: localPath,
      ...auth,
    })
  }

  async getStatus(localPath: string): Promise<{ staged: string[]; unstaged: string[]; untracked: string[] }> {
    const statusMatrix = await git.statusMatrix({ fs, dir: localPath })

    const staged: string[] = []
    const unstaged: string[] = []
    const untracked: string[] = []

    for (const [filepath, headStatus, workdirStatus, stageStatus] of statusMatrix) {
      if (headStatus === 0 && workdirStatus === 2 && stageStatus === 2) {
        untracked.push(filepath)
      } else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 2) {
        staged.push(filepath)
      } else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 1) {
        unstaged.push(filepath)
      } else if (headStatus === 1 && workdirStatus === 0) {
        unstaged.push(filepath)
      } else if (headStatus === 2 && workdirStatus === 2 && stageStatus === 2) {
        staged.push(filepath)
      }
    }

    return { staged, unstaged, untracked }
  }

  async commit(localPath: string, message: string, options?: { username?: string; token?: string }): Promise<string> {
    await git.add({ fs, dir: localPath, filepath: '.' })

    const sha = await git.commit({
      fs,
      dir: localPath,
      message,
      author: { name: 'Testify', email: 'testify@app.local' },
    })

    return sha
  }

  async getRemotes(localPath: string): Promise<{ remote: string; url: string }[]> {
    const remotes = await git.listRemotes({ fs, dir: localPath })
    return remotes.map((r) => ({ remote: r.remote, url: r.url }))
  }
}

export const gitService = new GitService()
