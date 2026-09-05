const API_BASE_URL = "https://api.github.com";
function headers() {
    const token = process.env.GITHUB_TOKEN?.trim();
    return {
        Accept: "application/vnd.github+json",
        "User-Agent": "imageforge-source-builder",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}
async function githubFetch(path, useAuth = true) {
    let response;
    try {
        const h = useAuth ? headers() : { Accept: "application/vnd.github+json", "User-Agent": "imageforge-source-builder" };
        response = await fetch(`${API_BASE_URL}${path}`, { headers: h });
    }
    catch (error) {
        console.error(`Failed to fetch GitHub API at ${path}:`, error);
        throw new Error("GITHUB_UNREACHABLE");
    }
    if (response.status === 404)
        throw new Error("REPOSITORY_NOT_FOUND");
    if (response.status === 401)
        throw new Error("INVALID_GITHUB_TOKEN");
    if (response.status === 403) {
        if (response.headers.get("x-ratelimit-remaining") === "0") {
            throw new Error("GITHUB_RATE_LIMITED");
        }
        // If authenticated request failed with 403, try unauthenticated once (in case token has restrictive scope on public repo)
        if (useAuth && process.env.GITHUB_TOKEN?.trim()) {
            try {
                return await githubFetch(path, false);
            }
            catch {
                // Fall back to GITHUB_FORBIDDEN error
            }
        }
        throw new Error("GITHUB_FORBIDDEN");
    }
    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(`GitHub API returned status ${response.status} for ${path}: ${errorText}`);
        throw new Error("GITHUB_REQUEST_FAILED");
    }
    return response;
}
async function readTextFile(owner, repo, path, branch) {
    let response;
    try {
        response = await githubFetch(`/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`);
    }
    catch (error) {
        if (error instanceof Error && (error.message === "REPOSITORY_NOT_FOUND" || error.message === "GITHUB_FORBIDDEN")) {
            return undefined;
        }
        throw error;
    }
    const data = (await response.json());
    if (!data.content || data.encoding !== "base64")
        return undefined;
    return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
}
function hasProjectMarkers(files) {
    return (files.has("package.json") ||
        files.has("Dockerfile") ||
        files.has("dockerfile") ||
        files.has("requirements.txt") ||
        files.has("pyproject.toml") ||
        files.has("go.mod") ||
        files.has("pom.xml") ||
        files.has("build.gradle") ||
        files.has("build.gradle.kts"));
}
export async function inspectGitHubRepository(owner, repo, requestedBranch) {
    const metadata = (await (await githubFetch(`/repos/${owner}/${repo}`)).json());
    const defaultBranch = requestedBranch || metadata.default_branch || "main";
    const root = (await (await githubFetch(`/repos/${owner}/${repo}/contents?ref=${encodeURIComponent(defaultBranch)}`)).json());
    let files = new Set(root.map((entry) => entry.name));
    let rootDirectory;
    // If root doesn't contain project files, inspect candidate subdirectories (e.g. maxx, frontend, backend, app, etc.)
    if (!hasProjectMarkers(files)) {
        const subDirs = root
            .filter((entry) => entry.type === "dir" && !entry.name.startsWith(".") && !["docs", "assets", "public", "test", "tests"].includes(entry.name))
            .map((entry) => entry.name);
        for (const dir of subDirs) {
            try {
                const subContents = (await (await githubFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(dir)}?ref=${encodeURIComponent(defaultBranch)}`)).json());
                const subFiles = new Set(subContents.map((entry) => entry.name));
                if (hasProjectMarkers(subFiles)) {
                    files = subFiles;
                    rootDirectory = dir;
                    break;
                }
            }
            catch {
                // Continue to next directory if inspect fails
            }
        }
    }
    const pathPrefix = rootDirectory ? `${rootDirectory}/` : "";
    const [packageText, requirements, pyproject] = await Promise.all([
        files.has("package.json") ? readTextFile(owner, repo, `${pathPrefix}package.json`, defaultBranch) : undefined,
        files.has("requirements.txt") ? readTextFile(owner, repo, `${pathPrefix}requirements.txt`, defaultBranch) : undefined,
        files.has("pyproject.toml") ? readTextFile(owner, repo, `${pathPrefix}pyproject.toml`, defaultBranch) : undefined,
    ]);
    let packageJson;
    if (packageText) {
        try {
            packageJson = JSON.parse(packageText);
        }
        catch {
            throw new Error("INVALID_PACKAGE_JSON");
        }
    }
    return { defaultBranch, files, packageJson, requirements, pyproject, rootDirectory };
}
//# sourceMappingURL=github.service.js.map