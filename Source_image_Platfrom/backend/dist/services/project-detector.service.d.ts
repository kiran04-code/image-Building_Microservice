import type { GitHubRepositoryFiles } from "./github.service.js";
export type ProjectKind = "next" | "vite" | "node" | "fastapi" | "python" | "go" | "java-maven" | "java-gradle" | "unknown";
export interface ProjectDetection {
    kind: ProjectKind;
    language: string;
    framework: string;
    port: number;
    hasDockerfile: boolean;
    rootDirectory?: string | undefined;
}
export declare function detectProject(repository: GitHubRepositoryFiles): ProjectDetection;
//# sourceMappingURL=project-detector.service.d.ts.map