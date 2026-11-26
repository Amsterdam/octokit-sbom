"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SBOMPoller = exports.SBOMPollingException = exports.SBOMGenerator = void 0;
class SBOMGenerator {
    octokit;
    constructor(octokit) {
        this.octokit = octokit;
    }
    async generateSBOM(repository) {
        const response = await this.octokit.request("GET /repos/{owner}/{repo}/dependency-graph/sbom/generate-report", {
            owner: "Amsterdam",
            repo: repository,
            headers: {
                "X-GitHub-Api-Version": "2026-03-10",
            }
        });
        if (response.status !== 201) {
            throw new Error("Failed to request generating of SBOM!");
        }
        if (response.data.sbom_url === undefined) {
            throw new Error("Requesting SBOM successful, but no polling url was provided!");
        }
        const sbomUUID = response.data.sbom_url.substring(response.data.sbom_url.lastIndexOf('/') + 1);
        console.log(`SBOM UUID: ${sbomUUID}`);
        console.log(`SBOM url: ${response.data.sbom_url}`);
        return { repository: repository, sbomUUID: sbomUUID };
    }
}
exports.SBOMGenerator = SBOMGenerator;
class SBOMPollingException extends Error {
}
exports.SBOMPollingException = SBOMPollingException;
class SBOMPoller {
    octokit;
    constructor(octokit) {
        this.octokit = octokit;
    }
    async pollSBOM(repoSBOMUUID) {
        const response = await this.octokit.request("GET /repos/{owner}/{repo}/dependency-graph/sbom/fetch-report/{sbom_uuid}", {
            owner: "Amsterdam",
            repo: repoSBOMUUID.repository,
            sbom_uuid: repoSBOMUUID.sbomUUID,
        });
        // @ts-expect-error TS2367
        if (response.status === 202) {
            // Still being generated, try again later
            throw new SBOMPollingException(`${repoSBOMUUID.repository} - ${repoSBOMUUID.sbomUUID} Still being generated, try again later`);
        }
        return {
            repository: repoSBOMUUID.repository,
            sbomUUID: repoSBOMUUID.sbomUUID,
            // @ts-expect-error TS2345
            sbom: JSON.parse(response.data)
        };
    }
}
exports.SBOMPoller = SBOMPoller;
//# sourceMappingURL=sbom.js.map