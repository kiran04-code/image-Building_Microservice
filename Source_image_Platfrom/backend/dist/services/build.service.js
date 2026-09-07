import { BatchGetBuildsCommand, CodeBuildClient, StartBuildCommand, } from "@aws-sdk/client-codebuild";
import { randomUUID } from "node:crypto";
import { generateDockerfile } from "./dockerfile-generator.service.js";
import { inspectGitHubRepository } from "./github.service.js";
import { detectProject } from "./project-detector.service.js";
const builds = new Map();
function required(name) {
    const value = process.env[name]?.trim();
    if (!value)
        throw new Error(`Missing required server configuration: ${name}`);
    return value;
}
export function parseGitHubRepoUrl(value) {
    let url;
    try {
        url = new URL(value);
    }
    catch {
        throw new Error("INVALID_REPOSITORY_URL");
    }
    if (url.protocol !== "https:" || url.hostname !== "github.com" || url.search || url.hash) {
        throw new Error("INVALID_REPOSITORY_URL");
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 2 ||
        !/^[A-Za-z0-9_.-]+$/.test(parts[0]) ||
        !/^[A-Za-z0-9_.-]+(?:\.git)?$/.test(parts[1])) {
        throw new Error("INVALID_REPOSITORY_URL");
    }
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    return { owner, repo, url: `https://github.com/${owner}/${repo}` };
}
function client() {
    return new CodeBuildClient({ region: required("AWS_REGION") });
}
function ecrImage(repository, tag) {
    const registry = (process.env.ECR_REGISTRY?.trim() ||
        `${required("AWS_ACCOUNT_ID")}.dkr.ecr.${required("AWS_REGION")}.amazonaws.com`).replace(/\/+$/, "");
    const cleanRepo = repository.replace(/^\/+/, "");
    const reference = `${registry}/${cleanRepo}:${tag}`;
    return { registry, repository: cleanRepo, tag, reference, pullCommand: `docker pull ${reference}` };
}
function buildSpec(repository, tag, isPublicEcr) {
    const loginCommand = isPublicEcr
        ? `aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws`
        : `aws ecr get-login-password --region "$AWS_DEFAULT_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"`;
    return `version: 0.2
phases:
  pre_build:
    commands:
      - ${loginCommand}
      - if [ "$DOCKERFILE_GENERATED" = "true" ]; then echo "$IMAGEFORGE_DOCKERFILE_BASE64" | base64 -d > Dockerfile.imageforge; fi
  build:
    commands:
      - docker build --file "$DOCKERFILE_PATH" --tag "$ECR_REGISTRY/${repository}:${tag}" .
  post_build:
    commands:
      - docker push "$ECR_REGISTRY/${repository}:${tag}"
`;
}
export async function buildRepository(repoUrl, branch) {
    const repository = parseGitHubRepoUrl(repoUrl);
    const inspectedRepository = await inspectGitHubRepository(repository.owner, repository.repo, branch);
    const project = detectProject(inspectedRepository);
    const generatedDockerfile = project.hasDockerfile ? undefined : generateDockerfile(project);
    const cleanRepo = repository.repo.toLowerCase().replace(/[^a-z0-9_.-]/g, "-");
    const cleanBranch = (inspectedRepository.defaultBranch.replace(/[^A-Za-z0-9_.-]/g, "-") || "main").slice(0, 30);
    const timestamp = Math.floor(Date.now() / 1000);
    const tag = `${cleanRepo}-${cleanBranch}-${timestamp}`.slice(0, 120);
    const ecrRepository = required("ECR_REPOSITORY");
    const image = ecrImage(ecrRepository, tag);
    const isPublicEcr = image.registry.startsWith("public.ecr.aws");
    const response = await client().send(new StartBuildCommand({
        projectName: required("AWS_CODEBUILD_PROJECT_NAME"),
        sourceTypeOverride: "GITHUB",
        sourceLocationOverride: repository.url,
        sourceVersion: inspectedRepository.defaultBranch,
        buildspecOverride: buildSpec(image.repository, tag, isPublicEcr),
        environmentVariablesOverride: [
            { name: "ECR_REGISTRY", value: image.registry, type: "PLAINTEXT" },
            { name: "DOCKERFILE_GENERATED", value: String(Boolean(generatedDockerfile)), type: "PLAINTEXT" },
            { name: "DOCKERFILE_PATH", value: generatedDockerfile ? "Dockerfile.imageforge" : "Dockerfile", type: "PLAINTEXT" },
            ...(generatedDockerfile ? [{ name: "IMAGEFORGE_DOCKERFILE_BASE64", value: Buffer.from(generatedDockerfile).toString("base64"), type: "PLAINTEXT" }] : []),
        ],
    }));
    if (!response.build?.id)
        throw new Error("CODEBUILD_SUBMISSION_FAILED");
    const result = {
        id: `build_${randomUUID()}`,
        providerBuildId: response.build.id,
        status: "queued",
        repository: { url: repository.url, owner: repository.owner, name: repository.repo },
        project: { language: project.language, framework: project.framework, port: project.port, dockerfileGenerated: Boolean(generatedDockerfile) },
        image,
    };
    builds.set(result.id, result);
    return result;
}
function statusOf(build) {
    if (build.buildComplete) {
        if (build.buildStatus === "SUCCEEDED")
            return "success";
        return build.buildStatus === "STOPPED" ? "cancelled" : "failed";
    }
    return build.currentPhase === "QUEUED" ? "queued" : "building";
}
export async function getBuild(id) {
    const saved = builds.get(id);
    if (!saved)
        return undefined;
    const response = await client().send(new BatchGetBuildsCommand({ ids: [saved.providerBuildId] }));
    const providerBuild = response.builds?.[0];
    if (!providerBuild)
        return saved;
    const failedPhase = providerBuild.phases?.find((p) => p.phaseStatus === "FAILED");
    const errorMessage = failedPhase?.contexts?.[0]?.message || (providerBuild.buildStatus === "FAILED" ? "Build command failed inside container." : undefined);
    const updated = {
        ...saved,
        status: statusOf(providerBuild),
        ...(providerBuild.logs?.deepLink ? { logsUrl: providerBuild.logs.deepLink } : {}),
        ...(errorMessage ? { errorMessage } : {}),
    };
    builds.set(id, updated);
    return updated;
}
//# sourceMappingURL=build.service.js.map