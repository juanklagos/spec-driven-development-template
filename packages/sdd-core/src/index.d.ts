export type ScaffoldProfile = "minimal" | "recommended" | "full";
export interface CreateWorkspaceInput {
    frameworkRoot: string;
    projectName: string;
    assistant?: string;
    profile?: ScaffoldProfile;
    useSpecKit?: boolean;
}
export interface CreateWorkspaceResult {
    projectRoot: string;
    profile: ScaffoldProfile;
    assistant: string;
    usedSpecKit: boolean;
}
export interface CreateSpecInput {
    projectRoot: string;
    featureName: string;
    owner?: string;
}
export interface CreateSpecResult {
    specId: string;
    specDir: string;
    indexUpdated: boolean;
}
export interface ValidationMessage {
    level: "error" | "warning" | "info";
    code: string;
    message: string;
    path?: string;
}
export interface ValidationResult {
    ok: boolean;
    errors: number;
    warnings: number;
    messages: ValidationMessage[];
}
export interface GateResult extends ValidationResult {
    approvedSpecs: number;
    totalSpecs: number;
}
export interface ConsentResult {
    logFile: string;
    summary: string;
    timestamp: string;
}
export interface FileOutputResult {
    path: string;
    content: string;
}
export interface SpecSummary {
    id: string;
    dir: string;
    status: string;
}
export declare function getFrameworkRoot(): string;
export declare function slugify(value: string): string;
export declare function createWorkspace(input: CreateWorkspaceInput): Promise<CreateWorkspaceResult>;
export declare function createSpec(input: CreateSpecInput): Promise<CreateSpecResult>;
export declare function listSpecs(projectRoot: string): Promise<SpecSummary[]>;
export declare function validateProject(projectRoot: string): Promise<ValidationResult>;
export declare function checkGate(projectRoot: string): Promise<GateResult>;
export declare function recordUserConsent(projectRoot: string, summary: string): Promise<ConsentResult>;
export declare function generateStatus(projectRoot: string): Promise<FileOutputResult>;
export declare function generateRoadmap(projectRoot: string): Promise<{
    mermaidPath: string;
    markdownPath: string;
    mermaid: string;
    markdown: string;
}>;
export declare function appendProjectLogEntry(projectRoot: string, entry: string): Promise<FileOutputResult>;
export declare function writeDailyLog(projectRoot: string, date: string, content: string): Promise<FileOutputResult>;
export declare function writeHandoff(projectRoot: string, fileName: string, content: string): Promise<FileOutputResult>;
export declare function writeDecision(projectRoot: string, fileName: string, content: string): Promise<FileOutputResult>;
export declare function ensureProjectRootAllowed(projectRoot: string): Promise<void>;
