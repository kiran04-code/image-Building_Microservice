import { buildRepository, getBuild } from "../../services/build.service.js";
export async function createBuild(req, res) {
    try {
        if (typeof req.body?.repoUrl !== "string") {
            return res.status(400).json({
                code: "INVALID_REPOSITORY_URL",
                message: "repoUrl is required.",
            });
        }
        const branch = typeof req.body.branch === "string" ? req.body.branch : undefined;
        const result = await buildRepository(req.body.repoUrl, branch);
        return res.status(202).json(result);
    }
    catch (error) {
        console.error("CREATE BUILD CAUGHT ERROR:", error);
        const rawMessage = error instanceof Error ? error.message : "INTERNAL_ERROR";
        const isInvalidUrl = rawMessage === "INVALID_REPOSITORY_URL";
        const isRepoNotFound = rawMessage === "REPOSITORY_NOT_FOUND";
        const isForbidden = rawMessage === "GITHUB_FORBIDDEN";
        const isRateLimited = rawMessage === "GITHUB_RATE_LIMITED";
        const isInvalidToken = rawMessage === "INVALID_GITHUB_TOKEN";
        const isUnsupported = rawMessage === "UNSUPPORTED_PROJECT";
        const missingAwsCredentials = /credentials|security token/i.test(rawMessage);
        const githubUnreachable = rawMessage === "GITHUB_UNREACHABLE";
        const isAccessDenied = /AccessDenied|not authorized/i.test(rawMessage);
        let code = "INTERNAL_ERROR";
        let message = "Unable to start the remote ECR build.";
        if (isInvalidUrl) {
            code = "INVALID_REPOSITORY_URL";
            message = "Enter a valid https://github.com/owner/repository URL.";
        }
        else if (isRepoNotFound) {
            code = "REPOSITORY_NOT_FOUND";
            message = "Repository not found. Ensure the GitHub URL is correct and the repository exists.";
        }
        else if (isForbidden) {
            code = "GITHUB_ACCESS_DENIED";
            message = "GitHub access denied. If this is a private repository, ensure your GitHub Personal Access Token has 'Contents: Read' permission.";
        }
        else if (isInvalidToken) {
            code = "INVALID_GITHUB_TOKEN";
            message = "GitHub token is invalid or expired. Check GITHUB_TOKEN in .env.";
        }
        else if (isRateLimited) {
            code = "GITHUB_RATE_LIMITED";
            message = "GitHub API rate limit exceeded. Please try again later or configure a valid GITHUB_TOKEN.";
        }
        else if (isUnsupported) {
            code = "UNSUPPORTED_PROJECT";
            message = "Could not automatically detect project type (Next.js, Vite, Node.js, Python, Go, Java, or Dockerfile).";
        }
        else if (missingAwsCredentials) {
            code = "AWS_CREDENTIALS_NOT_CONFIGURED";
            message = "AWS credentials are not configured on the backend.";
        }
        else if (isAccessDenied) {
            code = "AWS_ACCESS_DENIED";
            message = "AWS CodeBuild permission denied: Please ensure the IAM role has codebuild:StartBuild permissions.";
        }
        else if (githubUnreachable) {
            code = "GITHUB_UNREACHABLE";
            message = "The backend cannot reach GitHub. Check your internet connection or proxy settings.";
        }
        else if (rawMessage) {
            code = "BUILD_ERROR";
            message = rawMessage;
        }
        return res.status(isInvalidUrl || isRepoNotFound ? 400 : 500).json({ code, message });
    }
}
export async function readBuild(req, res) {
    try {
        const rawId = req.params.id;
        const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
        if (!id) {
            return res.status(400).json({
                code: "INVALID_BUILD_ID",
                message: "Build ID is required.",
            });
        }
        const build = await getBuild(id);
        if (build)
            return res.json(build);
        return res.status(404).json({
            code: "BUILD_NOT_FOUND",
            message: "Build not found.",
        });
    }
    catch {
        return res.status(500).json({
            code: "INTERNAL_ERROR",
            message: "Unable to read build status.",
        });
    }
}
//# sourceMappingURL=build.controller.js.map