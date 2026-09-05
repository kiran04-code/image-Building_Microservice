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

function dependencies(packageJson?: Record<string, unknown>) {
  return { ...((packageJson?.dependencies as Record<string, string> | undefined) ?? {}), ...((packageJson?.devDependencies as Record<string, string> | undefined) ?? {}) };
}

export function detectProject(repository: GitHubRepositoryFiles): ProjectDetection {
  const hasDockerfile = repository.files.has("Dockerfile") || repository.files.has("dockerfile");
  const rootDirectory = repository.rootDirectory;
  const deps = dependencies(repository.packageJson);
  if (deps.next) return { kind: "next", language: "TypeScript/JavaScript", framework: "Next.js", port: 3000, hasDockerfile, rootDirectory };
  if (deps.vite && deps.react) return { kind: "vite", language: "TypeScript/JavaScript", framework: "React + Vite", port: 80, hasDockerfile, rootDirectory };
  if (repository.packageJson) return { kind: "node", language: "TypeScript/JavaScript", framework: deps.express ? "Express" : "Node.js", port: 3000, hasDockerfile, rootDirectory };
  if (repository.files.has("go.mod")) return { kind: "go", language: "Go", framework: "Go", port: 8080, hasDockerfile, rootDirectory };
  if (repository.files.has("pom.xml")) return { kind: "java-maven", language: "Java", framework: "Maven", port: 8080, hasDockerfile, rootDirectory };
  if (repository.files.has("build.gradle") || repository.files.has("build.gradle.kts")) return { kind: "java-gradle", language: "Java", framework: "Gradle", port: 8080, hasDockerfile, rootDirectory };
  if (repository.requirements || repository.pyproject) {
    const pythonFiles = `${repository.requirements ?? ""}\n${repository.pyproject ?? ""}`.toLowerCase();
    return pythonFiles.includes("fastapi") ? { kind: "fastapi", language: "Python", framework: "FastAPI", port: 8000, hasDockerfile, rootDirectory } : { kind: "python", language: "Python", framework: "Python", port: 8000, hasDockerfile, rootDirectory };
  }
  return { kind: "unknown", language: "Unknown", framework: "Unknown", port: 0, hasDockerfile, rootDirectory };
}
