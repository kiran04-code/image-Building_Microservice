export type BuildStatus = "queued" | "building" | "success" | "failed" | "cancelled";
export interface BuildResult {
    id: string;
    providerBuildId: string;
    status: BuildStatus;
    repository: {
        url: string;
        owner: string;
        name: string;
    };
    project: {
        language: string;
        framework: string;
        port: number;
        dockerfileGenerated: boolean;
    };
    image: {
        registry: string;
        repository: string;
        tag: string;
        reference: string;
        pullCommand: string;
    };
    logsUrl?: string;
}
export declare function parseGitHubRepoUrl(value: string): {
    owner: string;
    repo: string;
    url: string;
};
export declare function buildRepository(repoUrl: string, branch?: string): Promise<BuildResult>;
export declare function getBuild(id: string): Promise<BuildResult | undefined>;
//# sourceMappingURL=build.service.d.ts.map