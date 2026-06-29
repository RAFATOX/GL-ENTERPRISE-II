import {
  EventTypes,
  KnowledgeSourceTypes,
  Roles
} from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

const activeStatus = "active";
const archivedStatus = "archived";
const carrierDocumentTypes = Object.freeze([
  "professional_competence_certificate",
  "carrier_license",
  "ocp",
  "adr_certificate"
]);
const academyTypes = new Set([
  KnowledgeSourceTypes.ACADEMY_MATERIAL,
  KnowledgeSourceTypes.TEST_QUESTION_BANK,
  KnowledgeSourceTypes.TRAINING_MODULE,
  KnowledgeSourceTypes.CERTIFICATION_PATH
]);

export class KnowledgeEngine {
  constructor(state) {
    this.state = state;
    ensureKnowledgeState(this.state);
  }

  all() {
    return this.state.knowledgeSources;
  }

  getById(sourceId) {
    return this.state.knowledgeSources.find((source) => (
      source.id === sourceId || source.knowledge_source_id === sourceId
    )) || null;
  }

  registerSource(actor, payload) {
    const id = payload.knowledge_source_id || payload.id || createId("knowledge_source");
    const auditLogId = createId("audit");
    const source = normalizeSource({
      id,
      knowledge_source_id: id,
      title: payload.title,
      type: payload.type,
      description: payload.description,
      jurisdiction_country: payload.jurisdiction_country || payload.country || "EU",
      language: payload.language || "pl",
      version: payload.version || "1.0",
      valid_from: payload.valid_from || payload.validFrom || nowIso(),
      valid_to: payload.valid_to || payload.validTo || null,
      status: payload.status || activeStatus,
      tags: normalizeList(payload.tags),
      related_roles: normalizeList(payload.related_roles || payload.relatedRoles),
      related_modules: normalizeList(payload.related_modules || payload.relatedModules),
      source_reference: payload.source_reference || payload.sourceReference || "demo",
      created_at: nowIso(),
      updated_at: nowIso(),
      audit_log_id: auditLogId,
      auditLogId
    });
    this.state.knowledgeSources.unshift(source);

    return {
      source,
      events: [knowledgeEvent(EventTypes.KNOWLEDGE_SOURCE_CREATED, source, actor, null, source.status)]
    };
  }

  updateSource(actor, payload) {
    const source = this.getById(payload.knowledge_source_id || payload.id);
    const previous = source ? { ...source } : null;
    if (!source) {
      return { ok: false, reasons: ["knowledge source not found"], events: [] };
    }

    [
      "title",
      "type",
      "description",
      "jurisdiction_country",
      "language",
      "version",
      "valid_from",
      "valid_to",
      "status",
      "source_reference"
    ].forEach((field) => {
      if (payload[field] !== undefined) source[field] = payload[field];
    });
    if (payload.tags !== undefined) source.tags = normalizeList(payload.tags);
    if (payload.related_roles !== undefined || payload.relatedRoles !== undefined) {
      source.related_roles = normalizeList(payload.related_roles || payload.relatedRoles);
    }
    if (payload.related_modules !== undefined || payload.relatedModules !== undefined) {
      source.related_modules = normalizeList(payload.related_modules || payload.relatedModules);
    }
    source.updated_at = nowIso();
    const auditLogId = createId("audit");
    source.audit_log_id = auditLogId;
    source.auditLogId = auditLogId;

    return {
      source,
      events: [knowledgeEvent(EventTypes.KNOWLEDGE_SOURCE_UPDATED, source, actor, previous?.version, source.version)]
    };
  }

  archiveSource(actor, payload) {
    const source = this.getById(payload.knowledge_source_id || payload.id);
    const previous = source?.status || null;
    if (!source) {
      return { ok: false, reasons: ["knowledge source not found"], events: [] };
    }
    source.status = archivedStatus;
    source.updated_at = nowIso();
    const auditLogId = createId("audit");
    source.audit_log_id = auditLogId;
    source.auditLogId = auditLogId;

    return {
      source,
      events: [knowledgeEvent(EventTypes.KNOWLEDGE_SOURCE_ARCHIVED, source, actor, previous, archivedStatus)]
    };
  }

  search(query = {}) {
    const text = normalizeText(query.title || query.text || query.q);
    const type = normalizeText(query.type);
    const country = normalizeText(query.country || query.jurisdiction_country);
    const role = normalizeText(query.role);
    const moduleId = normalizeText(query.module || query.moduleId);
    const language = normalizeText(query.language);
    const tags = normalizeList(query.tags).map(normalizeText);
    const includeInactive = Boolean(query.includeInactive);

    return this.state.knowledgeSources.filter((source) => {
      if (!includeInactive && source.status !== activeStatus) return false;
      if (text && !normalizeText(`${source.title} ${source.description}`).includes(text)) return false;
      if (type && normalizeText(source.type) !== type) return false;
      if (country && !countryMatches(source.jurisdiction_country, country)) return false;
      if (language && normalizeText(source.language) !== language) return false;
      if (role && !source.related_roles.map(normalizeText).includes(role)) return false;
      if (moduleId && !source.related_modules.map(normalizeText).includes(moduleId)) return false;
      if (tags.length && !tags.every((tag) => source.tags.map(normalizeText).includes(tag))) return false;
      return true;
    });
  }

  getRelevantKnowledge(context = {}) {
    const roles = normalizeList(context.role || context.roles);
    const countries = normalizeList(context.country || context.countries);
    const modules = normalizeList(context.module || context.modules);
    const tags = contextTags(context);
    const candidates = this.search({ includeInactive: false }).filter((source) => {
      const roleMatch = !roles.length || roles.some((role) => source.related_roles.includes(role));
      const countryMatch = !countries.length || countries.some((country) => countryMatches(source.jurisdiction_country, country));
      const moduleMatch = !modules.length || modules.some((moduleId) => source.related_modules.includes(moduleId));
      const tagMatch = !tags.length || tags.some((tag) => source.tags.includes(tag));
      return roleMatch && countryMatch && (moduleMatch || tagMatch || roles.length || countries.length);
    });

    return {
      sources: uniqueById(candidates),
      warnings: knowledgeWarnings(candidates, context),
      carrierDocuments: this.carrierDocumentStatus(context.company_id || context.companyId)
    };
  }

  carrierDocumentStatus(companyId) {
    if (!companyId) {
      return {
        companyId: null,
        requiredTypes: [...carrierDocumentTypes],
        presentTypes: [],
        missingTypes: [...carrierDocumentTypes]
      };
    }
    const documents = (this.state.companyDocuments || []).filter((document) => document.companyId === companyId);
    const presentTypes = [...new Set(documents.map((document) => document.type).filter((type) => carrierDocumentTypes.includes(type)))];
    return {
      companyId,
      requiredTypes: [...carrierDocumentTypes],
      presentTypes,
      missingTypes: carrierDocumentTypes.filter((type) => !presentTypes.includes(type))
    };
  }

  academySources() {
    return this.state.knowledgeSources.filter((source) => academyTypes.has(source.type));
  }
}

export function ensureKnowledgeState(state) {
  state.knowledgeSources ||= [];
  state.knowledgeQueries ||= [];
}

function normalizeSource(input) {
  const id = input.knowledge_source_id || input.id || createId("knowledge_source");
  const auditLogId = input.audit_log_id || input.auditLogId || createId("audit");
  return {
    id,
    knowledge_source_id: id,
    title: input.title || "Zrodlo wiedzy GL",
    type: input.type || KnowledgeSourceTypes.GL_INTERNAL_POLICY,
    description: input.description || "",
    jurisdiction_country: input.jurisdiction_country || "EU",
    language: input.language || "pl",
    version: input.version || "1.0",
    valid_from: input.valid_from || null,
    valid_to: input.valid_to || null,
    status: input.status || activeStatus,
    tags: normalizeList(input.tags),
    related_roles: normalizeList(input.related_roles),
    related_modules: normalizeList(input.related_modules),
    source_reference: input.source_reference || "demo",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || nowIso(),
    audit_log_id: auditLogId,
    auditLogId
  };
}

function knowledgeEvent(type, source, actor, previousState, newState) {
  return {
    type,
    objectType: "knowledge_source",
    objectId: source.knowledge_source_id,
    previousState,
    newState,
    reason: `Knowledge Engine: ${source.title}`,
    audit_log_id: source.audit_log_id,
    auditLogId: source.audit_log_id,
    actorId: actor?.userId || null
  };
}

function contextTags(context) {
  return [
    context.transport_type,
    context.transportType,
    context.vehicle_type,
    context.vehicleType,
    context.cargo_type,
    context.cargoType,
    context.adr_required ? "adr" : null,
    context.driver_id ? "driver" : null,
    context.company_id || context.companyId ? "company" : null
  ].filter(Boolean).map(String);
}

function knowledgeWarnings(sources, context) {
  const warnings = [];
  if (context.adr_required && sources.some((source) => source.type === KnowledgeSourceTypes.ADR_REGULATION)) {
    warnings.push("ADR moze wymagac dokumentow pojazdu, kierowcy i ladunku.");
  }
  if (sources.some((source) => source.type === KnowledgeSourceTypes.DRIVER_WORK_TIME)) {
    warnings.push("Sprawdz czas pracy kierowcy i odpoczynek przed planowaniem trasy.");
  }
  if (sources.some((source) => source.type === KnowledgeSourceTypes.CARRIER_LICENSE)) {
    warnings.push("Przewoznik moze potrzebowac aktywnej licencji transportowej.");
  }
  return [...new Set(warnings)];
}

function countryMatches(sourceCountry, queryCountry) {
  const source = normalizeText(sourceCountry);
  const query = normalizeText(queryCountry);
  return source === query || source === "eu" || source === "global";
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function normalizeText(value = "") {
  return String(value || "").trim().toLowerCase();
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    const id = item.knowledge_source_id || item.id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
