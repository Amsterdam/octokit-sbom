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
export declare class SBOMGenerator {
    private readonly octokit;
    constructor(octokit: Octokit);
    generateSBOM(repository: string): Promise<RepoSBOMUUID>;
}
export declare class SBOMPollingException extends Error {
}
export declare class SBOMPoller {
    private readonly octokit;
    constructor(octokit: Octokit);
    pollSBOM(repoSBOMUUID: RepoSBOMUUID): Promise<SBOMUUID>;
}
export {};
//# sourceMappingURL=sbom.d.ts.map