export interface GitHubRepositoryFiles {
    defaultBranch: string;
    files: Set<string>;
    packageJson?: Record<string, unknown> | undefined;
    requirements?: string | undefined;
    pyproject?: string | undefined;
    rootDirectory?: string | undefined;
}
export declare function inspectGitHubRepository(owner: string, repo: string, requestedBranch?: string): Promise<GitHubRepositoryFiles>;
//# sourceMappingURL=github.service.d.ts.map