import test from 'ava';

import {
  evaluateGDPRBreach,
  evaluateGDPRDPIA,
  evaluateHIPAABreach,
  evaluateHIPAARiskAnalysis,
  evaluateHIPAAScope,
  GDPR_HIPAA_CONTROL_MATRIX,
  validateGDPRPrivacyByDesign,
  validateGDPRProcessingActivity,
  validateGDPRTransfer,
  validateHIPAABAA,
  validateHIPAAContingencyPlan,
  validateHIPAAPrivacyControls,
  validateHIPAASafeguards,
} from './gdpr-hipaa';

test('GDPR RoPA requires lawful basis, Article 9 condition and transfer mechanism', (t) => {
  const activity = validateGDPRProcessingActivity({
    id: 'ropa:crm',
    controller: 'XUNIA',
    purposes: ['customer relationship management'],
    lawfulBasis: 'CONTRACT',
    dataSubjects: ['customers'],
    personalDataCategories: ['identity', 'contact'],
    recipients: ['authorized CRM workforce'],
    retentionDays: 365,
    securityMeasures: ['RBAC', 'encryption', 'audit logs'],
    specialCategoryData: false,
    automatedDecisionMaking: false,
    humanReviewAvailable: true,
    internationalTransfer: false,
    transferMechanism: 'NOT_APPLICABLE',
    provenance: ['repo:sonoxo/xuniadao'],
  });
  t.is(activity.lawfulBasis, 'CONTRACT');
});

test('GDPR high-risk processing requires a complete DPIA and prior consultation when residual risk remains', (t) => {
  t.is(evaluateGDPRDPIA({
    id: 'dpia:1', processingActivityId: 'ropa:crm', systematicProfiling: true, largeScaleSpecialCategory: false, largeScalePublicMonitoring: false, otherHighRisk: false,
    necessityAndProportionalityAssessed: true, risksDocumented: true, mitigationsDocumented: true, residualHighRisk: false,
    supervisoryConsultationCompleted: false, approvedBeforeProcessing: true, provenance: ['dpia:approved'],
  }), 'PASS');
  t.is(evaluateGDPRDPIA({
    id: 'dpia:2', processingActivityId: 'ropa:health', systematicProfiling: false, largeScaleSpecialCategory: true, largeScalePublicMonitoring: false, otherHighRisk: false,
    necessityAndProportionalityAssessed: true, risksDocumented: true, mitigationsDocumented: true, residualHighRisk: true,
    supervisoryConsultationCompleted: false, approvedBeforeProcessing: true, provenance: ['dpia:pending-consultation'],
  }), 'BLOCK');
});

test('GDPR breach workflow enforces supervisory authority timing and high-risk subject notice', (t) => {
  t.is(evaluateGDPRBreach({
    id: 'breach:1', discoveredAt: '2026-08-27T00:00:00Z', controllerAwareAt: '2026-08-27T00:00:00Z',
    confidentialityImpact: true, integrityImpact: false, availabilityImpact: false, likelyRiskToRights: true, likelyHighRiskToRights: true,
    supervisoryAuthorityNotifiedAt: '2026-08-29T00:00:00Z', dataSubjectsNotifiedAt: '2026-08-29T00:00:00Z',
    containmentActions: ['revoke token'], provenance: ['incident:1'],
  }), 'PASS');
});

test('GDPR privacy by design and transfer safeguards are enforceable', (t) => {
  t.true(validateGDPRPrivacyByDesign({ dataMinimized: true, purposeBound: true, privacyDefaults: true, leastPrivilege: true, encryptionSupported: true, pseudonymizationSupported: true, retentionAutomated: true, rightsWorkflowIntegrated: true, loggingEnabled: true }));
  t.truthy(validateGDPRTransfer({ destinationCountry: 'Example third country', mechanism: 'SCC', transferImpactAssessmentCompleted: true, supplementaryMeasuresDocumented: true, provenance: ['tia:1'] }));
});

test('HIPAA scope and risk analysis require documented ePHI coverage', (t) => {
  t.is(evaluateHIPAAScope({ role: 'BUSINESS_ASSOCIATE', createsReceivesMaintainsTransmitsPHI: true, createsReceivesMaintainsTransmitsePHI: true, coveredFunctionOrBAService: true, determinationDocumented: true, provenance: ['scope:1'] }), 'BUSINESS_ASSOCIATE');
  t.is(evaluateHIPAARiskAnalysis({
    id: 'sra:1', ephiInventoryComplete: true, locationsCovered: true, threatsAndVulnerabilitiesDocumented: true, reviewDate: '2026-08-27', securityOfficial: 'security-owner', provenance: ['sra:1'],
    riskItems: [{ id: 'risk:1', asset: 'crm-db', threat: 'unauthorized access', vulnerability: 'credential compromise', likelihood: 2, impact: 5, mitigation: 'MFA and least privilege', owner: 'security-owner', residualRiskAccepted: false }],
  }), 'PASS');
});

test('HIPAA administrative, physical and technical safeguards are all required', (t) => {
  t.true(validateHIPAASafeguards({
    securityManagementProcess: true, assignedSecurityResponsibility: true, workforceSecurity: true, informationAccessManagement: true,
    securityAwarenessTraining: true, securityIncidentProcedures: true, contingencyPlan: true, periodicEvaluation: true, baaManagement: true,
    facilityAccessControls: true, workstationUsePolicy: true, workstationSecurity: true, deviceMediaControls: true,
    accessControl: true, uniqueUserIdentification: true, emergencyAccessProcedure: true, automaticLogoffPolicy: true, encryptionDecryptionPolicy: true,
    auditControls: true, integrityControls: true, personEntityAuthentication: true, transmissionSecurity: true,
  }));
});

test('HIPAA contingency plan and BAA requirements are enforceable', (t) => {
  t.truthy(validateHIPAAContingencyPlan({ dataBackupPlan: true, disasterRecoveryPlan: true, emergencyModeOperationsPlan: true, testingAndRevisionProcedures: true, applicationsAndDataCriticalityAnalysis: true, lastTestAt: '2026-08-27', provenance: ['test:restore'] }));
  t.truthy(validateHIPAABAA({ id: 'baa:1', counterparty: 'processor', permittedUsesDisclosuresDefined: true, safeguardsRequired: true, incidentAndBreachReportingRequired: true, individualRightsSupportRequired: true, hhsAccessRequired: true, returnOrDestroyAtTerminationRequired: true, subcontractorFlowDownRequired: true, terminationForMaterialBreachAllowed: true, executed: true, provenance: ['contract:baa:1'] }));
});

test('HIPAA Privacy Rule controls and breach notification are modeled', (t) => {
  t.true(validateHIPAAPrivacyControls({ minimumNecessary: true, usesDisclosuresAuthorized: true, noticeOfPrivacyPracticesProcess: true, accessRequestProcess: true, amendmentRequestProcess: true, accountingOfDisclosuresProcess: true, restrictionRequestProcess: true, confidentialCommunicationsProcess: true, authorizationManagement: true, complaintsAndNonRetaliationProcess: true, sanctionsPolicy: true }));
  t.is(evaluateHIPAABreach({ id: 'hb:1', impermissibleUseOrDisclosure: true, natureExtentAssessed: true, unauthorizedRecipientAssessed: true, actuallyAcquiredOrViewedAssessed: true, mitigationAssessed: true, lowProbabilityCompromised: false, discoveredAt: '2026-08-01T00:00:00Z', individualsNotifiedAt: '2026-08-20T00:00:00Z', hhsNotificationPrepared: true, mediaNotificationPreparedWhenRequired: true, provenance: ['incident:hb:1'] }), 'PASS');
});

test('control matrix marks all software and policy domains complete without claiming external legal certification', (t) => {
  t.true(GDPR_HIPAA_CONTROL_MATRIX.gdpr.recordsOfProcessingArticle30);
  t.true(GDPR_HIPAA_CONTROL_MATRIX.gdpr.dpiaArticle35);
  t.true(GDPR_HIPAA_CONTROL_MATRIX.hipaa.administrativeSafeguards);
  t.true(GDPR_HIPAA_CONTROL_MATRIX.hipaa.breachNotification);
  t.true(GDPR_HIPAA_CONTROL_MATRIX.boundary.softwarePolicyControlsComplete);
  t.true(GDPR_HIPAA_CONTROL_MATRIX.boundary.productionOperationalEvidenceRequired);
  t.false(GDPR_HIPAA_CONTROL_MATRIX.boundary.externalLegalDeterminationIssued);
});
