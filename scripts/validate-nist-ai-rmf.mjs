#!/usr/bin/env node
import fs from "node:fs";

const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const fail = (message) => {
  console.error("[NIST-AI-RMF] RED:", message);
  process.exit(1);
};
const requireTrue = (condition, message) => {
  if (!condition) fail(message);
};

const profile = read(".xunia/nist-ai-rmf.json");
const router = read(".black-house/mission-router.json");
const kernel = read(".black-house/kernel.json");
const ecosystem = read(".xunia/ecosystem-v4.json");

const POLICY_ID = "NIST_AI_RMF_1_0_XUNIA_PROFILE_V1";
const FUNCTIONS = ["GOVERN", "MAP", "MEASURE", "MANAGE"];
const RISK_OBJECTS = [
  "RiskProfile",
  "RiskAssessment",
  "TEVVRecord",
  "ResidualRisk",
  "DecommissionPlan",
  "RiskDecision"
];
const RISK_RELATIONS = [
  "ASSESSES",
  "MEASURES",
  "MITIGATES",
  "MONITORS",
  "HAS_RESIDUAL_RISK",
  "DECOMMISSIONS",
  "CONFORMS_TO_PROFILE"
];

requireTrue(profile.policyId === POLICY_ID, "profile id mismatch");
requireTrue(profile.status === "ADOPTED_INTERNAL_PROFILE", "profile adoption state missing");
requireTrue(profile.ownerScope === "github.com/sonoxo/*", "owner scope must remain explicit");
requireTrue(profile.enforcement?.failClosed === true, "profile must fail closed");
requireTrue(profile.enforcement?.requireMissionRiskEnvelope === true, "mission risk envelope must be required");
requireTrue(profile.enforcement?.requireHumanOwner === true, "human risk owner must be required");
requireTrue(profile.enforcement?.requireTEVVBeforeGreen === true, "TEVV must be required before GREEN");
requireTrue(profile.enforcement?.criticalRiskDefault === "HOLD", "critical risk must default to HOLD");
requireTrue(FUNCTIONS.every((fn) => profile.enforcement?.requireFunctions?.includes(fn)), "GOVERN/MAP/MEASURE/MANAGE coverage incomplete");

requireTrue(router.governanceProfile === ".xunia/nist-ai-rmf.json", "router is not bound to governance profile");
requireTrue(router.nistAiRmf?.profileId === POLICY_ID, "router policy id mismatch");
requireTrue(router.nistAiRmf?.riskEnvelopeRequired === true, "router must require risk envelope");
requireTrue(router.nistAiRmf?.manageDecisionRequiredBeforeDispatch === true, "MANAGE decision must precede dispatch");
requireTrue(router.nistAiRmf?.criticalRiskDefault === "HOLD", "router critical-risk default mismatch");

requireTrue(kernel.governanceProfile === ".xunia/nist-ai-rmf.json", "kernel governance profile missing");
requireTrue(kernel.riskManagement?.profileId === POLICY_ID, "kernel NIST profile mismatch");
requireTrue(RISK_OBJECTS.every((x) => kernel.objectTypes.includes(x)), "risk ontology objects incomplete");
requireTrue(RISK_RELATIONS.every((x) => kernel.relationshipTypes.includes(x)), "risk ontology relationships incomplete");

requireTrue(ecosystem.governance_profile === POLICY_ID, "ecosystem governance profile mismatch");
requireTrue(ecosystem.governance_contract === ".xunia/nist-ai-rmf.json", "ecosystem governance contract mismatch");
requireTrue(ecosystem.repository_scope === "github.com/sonoxo/*", "ecosystem repository scope mismatch");
requireTrue(FUNCTIONS.every((fn) => ecosystem.governance_functions.includes(fn)), "ecosystem RMF functions incomplete");

console.log("[NIST-AI-RMF] GREEN");
console.log("profile=" + POLICY_ID);
console.log("scope=github.com/sonoxo/*");
console.log("functions=" + FUNCTIONS.join(","));
console.log("critical_risk_default=HOLD");
