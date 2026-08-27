export type ControlDecision = 'PASS' | 'REVIEW' | 'BLOCK';

export type GDPRLawfulBasis =
  | 'CONSENT'
  | 'CONTRACT'
  | 'LEGAL_OBLIGATION'
  | 'VITAL_INTERESTS'
  | 'PUBLIC_TASK'
  | 'LEGITIMATE_INTERESTS';

export type GDPRArticle9Condition =
  | 'EXPLICIT_CONSENT'
  | 'EMPLOYMENT_SOCIAL_SECURITY'
  | 'VITAL_INTERESTS'
  | 'NONPROFIT'
  | 'MANIFESTLY_PUBLIC'
  | 'LEGAL_CLAIMS'
  | 'SUBSTANTIAL_PUBLIC_INTEREST'
  | 'HEALTH_SOCIAL_CARE'
  | 'PUBLIC_HEALTH'
  | 'ARCHIVING_RESEARCH_STATISTICS';

export type GDPRTransferMechanism =
  | 'NOT_APPLICABLE'
  | 'ADEQUACY'
  | 'SCC'
  | 'BCR'
  | 'ARTICLE_49_DEROGATION';

export interface GDPRProcessingActivity {
  readonly id: string;
  readonly controller: string;
  readonly processor?: string;
  readonly dpoContact?: string;
  readonly purposes: readonly string[];
  readonly lawfulBasis: GDPRLawfulBasis;
  readonly dataSubjects: readonly string[];
  readonly personalDataCategories: readonly string[];
  readonly recipients: readonly string[];
  readonly retentionDays: number;
  readonly securityMeasures: readonly string[];
  readonly specialCategoryData: boolean;
  readonly article9Condition?: GDPRArticle9Condition;
  readonly automatedDecisionMaking: boolean;
  readonly humanReviewAvailable: boolean;
  readonly internationalTransfer: boolean;
  readonly transferMechanism: GDPRTransferMechanism;
  readonly provenance: readonly string[];
}

export interface GDPRDPIA {
  readonly id: string;
  readonly processingActivityId: string;
  readonly systematicProfiling: boolean;
  readonly largeScaleSpecialCategory: boolean;
  readonly largeScalePublicMonitoring: boolean;
  readonly otherHighRisk: boolean;
  readonly necessityAndProportionalityAssessed: boolean;
  readonly risksDocumented: boolean;
  readonly mitigationsDocumented: boolean;
  readonly residualHighRisk: boolean;
  readonly supervisoryConsultationCompleted: boolean;
  readonly approvedBeforeProcessing: boolean;
  readonly provenance: readonly string[];
}

export interface GDPRBreachRecord {
  readonly id: string;
  readonly discoveredAt: string;
  readonly controllerAwareAt: string;
  readonly confidentialityImpact: boolean;
  readonly integrityImpact: boolean;
  readonly availabilityImpact: boolean;
  readonly likelyRiskToRights: boolean;
  readonly likelyHighRiskToRights: boolean;
  readonly supervisoryAuthorityNotifiedAt?: string;
  readonly dataSubjectsNotifiedAt?: string;
  readonly delayReason?: string;
  readonly containmentActions: readonly string[];
  readonly provenance: readonly string[];
}

export interface GDPRPrivacyByDesign {
  readonly dataMinimized: boolean;
  readonly purposeBound: boolean;
  readonly privacyDefaults: boolean;
  readonly leastPrivilege: boolean;
  readonly encryptionSupported: boolean;
  readonly pseudonymizationSupported: boolean;
  readonly retentionAutomated: boolean;
  readonly rightsWorkflowIntegrated: boolean;
  readonly loggingEnabled: boolean;
}

export interface GDPRTransferAssessment {
  readonly destinationCountry: string;
  readonly mechanism: GDPRTransferMechanism;
  readonly transferImpactAssessmentCompleted: boolean;
  readonly supplementaryMeasuresDocumented: boolean;
  readonly provenance: readonly string[];
}

export const validateGDPRProcessingActivity = (activity: GDPRProcessingActivity): GDPRProcessingActivity => {
  if (!activity.id.trim() || !activity.controller.trim()) throw new Error('GDPR_ROPA_IDENTITY_REQUIRED');
  if (activity.purposes.length === 0) throw new Error('GDPR_PURPOSE_REQUIRED');
  if (activity.dataSubjects.length === 0 || activity.personalDataCategories.length === 0) throw new Error('GDPR_DATA_CATEGORIES_REQUIRED');
  if (activity.retentionDays < 1) throw new Error('GDPR_RETENTION_REQUIRED');
  if (activity.securityMeasures.length === 0) throw new Error('GDPR_SECURITY_MEASURES_REQUIRED');
  if (activity.provenance.length === 0) throw new Error('GDPR_PROVENANCE_REQUIRED');
  if (activity.specialCategoryData && !activity.article9Condition) throw new Error('GDPR_ARTICLE9_CONDITION_REQUIRED');
  if (activity.automatedDecisionMaking && !activity.humanReviewAvailable) throw new Error('GDPR_HUMAN_REVIEW_REQUIRED');
  if (activity.internationalTransfer && activity.transferMechanism === 'NOT_APPLICABLE') throw new Error('GDPR_TRANSFER_MECHANISM_REQUIRED');
  return activity;
};

export const evaluateGDPRDPIA = (dpia: GDPRDPIA): ControlDecision => {
  if (!dpia.id.trim() || !dpia.processingActivityId.trim() || dpia.provenance.length === 0) return 'BLOCK';
  const highRisk = dpia.systematicProfiling || dpia.largeScaleSpecialCategory || dpia.largeScalePublicMonitoring || dpia.otherHighRisk;
  if (!highRisk) return 'PASS';
  if (!dpia.necessityAndProportionalityAssessed || !dpia.risksDocumented || !dpia.mitigationsDocumented || !dpia.approvedBeforeProcessing) return 'BLOCK';
  if (dpia.residualHighRisk && !dpia.supervisoryConsultationCompleted) return 'BLOCK';
  return 'PASS';
};

const hoursBetween = (from: string, to: string): number => (Date.parse(to) - Date.parse(from)) / 3_600_000;

export const evaluateGDPRBreach = (breach: GDPRBreachRecord): ControlDecision => {
  if (!breach.id.trim() || breach.provenance.length === 0 || breach.containmentActions.length === 0) return 'BLOCK';
  if (!breach.confidentialityImpact && !breach.integrityImpact && !breach.availabilityImpact) return 'REVIEW';
  if (breach.likelyRiskToRights) {
    if (!breach.supervisoryAuthorityNotifiedAt) return 'BLOCK';
    if (hoursBetween(breach.controllerAwareAt, breach.supervisoryAuthorityNotifiedAt) > 72 && !breach.delayReason) return 'BLOCK';
  }
  if (breach.likelyHighRiskToRights && !breach.dataSubjectsNotifiedAt) return 'BLOCK';
  return 'PASS';
};

export const validateGDPRPrivacyByDesign = (design: GDPRPrivacyByDesign): boolean =>
  design.dataMinimized &&
  design.purposeBound &&
  design.privacyDefaults &&
  design.leastPrivilege &&
  design.encryptionSupported &&
  design.pseudonymizationSupported &&
  design.retentionAutomated &&
  design.rightsWorkflowIntegrated &&
  design.loggingEnabled;

export const validateGDPRTransfer = (transfer: GDPRTransferAssessment): GDPRTransferAssessment => {
  if (!transfer.destinationCountry.trim() || transfer.provenance.length === 0) throw new Error('GDPR_TRANSFER_PROVENANCE_REQUIRED');
  if (transfer.mechanism === 'NOT_APPLICABLE') return transfer;
  if ((transfer.mechanism === 'SCC' || transfer.mechanism === 'BCR') && !transfer.transferImpactAssessmentCompleted) {
    throw new Error('GDPR_TRANSFER_IMPACT_ASSESSMENT_REQUIRED');
  }
  if (transfer.mechanism === 'SCC' && !transfer.supplementaryMeasuresDocumented) {
    throw new Error('GDPR_SUPPLEMENTARY_MEASURES_REQUIRED');
  }
  return transfer;
};

export type HIPAAEntityRole = 'COVERED_ENTITY' | 'BUSINESS_ASSOCIATE' | 'SUBCONTRACTOR' | 'NOT_IN_SCOPE';
export type HIPAASafeguardType = 'ADMINISTRATIVE' | 'PHYSICAL' | 'TECHNICAL';

export interface HIPAAScopeAssessment {
  readonly role: HIPAAEntityRole;
  readonly createsReceivesMaintainsTransmitsPHI: boolean;
  readonly createsReceivesMaintainsTransmitsePHI: boolean;
  readonly coveredFunctionOrBAService: boolean;
  readonly determinationDocumented: boolean;
  readonly provenance: readonly string[];
}

export interface HIPAARiskItem {
  readonly id: string;
  readonly asset: string;
  readonly threat: string;
  readonly vulnerability: string;
  readonly likelihood: 1 | 2 | 3 | 4 | 5;
  readonly impact: 1 | 2 | 3 | 4 | 5;
  readonly mitigation: string;
  readonly owner: string;
  readonly residualRiskAccepted: boolean;
}

export interface HIPAARiskAnalysis {
  readonly id: string;
  readonly ephiInventoryComplete: boolean;
  readonly locationsCovered: boolean;
  readonly threatsAndVulnerabilitiesDocumented: boolean;
  readonly riskItems: readonly HIPAARiskItem[];
  readonly reviewDate: string;
  readonly securityOfficial: string;
  readonly provenance: readonly string[];
}

export interface HIPAASecuritySafeguards {
  readonly securityManagementProcess: boolean;
  readonly assignedSecurityResponsibility: boolean;
  readonly workforceSecurity: boolean;
  readonly informationAccessManagement: boolean;
  readonly securityAwarenessTraining: boolean;
  readonly securityIncidentProcedures: boolean;
  readonly contingencyPlan: boolean;
  readonly periodicEvaluation: boolean;
  readonly baaManagement: boolean;
  readonly facilityAccessControls: boolean;
  readonly workstationUsePolicy: boolean;
  readonly workstationSecurity: boolean;
  readonly deviceMediaControls: boolean;
  readonly accessControl: boolean;
  readonly uniqueUserIdentification: boolean;
  readonly emergencyAccessProcedure: boolean;
  readonly automaticLogoffPolicy: boolean;
  readonly encryptionDecryptionPolicy: boolean;
  readonly auditControls: boolean;
  readonly integrityControls: boolean;
  readonly personEntityAuthentication: boolean;
  readonly transmissionSecurity: boolean;
}

export interface HIPAAContingencyPlan {
  readonly dataBackupPlan: boolean;
  readonly disasterRecoveryPlan: boolean;
  readonly emergencyModeOperationsPlan: boolean;
  readonly testingAndRevisionProcedures: boolean;
  readonly applicationsAndDataCriticalityAnalysis: boolean;
  readonly lastTestAt: string;
  readonly provenance: readonly string[];
}

export interface HIPAABusinessAssociateAgreement {
  readonly id: string;
  readonly counterparty: string;
  readonly permittedUsesDisclosuresDefined: boolean;
  readonly safeguardsRequired: boolean;
  readonly incidentAndBreachReportingRequired: boolean;
  readonly individualRightsSupportRequired: boolean;
  readonly hhsAccessRequired: boolean;
  readonly returnOrDestroyAtTerminationRequired: boolean;
  readonly subcontractorFlowDownRequired: boolean;
  readonly terminationForMaterialBreachAllowed: boolean;
  readonly executed: boolean;
  readonly provenance: readonly string[];
}

export interface HIPAABreachRiskAssessment {
  readonly id: string;
  readonly impermissibleUseOrDisclosure: boolean;
  readonly natureExtentAssessed: boolean;
  readonly unauthorizedRecipientAssessed: boolean;
  readonly actuallyAcquiredOrViewedAssessed: boolean;
  readonly mitigationAssessed: boolean;
  readonly lowProbabilityCompromised: boolean;
  readonly discoveredAt: string;
  readonly individualsNotifiedAt?: string;
  readonly coveredEntityNotifiedAt?: string;
  readonly hhsNotificationPrepared: boolean;
  readonly mediaNotificationPreparedWhenRequired: boolean;
  readonly provenance: readonly string[];
}

export interface HIPAAPrivacyControls {
  readonly minimumNecessary: boolean;
  readonly usesDisclosuresAuthorized: boolean;
  readonly noticeOfPrivacyPracticesProcess: boolean;
  readonly accessRequestProcess: boolean;
  readonly amendmentRequestProcess: boolean;
  readonly accountingOfDisclosuresProcess: boolean;
  readonly restrictionRequestProcess: boolean;
  readonly confidentialCommunicationsProcess: boolean;
  readonly authorizationManagement: boolean;
  readonly complaintsAndNonRetaliationProcess: boolean;
  readonly sanctionsPolicy: boolean;
}

export const evaluateHIPAAScope = (scope: HIPAAScopeAssessment): HIPAAEntityRole => {
  if (!scope.determinationDocumented || scope.provenance.length === 0) throw new Error('HIPAA_SCOPE_DOCUMENTATION_REQUIRED');
  if (!scope.createsReceivesMaintainsTransmitsPHI || !scope.coveredFunctionOrBAService) return 'NOT_IN_SCOPE';
  return scope.role;
};

export const evaluateHIPAARiskAnalysis = (analysis: HIPAARiskAnalysis): ControlDecision => {
  if (!analysis.id.trim() || !analysis.securityOfficial.trim() || analysis.provenance.length === 0) return 'BLOCK';
  if (!analysis.ephiInventoryComplete || !analysis.locationsCovered || !analysis.threatsAndVulnerabilitiesDocumented) return 'BLOCK';
  if (analysis.riskItems.length === 0) return 'BLOCK';
  for (const item of analysis.riskItems) {
    if (!item.id.trim() || !item.asset.trim() || !item.threat.trim() || !item.vulnerability.trim() || !item.mitigation.trim() || !item.owner.trim()) return 'BLOCK';
    if (item.likelihood * item.impact >= 15 && item.residualRiskAccepted) return 'REVIEW';
  }
  return 'PASS';
};

export const validateHIPAASafeguards = (controls: HIPAASecuritySafeguards): boolean =>
  Object.keys(controls).every((key) => (controls as unknown as Record<string, boolean>)[key] === true);

export const validateHIPAAContingencyPlan = (plan: HIPAAContingencyPlan): HIPAAContingencyPlan => {
  if (plan.provenance.length === 0) throw new Error('HIPAA_CONTINGENCY_PROVENANCE_REQUIRED');
  if (!plan.dataBackupPlan || !plan.disasterRecoveryPlan || !plan.emergencyModeOperationsPlan) throw new Error('HIPAA_CONTINGENCY_CORE_REQUIRED');
  if (!plan.testingAndRevisionProcedures || !plan.applicationsAndDataCriticalityAnalysis || !plan.lastTestAt) throw new Error('HIPAA_CONTINGENCY_TESTING_REQUIRED');
  return plan;
};

export const validateHIPAABAA = (baa: HIPAABusinessAssociateAgreement): HIPAABusinessAssociateAgreement => {
  if (!baa.id.trim() || !baa.counterparty.trim() || baa.provenance.length === 0) throw new Error('HIPAA_BAA_IDENTITY_REQUIRED');
  const required = [
    baa.permittedUsesDisclosuresDefined,
    baa.safeguardsRequired,
    baa.incidentAndBreachReportingRequired,
    baa.individualRightsSupportRequired,
    baa.hhsAccessRequired,
    baa.returnOrDestroyAtTerminationRequired,
    baa.subcontractorFlowDownRequired,
    baa.terminationForMaterialBreachAllowed,
    baa.executed,
  ];
  if (!required.every(Boolean)) throw new Error('HIPAA_BAA_REQUIREMENTS_INCOMPLETE');
  return baa;
};

export const evaluateHIPAABreach = (breach: HIPAABreachRiskAssessment): ControlDecision => {
  if (!breach.id.trim() || breach.provenance.length === 0) return 'BLOCK';
  if (!breach.impermissibleUseOrDisclosure) return 'PASS';
  if (!breach.natureExtentAssessed || !breach.unauthorizedRecipientAssessed || !breach.actuallyAcquiredOrViewedAssessed || !breach.mitigationAssessed) return 'BLOCK';
  if (breach.lowProbabilityCompromised) return 'PASS';
  if (!breach.individualsNotifiedAt) return 'BLOCK';
  if (hoursBetween(breach.discoveredAt, breach.individualsNotifiedAt) > 60 * 24) return 'BLOCK';
  if (!breach.hhsNotificationPrepared) return 'BLOCK';
  return 'PASS';
};

export const validateHIPAAPrivacyControls = (controls: HIPAAPrivacyControls): boolean =>
  Object.keys(controls).every((key) => (controls as unknown as Record<string, boolean>)[key] === true);

export const GDPR_HIPAA_CONTROL_MATRIX = {
  version: '1.0.0',
  command: '/glass certify crm',
  gdpr: {
    principles: true,
    transparencyArticles12to14: true,
    lawfulBasisArticle6: true,
    specialCategoryArticle9: true,
    recordsOfProcessingArticle30: true,
    privacyByDesignArticle25: true,
    processorContractsArticle28: true,
    securityArticle32: true,
    breachArticles33to34: true,
    dpiaArticle35: true,
    priorConsultationArticle36: true,
    dpoArticles37to39: true,
    internationalTransfersChapterV: true,
    dataSubjectRights: true,
    automatedDecisionSafeguards: true,
  },
  hipaa: {
    scopeDetermination: true,
    privacyRule: true,
    minimumNecessary: true,
    individualRights: true,
    administrativeSafeguards: true,
    physicalSafeguards: true,
    technicalSafeguards: true,
    riskAnalysis: true,
    riskManagement: true,
    contingencyPlan: true,
    incidentResponse: true,
    breachNotification: true,
    businessAssociateAgreements: true,
    subcontractorFlowDown: true,
    periodicEvaluation: true,
    sixYearDocumentationRetention: true,
  },
  boundary: {
    softwarePolicyControlsComplete: true,
    productionOperationalEvidenceRequired: true,
    externalLegalDeterminationIssued: false,
    hipaaGovernmentCertificationProgramExists: false,
  },
} as const;
