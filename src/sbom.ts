import { Octokit } from 'octokit';

interface CreationInfo {
    created: string;
    creators: string[];
}

interface ExternalRef {
    referenceCategory: string;
    referenceType: string;
    referenceLocator: string;
}

interface Package {
    name?: string;
    SPDXID?: string;
    versionInfo?: string;
    downloadLocation?: string;
    filesAnalyzed?: boolean;
    licenseDeclared?: string;
    licenseConcluded?: string;
    supplier?: string;
    copyrightText?: string;
    externalRefs?: ExternalRef[];
}

interface RelationShip {
    spdxElementId?: string;
    relatedSpdxElement?: string;
    relationshipType?: string;
}

export interface SBOM {
    spdxVersion: string;
    dataLicense: string;
    comment?: string | undefined;
    SPDXID: string;
    name: string;
    documentNamespace: string;
    creationInfo: CreationInfo;
    packages: Package[];
    relationships?: RelationShip[];
}

export interface RepoSBOMUUID {
    repository: string;
    sbomUUID: string;
}

export interface SBOMUUID extends RepoSBOMUUID {
    sbom: SBOM;
}

export class SBOMGenerator {
    private failedRepos: string[] = [];

    public constructor(private readonly octokit: Octokit) {}

    public async generateSBOM(repository: string): Promise<RepoSBOMUUID> {
        const response = await this.octokit.request(
            "GET /repos/{owner}/{repo}/dependency-graph/sbom/generate-report",
            {
                owner: "Amsterdam",
                repo: repository,
                headers: {
                    "X-GitHub-Api-Version": "2026-03-10",
                }
            }
        );

        if (response.status !== 201) {
            this.failedRepos.push(repository);
            throw new Error("Failed to request generating of SBOM!")
        }
        if (response.data.sbom_url === undefined) {
            this.failedRepos.push(repository);
            throw new Error("Requesting SBOM successful, but no polling url was provided!");
        }

        const sbomUUID = response.data.sbom_url.substring(response.data.sbom_url.lastIndexOf('/') + 1);
        console.log(`SBOM UUID: ${sbomUUID}`);
        console.log(`SBOM url: ${response.data.sbom_url}`);

        return { repository: repository, sbomUUID: sbomUUID };
    }

    public getFailedRepos(): string[] {
        return this.failedRepos;
    }
}

export class SBOMPollingException extends Error {}

export class SBOMPoller {
    public constructor(private readonly octokit: Octokit) {}

    public async pollSBOM(repoSBOMUUID: RepoSBOMUUID): Promise<SBOMUUID> {
        const response = await this.octokit.request(
            "GET /repos/{owner}/{repo}/dependency-graph/sbom/fetch-report/{sbom_uuid}",
            {
                owner: "Amsterdam",
                repo: repoSBOMUUID.repository,
                sbom_uuid: repoSBOMUUID.sbomUUID,
            }
        );

        // @ts-expect-error TS2367
        if (response.status === 202) {
            // Still being generated, try again later
            throw new SBOMPollingException(
                `${repoSBOMUUID.repository} - ${repoSBOMUUID.sbomUUID} Still being generated, try again later`
            );
        }

        return {
            repository: repoSBOMUUID.repository,
            sbomUUID: repoSBOMUUID.sbomUUID,
            // @ts-expect-error TS2345
            sbom: JSON.parse(response.data)
        };
    }
}
