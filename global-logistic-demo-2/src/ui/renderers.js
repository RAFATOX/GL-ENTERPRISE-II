import {
  ActionTypes,
  AllRoles,
  DEMO_MODE,
  RoleLabels,
  Roles,
  StatusProgress,
  TransportStatuses
} from "../core/constants.js";
import {
  getRoleConfig,
  menuForRole,
  viewAllowedForRole
} from "./role-config.js";

export function renderApp(state, engine) {
  state = sanitizeStateForUi(state);
  const selected = selectedTransport(state);
  const roleConfig = getRoleConfig(state.session.role);
  const activeView = state.session.deniedView
    ? state.session.deniedView
    : viewAllowedForRole(state.session.role, state.session.view)
    ? state.session.view
    : "dashboard";
  return localizeHtml(`
    <div class="app-shell role-${state.session.role}">
      <aside class="side">
        <div class="brand">
          <div class="brand-mark">GL</div>
          <div>
            <strong>GL Enterprise II</strong>
            <span>${roleConfig.workspace}</span>
          </div>
        </div>
        ${renderAppNavigation(state, activeView)}
        <div class="core-seal">
          <span>Aktywna przestrzen</span>
          <strong>${roleConfig.workspace}: moduly wynikaja z Permission Engine i modulesConfig.</strong>
        </div>
      </aside>
      <main class="main">
        ${renderTopbar(state, activeView, roleConfig)}
        ${renderLastResult(state)}
        ${renderView(state, engine, selected, activeView)}
      </main>
      ${renderContextRail(state, engine, selected, roleConfig)}
    </div>
  `);
}

function renderAppNavigation(state, activeView) {
  const items = menuForRole(state.session.role);
  const buttons = items.map((item) => `
    <button class="module-nav-button ${activeView === item.id ? "active" : ""}" data-module-route="${item.route}" data-view="${item.id}">
      <span class="module-icon">${item.icon}</span>
      <span>${item.label}</span>
    </button>
  `).join("");
  return `
    <nav class="nav nav-desktop">
      ${buttons}
    </nav>
    <details class="mobile-menu">
      <summary>Menu</summary>
      <nav class="nav">${buttons}</nav>
    </details>
  `;
}

function renderTopbar(state, activeView, roleConfig) {
  return `
    <header class="topbar">
      <div>
        <span class="eyebrow">${roleConfig.workspace} / GL Enterprise II</span>
        <h1>${viewTitle(state.session.role, activeView)}</h1>
      </div>
      <div class="role-login">
        <label>
          <span>Aktywna rola</span>
          <select data-role-select aria-label="Aktywna rola">
            ${AllRoles.map((role) => `
              <option value="${role}" ${state.session.role === role ? "selected" : ""}>${RoleLabels[role]}</option>
            `).join("")}
          </select>
        </label>
        <button class="reset-demo" data-reset-demo="true">Reset demo data</button>
      </div>
    </header>
  `;
}

function renderLastResult(state) {
  const result = state.session.lastResult;
  if (!result) {
    return `
      <section class="result ok">
        <strong>Rdzen GL gotowy</strong>
        <span>Wybierz akcje. System sprawdzi uprawnienia, walidacje, workflow i audit log.</span>
      </section>
    `;
  }
  const statusLabel = result.result === "error"
    ? "Blad akcji"
    : result.ok ? "Akcja wykonana" : "Akcja zablokowana";
  return `
    <section class="result ${result.ok ? "ok" : "blocked"}">
      <strong>${statusLabel}</strong>
      <span>${result.ok ? result.events.join(", ") : result.reasons.join("; ")}</span>
    </section>
  `;
}

function renderView(state, engine, selected, activeView = state.session.view) {
  const view = activeView;
  if (state.session.deniedView) return renderModuleAccessDenied(state);
  if (view === "system_tests") return renderSystemTests(state, engine, selected);
  if (view === "profile") return renderProfile(state);
  if (view === "companies") return renderCompanies(state);
  if (view === "users") return renderUsers(state);
  if (view === "statistics") return renderStatistics(state);
  if (view === "system") return renderSystem(state, engine);
  if (view === "auth") return renderAuth(state, engine);
  if (view === "roles") return renderRoles(state, engine);
  if (view === "transports") return renderTransportList(state);
  if (!selected && transportScopedView(view)) return renderNoTransport(state, engine);
  if (view === "live_map") return renderGps(state, engine, selected);
  if (view === "photos") return renderPhotos(state, engine, selected);
  if (view === "academy") return renderAcademy(state);
  if (view === "details") return renderDetails(state, engine, selected);
  if (view === "shipments") return renderShipments(state);
  if (view === "create") return renderCreateLoad(state, engine, selected);
  if (view === "warehouse") return renderWarehouse(state, engine, selected);
  if (view === "carrier") return renderCarrier(state, engine, selected);
  if (view === "driver_assignment") return renderDriverAssignment(state, engine, selected);
  if (view === "gps") return renderGps(state, engine, selected);
  if (view === "parking") return renderParking(state, engine, selected);
  if (view === "documents") return renderDocuments(state, engine, selected);
  if (view === "platform_wallet") return renderPlatformWallet(state, engine, selected);
  if (view === "billing") return renderBillingModule(state, "billing");
  if (view === "invoices") return renderBillingModule(state, "invoices");
  if (view === "policies") return renderPolicies(state);
  if (view === "claims") return renderClaims(state, engine, selected);
  if (view === "risk") return renderRisk(state);
  if (view === "payments") return renderPayments(state, engine, selected);
  if (view === "wallets") return renderWallets(state);
  if (view === "escrow") return renderEscrow(state);
  if (view === "revenue") return renderRevenue(state);
  if (view === "insurance") return renderInsurance(state, engine, selected);
  if (view === "jobs") return renderJobs(state);
  if (view === "communication") return renderCommunication(state, engine, selected);
  if (view === "translations") return renderTranslations(state, engine);
  if (view === "security") return renderSecurity(state, engine, selected);
  if (view === "customs") return renderCustoms(state, engine, selected);
  if (view === "authority") return renderAuthority(state, engine, selected);
  if (view === "ferry") return renderFerry(state, engine, selected);
  if (view === "service_orders") return renderService(state, engine, selected);
  if (view === "service") return renderService(state, engine, selected);
  if (view === "api") return renderApi(state, engine);
  if (view === "integrations") return renderIntegrations(state, engine);
  if (view === "compliance") return renderCompliance(state, engine, selected);
  if (view === "resilience") return renderResilience(state, engine);
  if (view === "trust") return renderTrust(state);
  if (view === "ai") return renderAi(state, engine, selected);
  if (view === "audit") return renderAudit(state);
  if (view === "admin") return renderAdmin(state, engine, selected);
  return renderDashboard(state, engine, selected);
}

function renderDashboard(state, engine, selected) {
  const dashboardBlocked = state.transports.filter((transport) => transport.status === TransportStatuses.BLOCKED || transport.riskFlagged).length;
  const dashboardModules = menuForRole(state.session.role);
  return `
    <section class="metrics">
      ${metric("Moduly", dashboardModules.length, "widoczne dla roli")}
      ${metric("Transporty", state.transports.length, `${dashboardBlocked} blokad/ryzyk`)}
      ${metric("Dokumenty", state.documents.length, "w dostepnym zakresie")}
      ${metric("Zdarzenia", state.events.length, "event bus")}
      ${metric("Audit", state.audit.length, "read only")}
    </section>
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Dashboard</span>
            <h2>Jedna aplikacja modulowa</h2>
          </div>
        </div>
        <p class="muted">Ten sam Dashboard jest uzywany przez kazda role. Rola zmienia tylko widoczne moduly i dozwolone akcje przez Permission Engine.</p>
        <div class="pipeline">
          ${["MENU MODULOW", "PERMISSION ENGINE", "ROUTE GUARD", "ENGINE", "DATABASE", "EVENTS", "AUDIT LOG"].map((step) => `<span>${step}</span>`).join("")}
        </div>
      </article>
      ${selected ? renderTransportCard(state, selected) : renderNoTransport(state, engine)}
    </section>
    ${renderModuleMenuPanel(state)}
  `;
}

function renderModuleMenuPanel(state) {
  const modules = menuForRole(state.session.role);
  return `
    <section class="panel module-menu-panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">AppNavigation / Permission Guard</span>
          <h2>Menu modulow</h2>
        </div>
      </div>
      <div class="module-tile-grid">
        ${modules.map((module) => `
          <button class="module-tile" data-module-route="${module.route}" data-view="${module.id}">
            <span class="module-icon">${module.icon}</span>
            <strong>${module.label}</strong>
            <small>${module.requiredPermissions.join(", ")}</small>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderModuleAccessDenied(state) {
  return `
    <section class="panel access-panel">
      <span class="eyebrow">AccessDenied / Permission Guard</span>
      <h2>Brak dostepu do modulu</h2>
      <p class="muted">Rola ${RoleLabels[state.session.role] || state.session.role} nie ma dostepu do trasy ${state.session.deniedRoute || state.session.deniedView}. Wejscie zostalo zablokowane przez Permission Engine.</p>
    </section>
  `;
}

function renderAuth(state, engine) {
  const pending = state.users.find((user) => user.accountStatus === "pending") || state.users[state.users.length - 1];
  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Auth system</span>
            <h2>Phone login, register, verify, recover</h2>
          </div>
        </div>
        <div class="actions">
          ${actionButton(engine, ActionTypes.REGISTER_USER, "Register by phone", { phone: "+48500777111", role: Roles.CLIENT_DISPATCHER, language: "pl", companyId: "co-client-a", name: "Phone Demo User" })}
          ${actionButton(engine, ActionTypes.VERIFY_ACCOUNT, "Verify document + face", { userId: pending.id })}
          ${actionButton(engine, ActionTypes.CHANGE_PHONE, "Change phone safely", { userId: pending.id, phone: "+48500777222" })}
        </div>
      </article>
      <article class="panel">
        <h2>Accounts</h2>
        <div class="list">
          ${state.users.slice(0, 10).map((user) => `
            <div class="row">
              <strong>${user.name}</strong>
              <span>${user.phone}</span>
              <mark class="${tone(user.accountStatus)}">${user.accountStatus}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
  `;
}

function renderRoles(state, engine) {
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Permissions engine</span>
          <h2>Osobne uprawnienia dla kazdej roli</h2>
        </div>
      </div>
      <div class="role-grid">
        ${AllRoles.map((role) => `
          <article class="role-card ${state.session.role === role ? "active" : ""}">
            <button data-role="${role}">${RoleLabels[role]}</button>
            <p>${engine.modules.permissions.listForRole(role).slice(0, 8).join(", ")}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderTransportList(state) {
  if (!state.transports.length) return renderNoTransportTable();
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Transport Engine</span>
          <h2>Centralny obiekt systemu</h2>
        </div>
      </div>
      <div class="transport-table">
        <div class="table-row table-head">
          <span>ID</span><span>Client</span><span>Carrier</span><span>Status</span><span>GPS</span><span>Payment</span>
        </div>
        ${state.transports.map((transport) => `
          <button class="table-row ${state.session.selectedTransportId === transport.id ? "selected" : ""}" data-transport="${transport.id}">
            <span>${transport.number}</span>
            <span>${companyName(state, transport.clientCompanyId)}</span>
            <span>${companyName(state, transport.carrierCompanyId) || "not assigned"}</span>
            <span><mark class="${tone(transport.status)}">${transport.status}</mark></span>
            <span>${transport.pickup.gps && transport.delivery.gps ? "confirmed" : "missing"}</span>
            <span>${state.access?.canViewFinancials ? transport.paymentStatus : "restricted"}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderShipments(state) {
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">Shipment Engine</span>
          <h2>Oddzielne shipment_id dla kazdego ladunku</h2>
        </div>
      </div>
      <div class="transport-table compact-table">
        <div class="table-row table-head">
          <span>ID</span><span>Transport</span><span>Client</span><span>Status</span><span>Photos</span><span>Docs</span>
        </div>
        ${state.shipments.map((shipment) => `
          <div class="table-row">
            <span>${shipment.id}</span>
            <span>${transportNumber(state, shipment.transportId)}</span>
            <span>${companyName(state, shipment.clientCompanyId)}</span>
            <span><mark class="${tone(shipment.status)}">${shipment.status}</mark></span>
            <span>${shipment.photoIds.length}</span>
            <span>${shipment.documentIds.length}</span>
          </div>
        `).join("") || `<p class="muted">No visible shipments for this role.</p>`}
      </div>
    </section>
  `;
}

function renderDetails(state, engine, selected) {
  return `
    <section class="grid two">
      ${renderTransportCard(state, selected)}
      <article class="panel">
        <h2>Workflow blockers</h2>
        <div class="blockers">
          ${blockerList(engine, selected)}
        </div>
      </article>
    </section>
    <section class="grid two">
      ${renderTimeline(state, selected)}
      ${renderAuditSlice(state, selected)}
    </section>
  `;
}

function renderCreateLoad(state, engine, selected) {
  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Create load</span>
            <h2>Nowy transport przechodzi przez Core Engine</h2>
          </div>
        </div>
        ${renderCreateTransportForm(state)}
        <div class="actions">
          ${actionButton(engine, ActionTypes.CREATE_LOAD, "Create demo load", {
            clientCompanyId: "co-client-a",
            pickupAddress: "Wroclaw demo pickup",
            deliveryAddress: "Prague demo delivery",
            pickupGps: { lat: 51.1079, lng: 17.0385 },
            deliveryGps: { lat: 50.0755, lng: 14.4378 },
            description: "Nowy ladunek z Core Engine",
            weightKg: 1800,
            dimensions: "6 palet",
            price: 1600,
            warehouseWorkerId: "u-warehouse"
          })}
          ${selected ? actionButton(engine, ActionTypes.ADD_LOAD_PHOTO, "Add pre-publish photo", { transportId: selected.id, type: "pre_publish_load", label: "Zdjecie ladunku przed publikacja" }) : disabledAction("Add pre-publish photo", "Brak transportow")}
          ${selected ? actionButton(engine, ActionTypes.CONFIRM_GPS, "Confirm GPS", { transportId: selected.id, pickupGps: { lat: 51.1079, lng: 17.0385 }, deliveryGps: { lat: 50.0755, lng: 14.4378 } }) : disabledAction("Confirm GPS", "Brak transportow")}
          ${selected ? actionButton(engine, ActionTypes.PUBLISH_LOAD, "Publish selected load", { transportId: selected.id }) : disabledAction("Publish selected load", "Brak transportow")}
        </div>
      </article>
      ${selected ? renderTransportCard(state, selected) : renderNoTransport(state, engine)}
    </section>
  `;
}

function renderWarehouse(state, engine, selected) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Photo Engine</span>
        <h2>Warehouse photo step</h2>
        <p class="muted">Przed publikacja musi istniec zdjecie ladunku. Zdjecia trafiaja do dokumentacji i audytu.</p>
        ${renderPhotoForm(selected)}
        <div class="actions">
          ${actionButton(engine, ActionTypes.ADD_LOAD_PHOTO, "Photo before publication", { transportId: selected.id, type: "pre_publish_load", label: "Ladunek przed publikacja" })}
          ${actionButton(engine, ActionTypes.ADD_LOAD_PHOTO, "Photo at loading", { transportId: selected.id, type: "loading", label: "Zdjecie przy zaladunku" })}
          ${actionButton(engine, ActionTypes.CONFIRM_LOADING, "Confirm loading", { transportId: selected.id })}
        </div>
      </article>
      ${renderPhotoList(state, selected)}
    </section>
  `;
}

function renderCarrier(state, engine, selected) {
  const carriers = state.companies.filter((company) => company.type === "carrier");
  return `
    <section class="panel">
      <span class="eyebrow">Carrier acceptance</span>
      <h2>Trust score blokuje ryzykownych przewoznikow</h2>
      <div class="card-grid">
        ${carriers.map((carrier) => `
          <article class="mini-card">
            <strong>${carrier.name}</strong>
            <span>Trust ${carrier.trustScore}</span>
            ${actionButton(engine, ActionTypes.ACCEPT_CARRIER, "Accept carrier", { transportId: selected.id, carrierCompanyId: carrier.id })}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderDriverAssignment(state, engine, selected) {
  const drivers = state.users.filter((user) => user.roles.includes(Roles.DRIVER));
  return `
    <section class="panel">
      <span class="eyebrow">Driver Time Engine</span>
      <h2>Driver assignment</h2>
      ${renderDriverAssignmentForm(state, selected)}
      <div class="card-grid">
        ${drivers.map((driver) => {
          const vehicle = state.vehicles.find((item) => item.companyId === driver.companyId);
          return `
            <article class="mini-card">
              <strong>${driver.name}</strong>
              <span>${companyName(state, driver.companyId)} / docs ${driver.documentsValid ? "valid" : "invalid"}</span>
              <span>${driverTimeLabel(state, driver.id)}</span>
              ${actionButton(engine, ActionTypes.ASSIGN_DRIVER, "Assign", { transportId: selected.id, driverId: driver.id, vehicleId: vehicle?.id })}
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderGps(state, engine, selected) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">GPS pipeline</span>
        <h2>Koordynaty sa wymagane</h2>
        <img class="map" src="./assets/route-network.svg" alt="GL route network" />
        <div class="detail-grid">
          <div><span>Pickup</span><strong>${gpsLabel(selected.pickup.gps)}</strong></div>
          <div><span>Delivery</span><strong>${gpsLabel(selected.delivery.gps)}</strong></div>
          <div><span>Deviation</span><strong>${selected.routeDeviation ? "yes" : "no"}</strong></div>
        </div>
        ${renderGpsForm(selected)}
        ${actionButton(engine, ActionTypes.CONFIRM_GPS, "Confirm selected GPS", { transportId: selected.id, pickupGps: { lat: 54.352, lng: 18.6466 }, deliveryGps: { lat: 52.52, lng: 13.405 } })}
      </article>
      ${renderTimeline(state, selected)}
    </section>
  `;
}

function renderParking(state, engine, selected) {
  return `
    <section class="panel">
      <span class="eyebrow">Parking Live Network</span>
      <h2>Reports affect trust score</h2>
      ${renderParkingReportForm(state)}
      <div class="card-grid">
        ${state.parking.map((parking) => `
          <article class="mini-card">
            <strong>${parking.name}</strong>
            <span>${parking.freePlaces} free / trust ${parking.trustScore}</span>
            <span>${parking.amenities.join(", ")}</span>
            ${actionButton(engine, ActionTypes.SELECT_PARKING, "Select", { transportId: selected.id, parkingId: parking.id })}
            ${actionButton(engine, ActionTypes.PARKING_REPORT, "Report free places", { parkingId: parking.id, freePlaces: parking.freePlaces + 2, photoAdded: true, credible: true })}
            ${actionButton(engine, ActionTypes.PARKING_REPORT, "False report demo", { parkingId: parking.id, freePlaces: 99, photoAdded: false, credible: false })}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderDocuments(state, engine, selected) {
  const docs = state.documents.filter((doc) => doc.transportId === selected.id);
  const cmr = state.digitalCmrs.find((item) => item.transportId === selected.id);
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Document Engine</span>
        <h2>Encrypted docs and integrity hashes</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.UPLOAD_DOCUMENT, "Upload CMR", { transportId: selected.id, type: "cmr", label: "CMR transportu" })}
          ${actionButton(engine, ActionTypes.UPLOAD_DOCUMENT, "Upload pickup confirmation", { transportId: selected.id, type: "pickup_confirmation", label: "Potwierdzenie zaladunku" })}
          ${actionButton(engine, ActionTypes.UPLOAD_DOCUMENT, "Upload delivery confirmation", { transportId: selected.id, type: "delivery_confirmation", label: "Potwierdzenie rozladunku" })}
          ${actionButton(engine, ActionTypes.UPLOAD_DOCUMENT, "Upload damage photo doc", { transportId: selected.id, type: "damage_report", label: "Dokument szkody" })}
        </div>
      </article>
      <article class="panel">
        <h2>Transport documents</h2>
        <div class="list">
          ${cmr ? `
            <div class="row">
              <strong>Digital CMR ${cmr.id}</strong>
              <span>${cmr.signatures.join(", ")}</span>
              <mark class="${tone(cmr.status)}">${cmr.status}</mark>
            </div>
          ` : ""}
          ${docs.map((doc) => `
            <div class="row">
              <strong>${doc.label}</strong>
              <span>${doc.type}</span>
              <small>${doc.integrityHash}</small>
            </div>
          `).join("") || `<p class="muted">No documents for selected transport.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderPhotos(state, engine, selected) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">GL Photos</span>
        <h2>Dowody zdjeciowe transportu</h2>
        <p class="muted">Zdjecia sa przypisane do transportu, dokumentow i audytu. Modul dziala w trybie demo.</p>
        <div class="actions">
          ${selected ? actionButton(engine, ActionTypes.ADD_LOAD_PHOTO, "Dodaj zdjecie", { transportId: selected.id, type: "loading", label: "Zdjecie transportowe" }) : disabledAction("Dodaj zdjecie", "Brak transportow")}
        </div>
      </article>
      ${selected ? renderPhotoList(state, selected) : renderNoTransport(state, engine)}
    </section>
  `;
}

function renderAcademy(state) {
  const isStudent = state.session.role === Roles.ACADEMY_STUDENT;
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">GL Academy</span>
        <h2>${isStudent ? "Panel studenta" : "Panel szkolen"}</h2>
        <p class="muted">Modul szkoleniowy demo dla kierowcow, przewoznikow, compliance i akademii.</p>
        <div class="detail-grid">
          <div><span>Kursy</span><strong>4</strong></div>
          <div><span>Certyfikaty</span><strong>2</strong></div>
          <div><span>Status</span><strong>${isStudent ? "student" : "trener / uczestnik"}</strong></div>
        </div>
      </article>
      <article class="panel">
        <h2>Program</h2>
        <div class="list">
          <div class="row"><strong>Bezpieczny zaladunek</strong><span>transport</span><mark class="good">gotowe</mark></div>
          <div class="row"><strong>CMR i dokumenty</strong><span>workflow</span><mark class="warning">w toku</mark></div>
          <div class="row"><strong>GPS i ETA</strong><span>operacje</span><mark class="good">demo</mark></div>
        </div>
      </article>
    </section>
  `;
}

function renderPayments(state, engine, selected) {
  return renderPlatformWallet(state, engine, selected);
}

function renderPlatformWallet(state, engine, selected) {
  if (!state.access?.canViewPlatformWallet) {
    return renderAccessDenied("PlatformWallet", "Pelny GL Wallet jest dostepny tylko dla operatora platformy GL i finansow platformy.");
  }
  return renderFintechModule(state, engine, selected, "dashboard");
}

function renderWallets(state) {
  if (!state.access?.canViewPlatformWallet) {
    return renderAccessDenied("PlatformWallet", "Salda portfela platformy nie sa udostepniane tej roli.");
  }
  return renderFintechModule(state, null, selectedTransport(state), "accounts");
}

function renderEscrow(state) {
  if (!state.access?.canViewPlatformWallet) {
    return renderAccessDenied("Escrow Engine", "Escrow details are restricted for this role.");
  }
  return renderFintechModule(state, null, selectedTransport(state), "escrow");
}

function renderBillingModule(state, mode) {
  if (!state.access?.canViewFinancials || state.access?.canViewPlatformWallet) {
    return renderAccessDenied("Rozliczenia", "Ten widok pokazuje wylacznie rozliczenia wlasne, nie PlatformWallet.");
  }
  const scope = state.access.financialScope;
  const copy = billingCopy(scope, mode);
  const payments = state.payments || [];
  const escrows = state.escrows || [];
  const transactions = state.walletTransactions || [];
  const servicePayments = state.servicePayments || [];
  const policies = state.insurancePolicies || [];
  const totals = financialTotals(state);
  return `
    <section class="finance-shell own-finance-shell">
      <div class="finance-hero">
        <div>
          <span class="finance-demo">DEMO MODE</span>
          <h2>${copy.title}</h2>
          <p>${copy.description}</p>
        </div>
        <div class="finance-hero-balance">
          <span>${copy.balanceLabel}</span>
          <strong>${formatMoney(copy.balanceValue(state, totals), "EUR")}</strong>
          <small>saldo informacyjne / dane symulowane</small>
        </div>
      </div>

      <div class="finance-metrics">
        ${financeMetric(copy.metricA, copy.metricAValue(state, totals), "EUR", "info")}
        ${financeMetric(copy.metricB, copy.metricBValue(state, totals), "EUR", "warning")}
        ${financeMetric(copy.metricC, copy.metricCValue(state, totals), "EUR", "success")}
        ${financeMetric(copy.metricD, copy.metricDValue(state, totals), "EUR", "info")}
      </div>

      <div class="finance-grid">
        <article class="finance-panel finance-wide">
          <div class="finance-head">
            <div>
              <span class="eyebrow">${copy.tableEyebrow}</span>
              <h2>${copy.tableTitle}</h2>
            </div>
            <span class="finance-pill">${copy.scopeLabel}</span>
          </div>
          ${renderOwnFinanceRows(state, mode, payments, servicePayments, policies, transactions)}
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">Permission Engine</span>
              <h2>Zakres dostepu</h2>
            </div>
          </div>
          <div class="finance-list">
            ${copy.allowed.map((item) => `<div><strong>${item}</strong><span>dane wlasne</span></div>`).join("")}
            <div><strong>Brak dostepu</strong><span>saldo platformy, prowizje systemowe, GL Wallet ID, cudze rozliczenia</span></div>
          </div>
        </article>
      </div>

      ${mode === "transport_escrow" ? `
        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">Escrow transportu</span>
              <h2>Depozyty przypisane do wlasnych transportow</h2>
            </div>
          </div>
          ${renderEscrowRows({ ...state, escrows })}
        </article>
      ` : ""}
    </section>
  `;
}

function billingCopy(scope, mode) {
  const defaults = {
    title: "Moje rozliczenia",
    description: "Widok pokazuje wylacznie wlasne faktury, statusy platnosci i naleznosci. To nie jest GL Wallet platformy.",
    balanceLabel: "Saldo informacyjne",
    balanceValue: (_state, totals) => totals.available + totals.pending + totals.inTransit,
    metricA: "Naleznosci",
    metricAValue: (_state, totals) => totals.pending + totals.inTransit,
    metricB: "Escrow transportu",
    metricBValue: (_state, totals) => totals.escrow,
    metricC: "Zapisy platnosci",
    metricCValue: (state) => (state.payments || []).length,
    metricD: "Historia",
    metricDValue: (state) => (state.walletTransactions || []).length,
    tableEyebrow: "Billing",
    tableTitle: "Historia rozliczen",
    scopeLabel: "dane wlasne",
    allowed: ["faktury", "status platnosci", "historia rozliczen"]
  };
  const byScope = {
    client: {
      title: mode === "transport_escrow" ? "Escrow transportu" : mode === "invoices" ? "Faktury klienta" : "Platnosci za transporty",
      description: "Klient widzi faktury, platnosci za wlasne transporty, depozyty escrow i status oplacenia. Nie widzi portfela ani salda platformy.",
      metricA: "Platnosci za transporty",
      metricB: "Depozyty escrow",
      metricC: "Faktury",
      metricD: "Historia platnosci",
      tableTitle: "Faktury i platnosci klienta",
      allowed: ["faktury", "platnosci za transporty", "depozyty escrow", "status oplacenia"]
    },
    carrier: {
      title: mode === "payouts" ? "Status wyplaty" : "Moje rozliczenia",
      description: "Przewoznik widzi naleznosci za wykonane transporty, faktury, status wyplat, historie rozliczen i potracone prowizje GL.",
      metricA: "Naleznosci za transporty",
      metricB: "Potracone prowizje GL",
      metricC: "Statusy wyplat",
      metricD: "Historia rozliczen",
      tableTitle: "Naleznosci i faktury przewoznika",
      allowed: ["naleznosci", "faktury", "status wyplat", "potracone prowizje GL"]
    },
    insurance: {
      title: "Rozliczenia polis",
      description: "Partner ubezpieczeniowy widzi skladki przypisane do polis, prowizje GL, status platnosci polis, wyplaty szkod i rozliczenia z GL.",
      metricA: "Skladki polis",
      metricAValue: (state) => sumMoney(state.insurancePolicies || [], (policy) => policy.cost),
      metricB: "Prowizje GL",
      metricBValue: (state) => Math.round(sumMoney(state.insurancePolicies || [], (policy) => policy.cost) * 0.08),
      metricC: "Polisy",
      metricCValue: (state) => (state.insurancePolicies || []).length,
      metricD: "Wyplaty szkod",
      metricDValue: (state) => (state.claims || []).length,
      tableTitle: "Skladki, prowizje i status polis",
      allowed: ["skladki polis", "prowizje GL", "status platnosci polis", "wyplaty szkod"]
    },
    service: {
      title: "Rozliczenia serwisu",
      description: "Warsztat i serwis mobilny widza zlecenia serwisowe, faktury, naleznosci, status platnosci i historie uslug.",
      metricA: "Naleznosci serwisowe",
      metricAValue: (state) => sumMoney(state.servicePayments || [], (payment) => payment.amount),
      metricB: "Faktury serwisowe",
      metricBValue: (state) => (state.servicePayments || []).length,
      metricC: "Zlecenia serwisowe",
      metricCValue: (state) => (state.serviceRequests || []).length,
      metricD: "Historia uslug",
      metricDValue: (state) => (state.serviceRequests || []).length,
      tableTitle: "Zlecenia serwisowe i faktury",
      allowed: ["zlecenia serwisowe", "faktury", "naleznosci", "status platnosci"]
    },
    payment_status: {
      title: "Statusy platnosci",
      description: "Widok operacyjny platnosci bez salda platformy i bez portfeli firm.",
      tableTitle: "Platnosci w toku",
      allowed: ["status platnosci", "blokady", "historia operacyjna"]
    }
  };
  return { ...defaults, ...(byScope[scope] || {}) };
}

function renderOwnFinanceRows(state, mode, payments, servicePayments, policies, transactions) {
  if (state.access.financialScope === "insurance") {
    return `
      <div class="finance-table transactions">
        <div class="finance-row finance-head-row">
          <span>Polisa</span><span>Transport</span><span>Skladka</span><span>Status</span><span>Prowizja GL</span><span>Zakres</span>
        </div>
        ${policies.map((policy) => `
          <div class="finance-row">
            <span>${policy.number}</span>
            <span>${transportNumber(state, policy.transportId)}</span>
            <strong>${formatMoney(policy.cost, "EUR")}</strong>
            <span><mark class="${financeTone(policy.status)}">${policy.status}</mark></span>
            <span>${formatMoney(Math.round(policy.cost * 0.08), "EUR")}</span>
            <small>${policy.scope}</small>
          </div>
        `).join("") || `<p class="finance-muted">Brak rozliczen polis.</p>`}
      </div>
    `;
  }
  if (state.access.financialScope === "service") {
    return `
      <div class="finance-table transactions">
        <div class="finance-row finance-head-row">
          <span>Zlecenie</span><span>Transport</span><span>Kwota</span><span>Status</span><span>Usluga</span><span>Historia</span>
        </div>
        ${servicePayments.map((payment) => {
          const request = (state.serviceRequests || []).find((item) => item.id === payment.serviceRequestId);
          return `
            <div class="finance-row">
              <span>${payment.id}</span>
              <span>${transportNumber(state, payment.transportId)}</span>
              <strong>${formatMoney(payment.amount, payment.currency)}</strong>
              <span><mark class="${financeTone(payment.status)}">${payment.status}</mark></span>
              <span>${request?.faultType || "serwis"}</span>
              <small>${request?.status || "historia uslugi"}</small>
            </div>
          `;
        }).join("") || `<p class="finance-muted">Brak faktur serwisowych.</p>`}
      </div>
    `;
  }
  return `
    <div class="finance-table transactions">
      <div class="finance-row finance-head-row">
        <span>ID</span><span>Transport</span><span>Kwota</span><span>Status</span><span>Rozliczenie</span><span>Audit ID</span>
      </div>
      ${payments.map((payment) => {
        const transaction = transactions.find((entry) => entry.transportId === payment.transportId);
        const fee = calculateGlFee({ price: payment.amount, currency: payment.currency });
        const settlementLabel = mode === "payouts"
          ? `do wyplaty: ${formatMoney(fee.carrierAmount, payment.currency)}`
          : mode === "transport_escrow"
          ? "escrow transportu"
          : "faktura / status";
        return `
          <div class="finance-row">
            <span>${payment.id}</span>
            <span>${transportNumber(state, payment.transportId)}</span>
            <strong>${formatMoney(payment.amount, payment.currency)}</strong>
            <span><mark class="${financeTone(payment.status)}">${payment.status}</mark></span>
            <span>${settlementLabel}</span>
            <small>${transaction?.auditId || "audit-demo"}</small>
          </div>
        `;
      }).join("") || `<p class="finance-muted">Brak wlasnych rozliczen.</p>`}
    </div>
  `;
}

function sumMoney(items, selector) {
  return items.reduce((total, item) => total + Number(selector(item) || 0), 0);
}

function renderFintechModule(state, engine, selected, mode) {
  const totals = financialTotals(state);
  const fee = calculateGlFee(selected);
  const policy = selected ? state.insurancePolicies.find((item) => item.id === selected.insuranceId) : null;
  const activeTransactions = (state.walletTransactions || []).slice(0, 8);
  const sortedTransactions = [...(state.walletTransactions || [])].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  const sectionTitle = mode === "accounts" ? "Konta GL Wallet" : mode === "escrow" ? "Escrow i spory" : "Dashboard Wallet";

  return `
    <section class="finance-shell">
      <div class="finance-hero">
        <div>
          <span class="finance-demo">DEMO MODE</span>
          <h2>${sectionTitle}</h2>
          <p>Brak rzeczywistych operacji finansowych. Dane, salda, hash transakcji i API sa symulowane pod przyszla integracje z licencjonowanym operatorem.</p>
        </div>
        <div class="finance-hero-balance">
          <span>Saldo systemu</span>
          <strong>${formatMoney(totals.totalSystem, "EUR")}</strong>
          <small>symulowany GL Wallet</small>
        </div>
      </div>

      <div class="finance-metrics">
        ${financeMetric("Saldo dostepne", totals.available, "EUR", "success")}
        ${financeMetric("Saldo zablokowane", totals.blocked, "EUR", "warning")}
        ${financeMetric("Saldo oczekujace", totals.pending, "EUR", "info")}
        ${financeMetric("Srodki w escrow", totals.escrow, "EUR", "warning")}
        ${financeMetric("Platnosci w drodze", totals.inTransit, "EUR", "info")}
      </div>

      <div class="finance-grid">
        <article class="finance-panel finance-wide">
          <div class="finance-head">
            <div>
              <span class="eyebrow">Historia transakcji</span>
              <h2>Immutable demo ledger</h2>
            </div>
            <span class="finance-pill">hash + audit id</span>
          </div>
          ${renderTransactionHistory(state, activeTransactions)}
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">Ostatnie operacje</span>
              <h2>Operacje portfela</h2>
            </div>
          </div>
          <div class="finance-list">
            ${(state.walletLedger || []).slice(0, 6).map((entry) => `
              <div>
                <strong>${entry.type}</strong>
                <span>${formatMoney(entry.amount, entry.currency)} / ${transportNumber(state, entry.transportId)}</span>
                <small>${entry.reason}</small>
              </div>
            `).join("") || `<p class="finance-muted">Brak operacji.</p>`}
          </div>
        </article>
      </div>

      <div class="finance-grid">
        <article class="finance-panel finance-wide">
          <div class="finance-head">
            <div>
              <span class="eyebrow">Konta</span>
              <h2>Portfele uzytkownikow i firm</h2>
            </div>
            <span class="finance-pill">${(state.wallets || []).length} GL Wallet ID</span>
          </div>
          <div class="wallet-card-grid">
            ${(state.wallets || []).map((wallet) => renderWalletAccount(state, wallet)).join("") || `<p class="finance-muted">Brak widocznych portfeli.</p>`}
          </div>
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">Statusy</span>
              <h2>Cykl platnosci</h2>
            </div>
          </div>
          <div class="status-cloud">
            ${["Pending", "Reserved", "Escrow", "Released", "Completed", "Rejected", "Blocked", "Refunded", "Cancelled", "Disputed"].map((status) => `
              <mark class="${financeTone(status)}">${status}</mark>
            `).join("")}
          </div>
          <div class="status-cloud currencies">
            ${(state.exchangeRates || []).map((rate) => `<span>${rate.currency}</span>`).join("")}
          </div>
        </article>
      </div>

      <div class="finance-grid">
        <article class="finance-panel finance-wide">
          <div class="finance-head">
            <div>
              <span class="eyebrow">Escrow Engine</span>
              <h2>Blokada, dowody, zwolnienie</h2>
            </div>
            ${engine && selected ? actionButton(engine, ActionTypes.RELEASE_PAYMENT, "Release payment", { transportId: selected.id }) : ""}
          </div>
          ${renderEscrowFlow()}
          ${renderEscrowRows(state)}
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">Spory</span>
              <h2>Decyzje administratora</h2>
            </div>
          </div>
          ${renderDisputeFinance(state)}
        </article>
      </div>

      <div class="finance-grid">
        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">GL Fee</span>
              <h2>Kalkulacja prowizji</h2>
            </div>
          </div>
          <div class="finance-kv">
            <div><span>Kwota brutto</span><strong>${formatMoney(fee.gross, fee.currency)}</strong></div>
            <div><span>Prowizja GL</span><strong>${formatMoney(fee.feeGross, fee.currency)}</strong></div>
            <div><span>Kwota netto prowizji</span><strong>${formatMoney(fee.feeNet, fee.currency)}</strong></div>
            <div><span>Podatek</span><strong>${formatMoney(fee.tax, fee.currency)}</strong></div>
            <div><span>Kwota dla przewoznika</span><strong>${formatMoney(fee.carrierAmount, fee.currency)}</strong></div>
          </div>
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">Ubezpieczenie</span>
              <h2>Polisa transportu</h2>
            </div>
          </div>
          ${policy ? `
            <div class="finance-kv">
              <div><span>Numer polisy</span><strong>${policy.number}</strong></div>
              <div><span>Firma</span><strong>${policy.partner}</strong></div>
              <div><span>Zakres</span><strong>${policy.scope}</strong></div>
              <div><span>Kwota</span><strong>${formatMoney(policy.cost, "EUR")}</strong></div>
              <div><span>Status</span><strong>${policy.status}</strong></div>
            </div>
          ` : `<p class="finance-muted">Ten transport nie ma aktywnej polisy.</p>`}
        </article>
      </div>

      <div class="finance-grid">
        <article class="finance-panel finance-wide">
          <div class="finance-head">
            <div>
              <span class="eyebrow">Dashboard administratora</span>
              <h2>Ryzyko, naduzycia i najwieksze transakcje</h2>
            </div>
          </div>
          <div class="finance-admin-grid">
            <div><span>Calkowite saldo</span><strong>${formatMoney(totals.totalSystem, "EUR")}</strong></div>
            <div><span>Escrow</span><strong>${formatMoney(totals.escrow, "EUR")}</strong></div>
            <div><span>Blokady</span><strong>${formatMoney(totals.blocked, "EUR")}</strong></div>
            <div><span>Spory</span><strong>${totals.disputes}</strong></div>
            <div><span>Alarmy</span><strong>${(state.walletRiskAlerts || []).length}</strong></div>
            <div><span>Podejrzane operacje</span><strong>${(state.walletRiskAlerts || []).filter((alert) => ["HIGH", "CRITICAL"].includes(alert.level)).length}</strong></div>
          </div>
          ${renderLargestTransactions(state, sortedTransactions)}
        </article>

        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">AI Risk Engine</span>
              <h2>AML / Fraud demo</h2>
            </div>
          </div>
          <div class="finance-list">
            ${(state.walletRiskAlerts || []).map((alert) => `
              <div>
                <strong>${alert.title}</strong>
                <span><mark class="${financeTone(alert.level)}">${alert.level}</mark> ${alert.source}</span>
                <small>${alert.description}</small>
              </div>
            `).join("") || `<p class="finance-muted">Brak alertow.</p>`}
          </div>
        </article>
      </div>

      <div class="finance-grid">
        <article class="finance-panel">
          <div class="finance-head">
            <div>
              <span class="eyebrow">Raporty</span>
              <h2>Eksport demo</h2>
            </div>
          </div>
          <div class="report-grid">
            ${(state.walletReports || []).map((report) => `
              <div>
                <strong>${report.name}</strong>
                <span>${report.exports.join(" / ")}</span>
              </div>
            `).join("")}
          </div>
        </article>

        <article class="finance-panel finance-wide">
          <div class="finance-head">
            <div>
              <span class="eyebrow">API Architecture</span>
              <h2>Endpointy przygotowane pod integracje</h2>
            </div>
            <span class="finance-pill">backend nieaktywny w demo</span>
          </div>
          <div class="api-grid">
            ${(state.walletApiEndpoints || []).map((endpoint) => `
              <div>
                <span>${endpoint.group}</span>
                <strong>${endpoint.method} ${endpoint.path}</strong>
                <small>${endpoint.purpose}</small>
              </div>
            `).join("")}
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderTransactionHistory(state, transactions) {
  return `
    <div class="finance-table transactions">
      <div class="finance-row finance-head-row">
        <span>ID</span><span>Data</span><span>Godzina</span><span>Kwota</span><span>Nadawca</span><span>Odbiorca</span><span>Status</span><span>Hash demo</span><span>Audit ID</span>
      </div>
      ${transactions.map((entry) => {
        const date = formatWalletDate(entry.at);
        return `
          <div class="finance-row">
            <span>${entry.id}</span>
            <span>${date.day}</span>
            <span>${date.time}</span>
            <strong>${formatMoney(entry.amount, entry.currency)}</strong>
            <span>${entityName(state, entry.senderId)}</span>
            <span>${entityName(state, entry.receiverId)}</span>
            <span><mark class="${financeTone(entry.status)}">${entry.status}</mark></span>
            <small>${entry.hash}</small>
            <small>${entry.auditId}</small>
          </div>
        `;
      }).join("") || `<p class="finance-muted">Brak transakcji.</p>`}
    </div>
  `;
}

function renderWalletAccount(state, wallet) {
  return `
    <div class="wallet-card">
      <span>${wallet.walletType}</span>
      <strong>${wallet.glWalletId}</strong>
      <p>${walletOwnerName(state, wallet)}</p>
      <div>
        <small>Dostepne</small>
        <b>${formatMoney(wallet.balance, wallet.currency)}</b>
      </div>
      <div>
        <small>Zablokowane / escrow</small>
        <b>${formatMoney((wallet.heldBalance || 0) + (wallet.blockedBalance || 0), wallet.currency)}</b>
      </div>
    </div>
  `;
}

function renderEscrowFlow() {
  const steps = [
    "Klient tworzy transport",
    "Srodki zostaja zablokowane",
    "Transport rusza",
    "Rozladunek zakonczony",
    "Dokumenty zaakceptowane",
    "Brak sporu",
    "Escrow zwolnione do przewoznika"
  ];
  return `<div class="finance-flow">${steps.map((step, index) => `<div><span>${index + 1}</span><strong>${step}</strong></div>`).join("")}</div>`;
}

function renderEscrowRows(state) {
  return `
    <div class="finance-table escrow-table">
      <div class="finance-row finance-head-row">
        <span>ID</span><span>Transport</span><span>Platnik</span><span>Status</span><span>Kwota</span><span>Odbiorca</span>
      </div>
      ${(state.escrows || []).map((escrow) => `
        <div class="finance-row">
          <span>${escrow.id}</span>
          <span>${transportNumber(state, escrow.transportId)}</span>
          <span>${companyName(state, escrow.payerCompanyId)}</span>
          <span><mark class="${financeTone(escrow.status)}">${escrow.status}</mark></span>
          <strong>${formatMoney(escrow.amount, escrow.currency)}</strong>
          <span>${companyName(state, escrow.payeeCompanyId)}</span>
        </div>
      `).join("") || `<p class="finance-muted">Brak rekordow escrow.</p>`}
    </div>
  `;
}

function renderDisputeFinance(state) {
  const disputes = state.disputes || [];
  if (!disputes.length) return `<p class="finance-muted">Brak aktywnych sporow. Escrow moze przejsc do release po dokumentach.</p>`;
  return `
    <div class="finance-list">
      ${disputes.map((dispute) => `
        <div>
          <strong>${transportNumber(state, dispute.transportId)}</strong>
          <span>Status: ${dispute.status} / escrow zamrozone</span>
          <small>AI analizuje historie, dokumenty, GPS i zdjecia.</small>
          <div class="decision-row">
            <button type="button">Release</button>
            <button type="button">Refund</button>
            <button type="button">Split Payment</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderLargestTransactions(state, transactions) {
  return `
    <div class="finance-list compact-finance-list">
      ${transactions.slice(0, 3).map((entry) => `
        <div>
          <strong>${formatMoney(entry.amount, entry.currency)}</strong>
          <span>${entityName(state, entry.senderId)} -> ${entityName(state, entry.receiverId)}</span>
          <small>${entry.reason}</small>
        </div>
      `).join("")}
    </div>
  `;
}

function renderRevenue(state) {
  if (!state.access?.canViewPlatformWallet) {
    return renderAccessDenied("Revenue Engine", "Platform revenue is restricted for this role.");
  }
  return `
    <section class="panel">
      <span class="eyebrow">GL Revenue Engine</span>
      <h2>Platform fees recorded by events</h2>
      <div class="transport-table compact-table">
        <div class="table-row table-head">
          <span>ID</span><span>Transport</span><span>Type</span><span>Amount</span><span>Currency</span><span>Reason</span>
        </div>
        ${state.revenueLedger.map((entry) => `
          <div class="table-row">
            <span>${entry.id}</span>
            <span>${transportNumber(state, entry.transportId)}</span>
            <span>${entry.type}</span>
            <span>${entry.amount}</span>
            <span>${entry.currency}</span>
            <span>${entry.reason}</span>
          </div>
        `).join("") || `<p class="muted">No revenue rows visible.</p>`}
      </div>
    </section>
  `;
}

function renderPolicies(state) {
  return `
    <section class="panel">
      <span class="eyebrow">Polisy</span>
      <h2>Polisy transportowe</h2>
      <div class="list">
        ${(state.insurancePolicies || []).map((policy) => `
          <div class="row">
            <strong>${policy.number}</strong>
            <span>${transportNumber(state, policy.transportId)} / ${policy.partner}</span>
            <mark class="${tone(policy.status)}">${policy.status}</mark>
            <small>${policy.scope} / ${formatMoney(policy.cost, "EUR")}</small>
          </div>
        `).join("") || `<p class="muted">Brak polis widocznych dla tej roli.</p>`}
      </div>
    </section>
  `;
}

function renderClaims(state, engine, selected) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Zgloszenia szkod</span>
        <h2>Szkody i roszczenia</h2>
        ${selected ? actionButton(engine, ActionTypes.OPEN_CLAIM, "Otworz roszczenie", { transportId: selected.id, reason: "damage claim from demo" }) : disabledAction("Otworz roszczenie", "Brak transportu")}
      </article>
      <article class="panel">
        <h2>Sprawy</h2>
        <div class="list">
          ${(state.claims || []).map((claim) => `
            <div class="row">
              <strong>${claim.id}</strong>
              <span>${transportNumber(state, claim.transportId)}</span>
              <mark class="${tone(claim.status)}">${claim.status}</mark>
            </div>
          `).join("") || `<p class="muted">Brak aktywnych roszczen.</p>`}
          ${(state.disputeEvidencePacks || []).map((pack) => `
            <div class="row">
              <strong>${pack.id}</strong>
              <span>${transportNumber(state, pack.transportId)}</span>
              <small>${pack.photoIds.length} zdjec / ${pack.documentIds.length} dokumentow</small>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
  `;
}

function renderRisk(state) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Ocena ryzyka</span>
        <h2>Ryzyko transportu</h2>
        <div class="list">
          ${(state.transports || []).map((transport) => `
            <div class="row">
              <strong>${transport.number}</strong>
              <span>${transport.status}</span>
              <mark class="${transport.riskFlagged ? "danger" : "good"}">${transport.riskFlagged ? "ryzyko" : "ok"}</mark>
            </div>
          `).join("") || `<p class="muted">Brak transportow do oceny.</p>`}
        </div>
      </article>
      <article class="panel">
        <h2>Alerty AI</h2>
        <div class="list">
          ${(state.aiAlerts || []).map((alert) => `
            <div class="row">
              <strong>${alert.title || alert.id}</strong>
              <span>${transportNumber(state, alert.transportId)}</span>
              <mark class="${tone(alert.level || alert.status)}">${alert.level || alert.status}</mark>
            </div>
          `).join("") || `<p class="muted">Brak alertow AI.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderInsurance(state, engine, selected) {
  const packs = state.disputeEvidencePacks.filter((pack) => pack.transportId === selected.id);
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Insurance Engine</span>
        <h2>Claim binds photos, GPS, docs and liability</h2>
        ${actionButton(engine, ActionTypes.OPEN_CLAIM, "Open insurance claim", { transportId: selected.id, reason: "damage claim from demo" })}
      </article>
      <article class="panel">
        <h2>Policies</h2>
        <div class="list">
          ${state.insurancePolicies.map((policy) => `
            <div class="row">
              <strong>${policy.number}</strong>
              <span>${policy.partner}</span>
              <mark class="${tone(policy.status)}">${policy.status}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
    <section class="panel">
      <span class="eyebrow">Dispute Evidence Engine</span>
      <h2>Evidence packs</h2>
      <div class="list">
        ${packs.map((pack) => `
          <div class="row">
            <strong>${pack.id}</strong>
            <span>${pack.photoIds.length} photos / ${pack.documentIds.length} docs / ${pack.messageIds.length} messages</span>
            <mark class="${pack.locked ? "good" : "warning"}">${pack.locked ? "locked" : "draft"}</mark>
          </div>
        `).join("") || `<p class="muted">No evidence pack for selected transport.</p>`}
      </div>
    </section>
  `;
}

function renderJobs(state) {
  return `
    <section class="panel">
      <span class="eyebrow">Jobs Engine</span>
      <h2>Driver work created from transport events</h2>
      <div class="card-grid">
        ${state.jobs.map((job) => `
          <article class="mini-card">
            <strong>${transportNumber(state, job.transportId)}</strong>
            <span>${userName(state, job.driverId)} / ${companyName(state, job.carrierCompanyId)}</span>
            <mark class="${tone(job.status)}">${job.status}</mark>
          </article>
        `).join("") || `<p class="muted">No jobs visible for this role.</p>`}
      </div>
    </section>
  `;
}

function renderCommunication(state, engine, selected) {
  const messages = state.messages.filter((message) => message.transportId === selected.id);
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Communication Engine</span>
        <h2>Transport thread creates message_id and audit</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.SEND_MESSAGE, "Send PL update", { transportId: selected.id, body: "Prosze potwierdzic odprawe na bramie przed zaladunkiem.", language: "pl" })}
          ${actionButton(engine, ActionTypes.SEND_MESSAGE, "Send EN update", { transportId: selected.id, body: "Please confirm gate clearance before loading.", language: "en" })}
        </div>
      </article>
      <article class="panel">
        <h2>Thread messages</h2>
        <div class="list">
          ${messages.map((message) => `
            <div class="row">
              <strong>${userName(state, message.authorId) || message.authorRole}</strong>
              <span>${message.language}</span>
              <small>${message.body}</small>
            </div>
          `).join("") || `<p class="muted">No messages for selected transport.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderTranslations(state, engine) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Translation Engine</span>
        <h2>Message translations are separate records</h2>
        <div class="list">
          ${state.messages.slice(0, 8).map((message) => `
            <div class="row">
              <strong>${transportNumber(state, message.transportId)}</strong>
              <span>${message.language}: ${message.body}</span>
              ${actionButton(engine, ActionTypes.REQUEST_TRANSLATION, "Translate to PL", { transportId: message.transportId, messageId: message.id, targetLanguage: "pl" })}
            </div>
          `).join("") || `<p class="muted">No messages visible.</p>`}
        </div>
      </article>
      <article class="panel">
        <h2>Translations</h2>
        <div class="list">
          ${state.translations.map((translation) => `
            <div class="row">
              <strong>${translation.sourceLanguage} -> ${translation.targetLanguage}</strong>
              <span>${translation.body}</span>
              <small>${translation.messageId}</small>
            </div>
          `).join("") || `<p class="muted">No translations yet.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderSecurity(state, engine, selected) {
  const checks = state.securityChecks.filter((check) => check.transportId === selected.id);
  const lookups = state.plateLookups.filter((lookup) => !lookup.transportId || lookup.transportId === selected.id);
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Security Engine</span>
        <h2>Gate clearance controls loading and unloading</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.SCAN_LICENSE_PLATE, "Scan selected plate", { licensePlate: vehiclePlate(state, selected.vehicleId), reason: "gate arrival check" })}
          ${actionButton(engine, ActionTypes.RECORD_SECURITY_CHECK, "Clear pickup gate", { transportId: selected.id, checkpoint: "pickup", status: "cleared", reason: "Gate cleared. Driver may start loading." })}
          ${actionButton(engine, ActionTypes.RECORD_SECURITY_CHECK, "Block pickup gate", { transportId: selected.id, checkpoint: "pickup", status: "blocked", reason: "seal mismatch at pickup gate" })}
          ${actionButton(engine, ActionTypes.RECORD_SECURITY_CHECK, "Clear delivery gate", { transportId: selected.id, checkpoint: "delivery", status: "cleared", reason: "delivery gate cleared" })}
          ${actionButton(engine, ActionTypes.SEND_MESSAGE, "Notify thread", { transportId: selected.id, body: "Gate cleared. Driver may start loading.", language: "en" })}
        </div>
      </article>
      <article class="panel">
        <h2>Security checks</h2>
        <div class="list">
          ${checks.map((check) => `
            <div class="row">
              <strong>${check.checkpoint}</strong>
              <span>${check.reason}</span>
              <mark class="${tone(check.status)}">${check.status}</mark>
            </div>
          `).join("") || `<p class="muted">No checks for selected transport.</p>`}
        </div>
      </article>
    </section>
    <section class="panel">
      <span class="eyebrow">Plate-to-driver</span>
      <h2>Recent plate lookups</h2>
      <div class="list">
        ${lookups.map((lookup) => `
          <div class="row">
            <strong>${lookup.licensePlate}</strong>
            <span>${lookup.status} / ${transportNumber(state, lookup.transportId)}</span>
            <small>${lookup.reason}</small>
          </div>
        `).join("") || `<p class="muted">No plate lookups yet.</p>`}
      </div>
    </section>
  `;
}

function renderCustoms(state, engine, selected) {
  const cases = state.customsCases || [];
  const activeCase = cases.find((item) => item.transportId === selected.id) || cases[0] || null;
  const transport = activeCase
    ? state.transports.find((item) => item.id === activeCase.transportId) || selected
    : selected;
  const docs = state.documents.filter((doc) => doc.transportId === transport.id && [
    "sad",
    "t1",
    "ex",
    "mrn",
    "commercial_invoice",
    "packing_list",
    "certificate_of_origin"
  ].includes(doc.type));
  const payments = (state.customsPayments || []).filter((payment) => payment.transportId === transport.id);
  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">23.8 Silnik agencji celnej</span>
            <h2>Odprawa celna transportu ${transport.number}</h2>
          </div>
          <mark class="${tone(transport.status)}">${transport.status}</mark>
        </div>
        ${renderDocumentForm(selected)}
        <div class="actions">
          ${actionButton(engine, ActionTypes.MARK_CUSTOMS_REQUIRED, "Wymagana odprawa", { transportId: transport.id, agentCompanyId: "co-customs-a", borderPoint: "Rotterdam / DE border" })}
          ${actionButton(engine, ActionTypes.SEND_TO_CUSTOMS, "Przekaż do agencji", { transportId: transport.id, agentCompanyId: "co-customs-a" })}
          ${actionButton(engine, ActionTypes.START_CUSTOMS, "Rozpocznij odprawę", { transportId: transport.id, agentCompanyId: "co-customs-a" })}
          ${actionButton(engine, ActionTypes.CLEAR_CUSTOMS, "Zwolnij po odprawie", { transportId: transport.id, mrn: "MRN-GL2-1001", fee: 180 })}
          ${actionButton(engine, ActionTypes.HOLD_CUSTOMS, "Zatrzymaj celnie", { transportId: transport.id, reason: "brak wymaganego MRN" })}
          ${actionButton(engine, ActionTypes.SEND_MESSAGE, "Wiadomość do kierowcy", { transportId: transport.id, body: "Agencja celna prosi o potwierdzenie dokumentów MRN i packing list.", language: "pl" })}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Aktywna odprawa</span>
        <h2>${activeCase?.mrn || "brak MRN"}</h2>
        <div class="detail-grid">
          <div><span>Agencja</span><strong>${companyName(state, activeCase?.agentCompanyId) || "Baltic Customs Agency"}</strong></div>
          <div><span>Punkt graniczny</span><strong>${activeCase?.borderPoint || "brak"}</strong></div>
          <div><span>Status odprawy</span><strong>${activeCase?.status || "brak"}</strong></div>
          <div><span>Opłata celna</span><strong>${payments[0] ? `${payments[0].amount} ${payments[0].currency}` : "brak"}</strong></div>
        </div>
      </article>
    </section>
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Dokumenty celne</span>
        <h2>SAD / T1 / EX / MRN / faktura / lista pakowa</h2>
        <div class="list">
          ${docs.map((doc) => `
            <div class="row">
              <strong>${doc.label}</strong>
              <span>${doc.type}</span>
              <small>${doc.integrityHash}</small>
            </div>
          `).join("") || `<p class="muted">Brak widocznych dokumentów celnych.</p>`}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Sprawy celne</span>
        <h2>ID sprawy celnej jako osobna tożsamość</h2>
        <div class="list">
          ${cases.map((customsCase) => `
            <div class="row">
              <strong>${customsCase.id}</strong>
              <span>${transportNumber(state, customsCase.transportId)} / ${companyName(state, customsCase.agentCompanyId)}</span>
              <mark class="${tone(customsCase.status)}">${customsCase.status}</mark>
            </div>
          `).join("") || `<p class="muted">Brak widocznych spraw celnych.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderAuthority(state, engine, selected) {
  const controls = state.authorityControls || [];
  const history = state.authorityControlHistory || [];
  const control = controls.find((item) => item.transportId === selected.id) || controls[0] || null;
  const transport = control
    ? state.transports.find((item) => item.id === control.transportId) || selected
    : selected;
  const docs = state.documents.filter((doc) => doc.transportId === transport.id && [
    "cmr",
    "transport_license",
    "road_permit",
    "certificate",
    "legal_required_document",
    "insurance_policy"
  ].includes(doc.type));
  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">23.9 Silnik dostępu organów / kontroli drogowej</span>
            <h2>Kontrolowany dostęp organu</h2>
          </div>
          <mark class="${tone(transport.status)}">${transport.status}</mark>
        </div>
        <div class="actions">
          ${actionButton(engine, ActionTypes.START_AUTHORITY_CONTROL, "Rozpocznij kontrolę", { transportId: transport.id, authoritySubtype: "police", place: "A2 Poznań" })}
          ${actionButton(engine, ActionTypes.RECORD_DOCUMENT_CHECK, "Sprawdź dokumenty", { transportId: transport.id, checkedDocumentTypes: ["cmr", "transport_license", "road_permit", "insurance_policy"] })}
          ${actionButton(engine, ActionTypes.RECORD_ROAD_INSPECTION, "Kontrola drogowa", { transportId: transport.id, place: "A2 Poznań" })}
          ${actionButton(engine, ActionTypes.PASS_AUTHORITY_CONTROL, "Kontrola pozytywna", { transportId: transport.id, place: "A2 Poznań" })}
          ${actionButton(engine, ActionTypes.REPORT_AUTHORITY_ISSUE, "Wykryto problem", { transportId: transport.id, issue: "brak wymaganego pozwolenia" })}
          ${actionButton(engine, ActionTypes.SCAN_LICENSE_PLATE, "Skanuj tablicę", { licensePlate: vehiclePlate(state, transport.vehicleId), reason: "kontrola drogowa" })}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Zakres widoczności</span>
        <h2>Organ widzi tylko dane wymagane do kontroli</h2>
        <div class="detail-grid">
          <div><span>Pojazd</span><strong>${vehiclePlate(state, transport.vehicleId)}</strong></div>
          <div><span>Przewoźnik</span><strong>${companyName(state, transport.carrierCompanyId)}</strong></div>
          <div><span>Status</span><strong>${transport.status}</strong></div>
          <div><span>Legalność</span><strong>${transport.legalStatus || (transport.riskFlagged ? "do sprawdzenia" : "brak blokady")}</strong></div>
          <div><span>Ubezpieczenie</span><strong>${transport.insuranceId ? "wymagane / dostępne" : "brak podstawy"}</strong></div>
          <div><span>Finanse</span><strong>niewidoczne</strong></div>
        </div>
      </article>
    </section>
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Dokumenty dla organu</span>
        <h2>CMR, licencje, pozwolenia, certyfikaty</h2>
        <div class="list">
          ${docs.map((doc) => `
            <div class="row">
              <strong>${doc.label}</strong>
              <span>${doc.type}</span>
              <small>${doc.integrityHash}</small>
            </div>
          `).join("") || `<p class="muted">Brak widocznych dokumentów dla organu.</p>`}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Historia kontroli organów</span>
        <h2>Historia kontroli w audycie</h2>
        <div class="list">
          ${history.map((row) => `
            <div class="row">
              <strong>${row.authoritySubtype} / ${row.controlType}</strong>
              <span>${vehiclePlate(state, row.vehicleId)} / ${row.place}</span>
              <mark class="${tone(row.result)}">${row.result}</mark>
            </div>
          `).join("") || `<p class="muted">Brak historii kontroli.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderFerry(state, engine, selected) {
  const bookings = state.ferryBookings || [];
  const activeBooking = bookings.find((booking) => booking.transportId === selected.id) || bookings[0] || null;
  const transport = activeBooking
    ? state.transports.find((item) => item.id === activeBooking.transportId) || selected
    : selected;
  const payments = (state.ferryPayments || []).filter((payment) => payment.transportId === transport.id);
  const docs = state.documents.filter((doc) => doc.transportId === transport.id && doc.type === "ferry_ticket");
  const driverTime = state.driverTime.find((item) => item.driverId === transport.driverId);

  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">Silnik promowy / intermodalny</span>
            <h2>${transport.number} / ${transport.pickup.address} -> ${transport.delivery.address}</h2>
          </div>
          <mark class="${tone(transport.status)}">${transport.status}</mark>
        </div>
        <div class="actions">
          ${actionButton(engine, ActionTypes.MARK_FERRY_REQUIRED, "Oznacz wymóg promu", { transportId: transport.id, transportMode: "INTERMODAL" })}
          ${actionButton(engine, ActionTypes.BOOK_FERRY, "Zarezerwuj DFDS", {
            transportId: transport.id,
            operatorCompanyId: "co-ferry-dfds",
            departurePort: "Calais",
            arrivalPort: "Dover",
            departureAt: "2026-05-28T08:30:00.000Z",
            arrivalAt: "2026-05-28T10:00:00.000Z",
            vehicleId: transport.vehicleId,
            driverId: transport.driverId,
            cost: 430,
            etaAfterFerry: "2026-05-28T14:30:00.000Z"
          })}
          ${actionButton(engine, ActionTypes.START_PORT_NAVIGATION, "Jedź do portu", { transportId: transport.id })}
          ${actionButton(engine, ActionTypes.CHECK_IN_FERRY, "Odprawa promowa", { transportId: transport.id })}
          ${actionButton(engine, ActionTypes.BOARD_FERRY, "Wejście na prom", { transportId: transport.id, restHours: 1.5, etaAfterFerry: "2026-05-28T14:30:00.000Z" })}
          ${actionButton(engine, ActionTypes.COMPLETE_FERRY, "Zakończ prom", { transportId: transport.id, etaAfterFerry: "2026-05-28T14:30:00.000Z" })}
          ${actionButton(engine, ActionTypes.SEND_MESSAGE, "Wyślij status promu", { transportId: transport.id, body: "Prom Calais-Dover aktywny. Kierowca odpoczywa, ETA zaktualizowane.", language: "pl" })}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Aktywna rezerwacja</span>
        <h2>${activeBooking?.ferry_booking_id || "brak rezerwacji"}</h2>
        <div class="detail-grid">
          <div><span>Tryb</span><strong>${transport.transportMode || "ROAD"}</strong></div>
          <div><span>Operator</span><strong>${companyName(state, activeBooking?.operatorCompanyId) || "DFDS Ferry"}</strong></div>
          <div><span>Port startowy</span><strong>${activeBooking?.departurePort || "Calais"}</strong></div>
          <div><span>Port docelowy</span><strong>${activeBooking?.arrivalPort || "Dover"}</strong></div>
          <div><span>Pojazd</span><strong>${vehiclePlate(state, activeBooking?.vehicleId || transport.vehicleId)}</strong></div>
          <div><span>Kierowca</span><strong>${userName(state, activeBooking?.driverId || transport.driverId)}</strong></div>
          <div><span>Wyjazd promu</span><strong>${formatTime(activeBooking?.departureAt)}</strong></div>
          <div><span>Przyjazd promu</span><strong>${formatTime(activeBooking?.arrivalAt)}</strong></div>
          <div><span>ETA po promie</span><strong>${formatTime(transport.eta || activeBooking?.etaAfterFerry)}</strong></div>
          <div><span>Czas kierowcy</span><strong>${driverTime ? `${driverTime.breakHours}h pauzy / ${driverTime.remainingLegalHours}h limitu` : "brak"}</strong></div>
        </div>
      </article>
    </section>
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Rezerwacje promowe</span>
        <h2>ferry_booking_id jako osobna tożsamość</h2>
        <div class="list">
          ${bookings.map((booking) => `
            <div class="row">
              <strong>${booking.ferry_booking_id}</strong>
              <span>${transportNumber(state, booking.transportId)} / ${booking.departurePort}-${booking.arrivalPort}</span>
              <mark class="${tone(booking.status)}">${booking.status}</mark>
            </div>
          `).join("") || `<p class="muted">Brak rezerwacji promowych.</p>`}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Dokumenty i płatność promowa</span>
        <h2>Powiązanie z Document Engine i Wallet Engine</h2>
        <div class="list">
          ${docs.map((doc) => `
            <div class="row">
              <strong>${doc.label}</strong>
              <span>${doc.type}</span>
              <small>${doc.integrityHash}</small>
            </div>
          `).join("") || `<p class="muted">Brak biletu promowego dla wybranego transportu.</p>`}
          ${payments.map((payment) => `
            <div class="row">
              <strong>${payment.amount} ${payment.currency}</strong>
              <span>${companyName(state, payment.operatorCompanyId)}</span>
              <mark class="${tone(payment.status)}">${payment.status}</mark>
            </div>
          `).join("") || `<p class="muted">Brak widocznej płatności promowej.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderService(state, engine, selected) {
  const requests = state.serviceRequests || [];
  const request = requests.find((item) => item.transportId === selected.id) || requests[0] || null;
  const transport = request
    ? state.transports.find((item) => item.id === request.transportId) || selected
    : selected;
  const providers = state.serviceProviders || [];
  const payments = (state.servicePayments || []).filter((payment) => payment.transportId === transport.id);
  const serviceDocs = state.documents.filter((doc) => doc.transportId === transport.id && doc.type === "service_report");
  const provider = providers.find((item) => item.companyId === request?.providerCompanyId) || providers[0] || null;

  return `
    <section class="grid two">
      <article class="panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">23.11 Serwis / Warsztat / Pomoc mobilna</span>
            <h2>Obsługa awarii pojazdu ${vehiclePlate(state, transport.vehicleId)}</h2>
          </div>
          <mark class="${tone(request?.status || "brak")}" >${request?.status || "brak zgłoszenia"}</mark>
        </div>
        <div class="actions">
          ${actionButton(engine, ActionTypes.REPORT_BREAKDOWN, "Zgłoś awarię", {
            transportId: transport.id,
            faultType: "awaria opony",
            description: "spadek ciśnienia i konieczna pomoc na trasie",
            gps: { lat: 52.096, lng: 18.93 },
            etaAfter: "2026-05-27T13:40:00.000Z"
          })}
          ${actionButton(engine, ActionTypes.REQUEST_TECHNICAL_SERVICE, "Wybierz serwis mobilny", {
            transportId: transport.id,
            providerType: "mobile_service",
            providerCompanyId: "co-mobile-service-a",
            cost: 280
          })}
          ${actionButton(engine, ActionTypes.ACCEPT_SERVICE_JOB, "Serwis przyjmuje", { transportId: transport.id })}
          ${actionButton(engine, ActionTypes.COMPLETE_SERVICE_JOB, "Zakończ serwis", {
            transportId: transport.id,
            cost: 280,
            rating: 5,
            etaAfter: "2026-05-27T13:40:00.000Z"
          })}
          ${actionButton(engine, ActionTypes.SEND_MESSAGE, "Kontakt przez GL", { transportId: transport.id, body: "Serwis techniczny jedzie do pojazdu. Kontakt przez GL.", language: "pl" })}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Zakres danych dla serwisu</span>
        <h2>Serwis nie widzi całego transportu ani finansów</h2>
        <div class="detail-grid">
          <div><span>Pojazd</span><strong>${vehiclePlate(state, request?.vehicleId || transport.vehicleId)}</strong></div>
          <div><span>Awaria</span><strong>${request?.faultType || "brak"}</strong></div>
          <div><span>Lokalizacja</span><strong>${gpsLabel(request?.gps || transport.pickup?.gps)}</strong></div>
          <div><span>Numer transportu</span><strong>${transport.number}</strong></div>
          <div><span>Dostawca</span><strong>${companyName(state, request?.providerCompanyId) || "nie wybrano"}</strong></div>
          <div><span>ETA</span><strong>${formatTime(request?.etaAfter || transport.eta)}</strong></div>
        </div>
      </article>
    </section>
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Najbliższe usługi</span>
        <h2>Warsztat, serwis mobilny, pomoc drogowa</h2>
        <div class="card-grid">
          ${providers.map((item) => `
            <article class="mini-card">
              <strong>${item.name}</strong>
              <span>${item.type} / ${item.responseMinutes} min</span>
              <mark class="good">${item.baseCost} ${item.currency}</mark>
            </article>
          `).join("") || `<p class="muted">Brak widocznych serwisów.</p>`}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Zgłoszenia serwisowe</span>
        <h2>czas reakcji, koszt, dokument i ocena</h2>
        <div class="list">
          ${requests.map((item) => `
            <div class="row">
              <strong>${item.faultType}</strong>
              <span>${transportNumber(state, item.transportId)} / ${companyName(state, item.providerCompanyId)}</span>
              <mark class="${tone(item.status)}">${item.status}</mark>
            </div>
          `).join("") || `<p class="muted">Brak zgłoszeń serwisowych.</p>`}
          ${payments.map((payment) => `
            <div class="row">
              <strong>${payment.amount} ${payment.currency}</strong>
              <span>${companyName(state, payment.providerCompanyId)}</span>
              <mark class="${tone(payment.status)}">${payment.status}</mark>
            </div>
          `).join("")}
          ${serviceDocs.map((doc) => `
            <div class="row">
              <strong>${doc.label}</strong>
              <span>${doc.integrityHash}</span>
              <small>${doc.type}</small>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
  `;
}

function renderApi(state, engine) {
  if (!state.apiClients.length) {
    return renderAccessDenied("GL API Engine", "API clients and audit are restricted to platform control roles.");
  }
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">GL API Engine</span>
        <h2>External systems need api_client_id and scopes</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.SIMULATE_API_CALL, "ERP create load", { apiClientId: "api-erp-nord", apiAction: "CREATE_LOAD" })}
          ${actionButton(engine, ActionTypes.SIMULATE_API_CALL, "ERP forbidden finance", { apiClientId: "api-erp-nord", apiAction: "RELEASE_PAYMENT" })}
          ${actionButton(engine, ActionTypes.SIMULATE_API_CALL, "GPS update", { apiClientId: "api-gps-baltic", apiAction: "GPS_UPDATE" })}
        </div>
      </article>
      <article class="panel">
        <h2>API clients</h2>
        <div class="list">
          ${state.apiClients.map((client) => `
            <div class="row">
              <strong>${client.name}</strong>
              <span>${client.scopes.join(", ")}</span>
              <mark class="${tone(client.status)}">${client.usedToday}/${client.dailyLimit}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
    <section class="panel">
      <span class="eyebrow">API audit</span>
      <h2>Every integration call leaves a row</h2>
      <div class="list">
        ${state.apiAudit.slice(0, 10).map((row) => `
          <div class="row">
            <strong>${row.apiClientId}</strong>
            <span>${row.action}</span>
            <mark class="${tone(row.result)}">${row.result}</mark>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderIntegrations(state, engine) {
  if (!state.integrations.length) {
    return renderAccessDenied("External Integration Engine", "Integration controls are hidden for this role.");
  }
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">External Integration Engine</span>
        <h2>ERP, GPS, insurance and payment bridges</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.RUN_INTEGRATION_SYNC, "Sync ERP", { integrationId: "int-erp-1" })}
          ${actionButton(engine, ActionTypes.RUN_INTEGRATION_SYNC, "Sync GPS", { integrationId: "int-gps-1" })}
          ${actionButton(engine, ActionTypes.RUN_INTEGRATION_SYNC, "Sync insurance", { integrationId: "int-ins-1" })}
        </div>
      </article>
      <article class="panel">
        <h2>Region rules</h2>
        <div class="list">
          ${state.regionRules.map((rule) => `
            <div class="row">
              <strong>${rule.region.toUpperCase()}</strong>
              <span>${rule.languages.join(", ")}</span>
              <mark class="good">${rule.currency}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
    <section class="panel">
      <h2>Integration status</h2>
      <div class="card-grid">
        ${state.integrations.map((integration) => `
          <article class="mini-card">
            <strong>${integration.name}</strong>
            <span>${integration.type} / ${companyName(state, integration.companyId)}</span>
            <mark class="${tone(integration.status)}">${integration.status}</mark>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCompliance(state, engine, selected) {
  const checks = state.complianceChecks.filter((check) => check.transportId === selected.id);
  const crewPlan = state.crewPlans.find((plan) => plan.transportId === selected.id);
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Tachograph / Crew Compliance</span>
        <h2>Driver time is checked before risky steps</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.RUN_COMPLIANCE_CHECK, "Run compliance check", { transportId: selected.id })}
        </div>
        <div class="detail-grid">
          <div><span>Driver</span><strong>${userName(state, selected.driverId) || "not assigned"}</strong></div>
          <div><span>Double crew</span><strong>${crewPlan?.doubleCrew ? "yes" : "no"}</strong></div>
          <div><span>Ferry/Rail</span><strong>${crewPlan?.ferryRailAllowance ? "allowed" : "none"}</strong></div>
        </div>
      </article>
      <article class="panel">
        <h2>Tachograph imports</h2>
        <div class="list">
          ${state.tachographImports.slice(0, 8).map((row) => `
            <div class="row">
              <strong>${userName(state, row.driverId)}</strong>
              <span>${row.drivingHours}h drive / ${row.breakHours}h break</span>
              <mark class="${tone(row.status)}">${row.status}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
    <section class="panel">
      <h2>Compliance checks</h2>
      <div class="list">
        ${checks.map((check) => `
          <div class="row">
            <strong>${check.id}</strong>
            <span>${check.violations.join("; ") || "no violations"}</span>
            <mark class="${tone(check.status)}">${check.status}</mark>
          </div>
        `).join("") || `<p class="muted">No compliance checks for selected transport.</p>`}
      </div>
    </section>
  `;
}

function renderResilience(state, engine) {
  if (!state.serviceHealth.length) {
    return renderAccessDenied("Scaling / Backup / Anti Failure", "Resilience controls are restricted to platform control roles.");
  }
  const checks = state.resilienceChecks || [];
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Anti Failure Engine</span>
        <h2>Service health, backups and emergency mode</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.RUN_RESILIENCE_CHECK, "Run resilience check", {})}
        </div>
        <div class="detail-grid">
          <div><span>Emergency</span><strong>${state.emergencyMode.enabled ? "enabled" : "ready"}</strong></div>
          <div><span>Critical</span><strong>${state.emergencyMode.criticalServices.join(", ")}</strong></div>
          <div><span>Backups</span><strong>${state.backupSnapshots.filter((backup) => backup.status === "ok").length}/${state.backupSnapshots.length}</strong></div>
        </div>
      </article>
      <article class="panel">
        <h2>Service health</h2>
        <div class="list">
          ${state.serviceHealth.map((service) => `
            <div class="row">
              <strong>${service.name}</strong>
              <span>${service.id}</span>
              <mark class="${tone(service.status)}">${service.status}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
    <section class="panel">
      <h2>Resilience checks</h2>
      <div class="list">
        ${checks.map((check) => `
          <div class="row">
            <strong>${check.id}</strong>
            <span>${check.degradedServiceIds.join(", ") || "all healthy"}</span>
            <mark class="${check.backupOk ? "good" : "danger"}">${check.backupOk ? "backup ok" : "backup risk"}</mark>
          </div>
        `).join("") || `<p class="muted">No resilience checks yet.</p>`}
      </div>
    </section>
  `;
}

function renderTrust(state) {
  return `
    <section class="panel">
      <span class="eyebrow">Trust Score Engine</span>
      <h2>Reputation for companies, drivers, warehouses and parking</h2>
      <div class="trust-grid">
        ${state.trustRecords.map((record) => `
          <article class="trust-card">
            <strong>${subjectName(state, record.subjectId)}</strong>
            <span>${record.subjectType}</span>
            <div class="bar"><span style="width:${record.score}%"></span></div>
            <b>${record.score}</b>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderAi(state, engine, selected) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">AI Control Agent</span>
        <h2>Agent kontrolny, nie cichy decydent</h2>
        <p class="muted">AI moze tworzyc alerty, blokowac kolejny krok i przekazac sprawe adminowi. Nie usuwa danych i nie wyplaca pieniedzy.</p>
        ${actionButton(engine, ActionTypes.AI_RUN_CHECK, "Run AI inspection", { transportId: selected.id })}
      </article>
      <article class="panel">
        <h2>AI alerts</h2>
        <div class="list">
          ${state.aiAlerts.map((alert) => `
            <div class="row">
              <strong>${transportNumber(state, alert.transportId)}</strong>
              <span>${alert.reason}</span>
              <mark class="${tone(alert.severity)}">${alert.severity}</mark>
            </div>
          `).join("")}
        </div>
      </article>
    </section>
  `;
}

function renderAudit(state) {
  return `
    <section class="panel">
      <span class="eyebrow">Audit Log</span>
      <h2>Read only, event sourced</h2>
      <div class="audit-table">
        ${state.audit.map((row) => `
        <div class="audit-row">
          <span>${formatTime(row.at)}</span>
          <strong>${row.requestedAction || row.action}</strong>
          <span>${row.actorRole}</span>
          <span>${row.objectType}:${row.objectId}</span>
          <span>${row.result || "success"}</span>
          <span>${row.newState || "-"}</span>
          <small>${row.reason}</small>
        </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderSystemTests(state, engine, selected) {
  const blockedWorkflow = selected
    ? !engine.explainAction(ActionTypes.RELEASE_PAYMENT, { transportId: selected.id }).ok
    : true;
  const tests = [
    ["localStorage dziala", storageAvailable()],
    ["reset demo dziala", engine.explainAction(ActionTypes.RESET_DEMO, {}).ok],
    ["sa dane startowe", state.demoDataVersion && state.users.length > 0 && state.companies.length > 0],
    ["permissions dzialaja", typeof engine.modules.permissions.canPerformAction === "function"],
    ["workflow blokuje zle akcje", blockedWorkflow],
    ["audit log zapisuje zdarzenia", state.audit.length > 0],
    ["brak transportow nie wysypuje UI", selectedTransport({ transports: [], session: {} }) === null],
    ["DEMO_MODE aktywny", DEMO_MODE === true]
  ];
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <span class="eyebrow">System Tests</span>
          <h2>Checklist stabilnosci demo</h2>
        </div>
      </div>
      <div class="test-list">
        ${tests.map(([label, ok]) => `
          <div class="test-row ${ok ? "pass" : "fail"}">
            <strong>${label}</strong>
            <mark class="${ok ? "good" : "danger"}">${ok ? "PASS" : "FAIL"}</mark>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderContextRail(state, engine, selected, roleConfig) {
  const aiAlerts = state.aiAlerts.filter((alert) => !selected || alert.transportId === selected.id).slice(0, 3);
  const activity = state.audit.filter((row) => !selected || row.transportId === selected.id || row.objectId === selected.id).slice(0, 5);
  return `
    <aside class="context-rail">
      <section class="context-panel">
        <span class="eyebrow">${roleConfig.workspace}</span>
        <h2>Kontekst</h2>
        <div class="context-stack">
          <div><span>Status</span><strong>${selected?.status || "brak transportu"}</strong></div>
          <div><span>GPS</span><strong>${selected ? `${gpsLabel(selected.pickup.gps)} / ${gpsLabel(selected.delivery.gps)}` : "-"}</strong></div>
          <div><span>ETA</span><strong>${selected?.eta ? formatTime(selected.eta) : "brak"}</strong></div>
          <div><span>Platnosc</span><strong>${selected ? (state.access?.canViewFinancials ? selected.paymentStatus : "ograniczone") : "-"}</strong></div>
        </div>
      </section>
      <section class="context-panel">
        <span class="eyebrow">AI / powiadomienia</span>
        <h2>Alerty</h2>
        <div class="list compact-list">
          ${aiAlerts.map((alert) => `
            <div class="row">
              <strong>${alert.type}</strong>
              <span>${alert.status}</span>
              <small>${alert.reason}</small>
            </div>
          `).join("") || `<p class="muted">Brak aktywnych alertow.</p>`}
        </div>
      </section>
      <section class="context-panel">
        <span class="eyebrow">Aktywnosc</span>
        <h2>Ostatnie zdarzenia</h2>
        <div class="list compact-list">
          ${activity.map((row) => `
            <div class="row">
              <strong>${row.requestedAction || row.action}</strong>
              <span>${row.result || "success"}</span>
              <small>${row.reason}</small>
            </div>
          `).join("") || `<p class="muted">Brak aktywnosci.</p>`}
        </div>
      </section>
    </aside>
  `;
}

function renderProfile(state) {
  const user = state.users.find((item) => item.id === state.session.userId);
  return `
    <section class="panel">
      <span class="eyebrow">Profil</span>
      <h2>${user?.name || "Uzytkownik demo"}</h2>
      <div class="detail-grid">
        <div><span>Rola</span><strong>${RoleLabels[state.session.role]}</strong></div>
        <div><span>Firma</span><strong>${companyName(state, user?.companyId) || "platforma"}</strong></div>
        <div><span>Status</span><strong>${user?.accountStatus || "demo"}</strong></div>
      </div>
      <p class="muted">W trybie produkcyjnym profil i rola pochodza z backendu oraz Permissions Engine. UI demo tylko symuluje logowanie rola.</p>
    </section>
  `;
}

function renderCompanies(state) {
  return `
    <section class="panel">
      <span class="eyebrow">Company Engine</span>
      <h2>Firmy</h2>
      <div class="card-grid">
        ${state.companies.map((company) => `
          <article class="mini-card">
            <strong>${company.name}</strong>
            <span>${company.type}</span>
            <mark class="${tone(company.status || "active")}">${company.status || "active"}</mark>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderUsers(state) {
  return `
    <section class="panel">
      <span class="eyebrow">User Engine</span>
      <h2>Uzytkownicy</h2>
      <div class="transport-table compact-table">
        ${state.users.map((user) => `
          <div class="table-row">
            <span>${user.id}</span>
            <span>${user.name}</span>
            <span>${user.roles?.[0] || "role"}</span>
            <span>${companyName(state, user.companyId) || "platforma"}</span>
            <span>${user.phone}</span>
            <span>${user.accountStatus}</span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderStatistics(state) {
  return `
    <section class="metrics">
      ${metric("Transporty", state.transports.length, "calosc")}
      ${metric("Zdarzenia", state.events.length, "event bus")}
      ${metric("Audit", state.audit.length, "read only")}
      ${metric("Dokumenty", state.documents.length, "transportowe")}
      ${metric("Trust", state.trustScores?.length || state.trust?.length || 0, "rekordy")}
    </section>
    <section class="panel">
      <span class="eyebrow">Statystyki</span>
      <h2>Platforma GL Enterprise II</h2>
      <div class="module-grid">
        ${["workflow", "permissions", "audit", "GPS", "documents", "payments", "AI", "trust"].map((name) => `<div class="module-pill">${name}</div>`).join("")}
      </div>
    </section>
  `;
}

function renderSystem(state, engine) {
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">System</span>
        <h2>Operacje demo</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.RUN_RESILIENCE_CHECK, "Run resilience check", {})}
          ${actionButton(engine, ActionTypes.RESET_DEMO, "Reset demo data", {})}
        </div>
      </article>
      <article class="panel">
        <span class="eyebrow">Konfiguracja UI</span>
        <h2>roleConfig</h2>
        <p class="muted">Menu, dashboard, widgety i akcje sa wybierane przez aktywna role. Ukryte moduly nie sa renderowane w menu roli.</p>
      </article>
    </section>
  `;
}

function renderSecurityActions(engine, selected, state) {
  return `
    <div class="actions">
      ${actionButton(engine, ActionTypes.SCAN_LICENSE_PLATE, "Skanuj tablice", { licensePlate: vehiclePlate(state, selected.vehicleId), reason: "gate arrival check" })}
      ${actionButton(engine, ActionTypes.RECORD_SECURITY_CHECK, "Zatwierdz brame", { transportId: selected.id, checkpoint: "pickup", status: "cleared", reason: "Gate cleared" })}
    </div>
  `;
}

function renderCustomsActions(engine, selected) {
  return `
    <div class="actions">
      ${actionButton(engine, ActionTypes.START_CUSTOMS, "Rozpocznij odprawe", { transportId: selected.id })}
      ${actionButton(engine, ActionTypes.CLEAR_CUSTOMS, "Zwolnij celnie", { transportId: selected.id })}
    </div>
  `;
}

function renderAuthorityActions(engine, selected) {
  return `
    <div class="actions">
      ${actionButton(engine, ActionTypes.START_AUTHORITY_CONTROL, "Rozpocznij kontrole", { transportId: selected.id })}
      ${actionButton(engine, ActionTypes.PASS_AUTHORITY_CONTROL, "Kontrola pozytywna", { transportId: selected.id })}
    </div>
  `;
}

function renderFerryActions(engine, selected) {
  return `
    <div class="actions">
      ${actionButton(engine, ActionTypes.BOOK_FERRY, "Zarezerwuj prom", { transportId: selected.id, operatorCompanyId: "co-ferry-dfds" })}
      ${actionButton(engine, ActionTypes.COMPLETE_FERRY, "Zakoncz prom", { transportId: selected.id })}
    </div>
  `;
}

function renderServiceActions(engine, selected, state) {
  const provider = state.serviceProviders?.[0];
  return `
    <div class="actions">
      ${actionButton(engine, ActionTypes.ACCEPT_SERVICE_JOB, "Przyjmij serwis", { transportId: selected.id, providerCompanyId: provider?.companyId })}
      ${actionButton(engine, ActionTypes.COMPLETE_SERVICE_JOB, "Zakoncz serwis", { transportId: selected.id, cost: 320, rating: 5 })}
    </div>
  `;
}

function renderAdmin(state, engine, selected) {
  const targetUser = state.users.find((user) => user.accountStatus !== "blocked" && user.id !== state.session.userId) || state.users[0];
  return `
    <section class="grid two">
      <article class="panel">
        <span class="eyebrow">Admin Panel</span>
        <h2>Manual controls still go through Core Engine</h2>
        <div class="actions">
          ${actionButton(engine, ActionTypes.ADMIN_BLOCK_TRANSPORT, "Block transport", { transportId: selected.id, reason: "manual demo block" })}
          ${actionButton(engine, ActionTypes.ADMIN_RESOLVE_DISPUTE, "Resolve dispute", { transportId: selected.id, reason: "admin evidence decision" })}
          ${actionButton(engine, ActionTypes.ADMIN_BLOCK_ACCOUNT, "Block account", { userId: targetUser.id, reason: "demo account risk" })}
          ${actionButton(engine, ActionTypes.RESET_DEMO, "Reset demo", {})}
        </div>
      </article>
      ${renderAuditSlice(state, selected)}
    </section>
  `;
}

function renderTransportCard(state, transport) {
  const progress = StatusProgress[transport.status] ?? 10;
  return `
    <article class="panel transport-card">
      <div class="panel-head">
        <div>
          <span class="eyebrow">${transport.id}</span>
          <h2>${transport.number} / ${transport.cargo.description}</h2>
        </div>
        <mark class="${tone(transport.status)}">${transport.status}</mark>
      </div>
      <div class="detail-grid">
        <div><span>Client</span><strong>${companyName(state, transport.clientCompanyId)}</strong></div>
        <div><span>Carrier</span><strong>${companyName(state, transport.carrierCompanyId) || "not assigned"}</strong></div>
        <div><span>Driver</span><strong>${userName(state, transport.driverId) || "not assigned"}</strong></div>
        <div><span>Tryb</span><strong>${transport.transportMode || "ROAD"}</strong></div>
        <div><span>Pickup GPS</span><strong>${gpsLabel(transport.pickup.gps)}</strong></div>
        <div><span>Delivery GPS</span><strong>${gpsLabel(transport.delivery.gps)}</strong></div>
        <div><span>ETA</span><strong>${transport.eta ? formatTime(transport.eta) : "brak"}</strong></div>
        <div><span>Payment</span><strong>${state.access?.canViewFinancials ? transport.paymentStatus : "restricted"}</strong></div>
      </div>
      <div class="progress">
        <span style="width:${progress}%"></span>
      </div>
      <p class="muted">${transport.pickup.address} -> ${transport.delivery.address}</p>
    </article>
  `;
}

function renderTimeline(state, transport) {
  return `
    <article class="panel">
      <span class="eyebrow">Workflow history</span>
      <h2>Status history</h2>
      <div class="timeline">
        ${transport.statusHistory.slice().reverse().map((item) => `
          <div class="timeline-row">
            <span>${formatTime(item.at)}</span>
            <strong>${item.from || "start"} -> ${item.to}</strong>
            <p>${item.reason}</p>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function renderAuditSlice(state, transport) {
  const rows = state.audit.filter((item) => item.objectId === transport.id || item.transportId === transport.id).slice(0, 8);
  return `
    <article class="panel">
      <span class="eyebrow">Transport audit</span>
      <h2>${transport.number}</h2>
      <div class="list">
        ${rows.map((row) => `
          <div class="row">
            <strong>${row.action}</strong>
            <span>${row.actorRole}</span>
            <small>${row.reason}</small>
          </div>
        `).join("") || `<p class="muted">No audit records yet.</p>`}
      </div>
    </article>
  `;
}

function renderPhotoList(state, transport) {
  const photos = state.photos.filter((photo) => photo.transportId === transport.id);
  return `
    <article class="panel">
      <h2>Photos in documentation</h2>
      <div class="list">
        ${photos.map((photo) => `
          <div class="row">
            <strong>${photo.label}</strong>
            <span>${photo.type}</span>
            <mark class="${tone(photo.state)}">${photo.state}</mark>
          </div>
        `).join("") || `<p class="muted">No photos yet.</p>`}
      </div>
    </article>
  `;
}

function blockerList(engine, transport) {
  if (!transport) return `<div class="blocker blocked"><strong>Workflow</strong><span>Brak transportow</span></div>`;
  const checks = [
    [ActionTypes.PUBLISH_LOAD, "Publish load"],
    [ActionTypes.ACCEPT_CARRIER, "Carrier accept"],
    [ActionTypes.ASSIGN_DRIVER, "Assign driver"],
    [ActionTypes.START_TRANSIT, "Start transit"],
    [ActionTypes.RELEASE_PAYMENT, "Release payment"]
  ];
  return checks.map(([action, label]) => {
    const payload = defaultPayloadFor(action, transport);
    const result = engine.explainAction(action, payload);
    return `
      <div class="blocker ${result.ok ? "ok" : "blocked"}">
        <strong>${label}</strong>
        <span>${result.ok ? readinessMessage(action) : result.reasons.join("; ")}</span>
      </div>
    `;
  }).join("");
}

function defaultPayloadFor(action, transport) {
  if (!transport) return {};
  if (action === ActionTypes.ACCEPT_CARRIER) return { transportId: transport.id, carrierCompanyId: "co-carrier-a" };
  if (action === ActionTypes.ASSIGN_DRIVER) return { transportId: transport.id, driverId: "u-driver-1", vehicleId: "vh-1" };
  return { transportId: transport.id };
}

function actionButton(engine, action, label, payload = {}) {
  const result = engine.explainAction(action, payload);
  return `
    <button class="action ${result.ok ? "ready" : "blocked"}" data-action="${action}" data-payload="${encodePayload(payload)}">
      <strong>${label}</strong>
      <span>${result.ok ? readinessMessage(action) : result.reasons[0]}</span>
    </button>
  `;
}

function disabledAction(label, reason) {
  return `
    <button class="action blocked" type="button" aria-disabled="true">
      <strong>${label}</strong>
      <span>${reason}</span>
    </button>
  `;
}

function readinessMessage(action) {
  const messages = {
    [ActionTypes.PUBLISH_LOAD]: "Mozesz opublikowac transport",
    [ActionTypes.ADD_LOAD_PHOTO]: "Mozesz dodac zdjecie ladunku",
    [ActionTypes.CONFIRM_GPS]: "Mozesz zapisac GPS",
    [ActionTypes.ASSIGN_DRIVER]: "Mozesz przypisac kierowce",
    [ActionTypes.UPLOAD_DOCUMENT]: "Mozesz dodac dokument",
    [ActionTypes.PARKING_REPORT]: "Mozesz zglosic parking",
    [ActionTypes.RELEASE_PAYMENT]: "Mozesz zwolnic platnosc"
  };
  return messages[action] || "Akcja dostepna";
}

function renderNoTransport() {
  return `
    <section class="panel empty-state">
      <span class="eyebrow">Transport Engine</span>
      <h2>Brak transportow</h2>
      <p class="muted">Lista transportow jest pusta albo ta rola nie ma dostepu do transportow. Akcje zalezne od transportu sa zablokowane.</p>
      <div class="actions">
        ${disabledAction("Akcja transportowa", "Brak transportow")}
      </div>
    </section>
  `;
}

function renderNoTransportTable() {
  return `
    <section class="panel empty-state">
      <span class="eyebrow">Transport Engine</span>
      <h2>Brak transportow</h2>
      <p class="muted">Nie ma transportow do wyswietlenia. Mozesz utworzyc nowy transport w widoku Utworz ladunek.</p>
    </section>
  `;
}

function transportScopedView(view) {
  return new Set([
    "details",
    "warehouse",
    "carrier",
    "driver_assignment",
    "live_map",
    "gps",
    "photos",
    "parking",
    "documents",
    "payments",
    "insurance",
    "communication",
    "security",
    "customs",
    "authority",
    "ferry",
    "service_orders",
    "service",
    "compliance",
    "ai",
    "admin"
  ]).has(view);
}

function renderCreateTransportForm(state) {
  return `
    <form class="demo-form" data-form-action="${ActionTypes.CREATE_LOAD}">
      <label>Opis ladunku<input name="description" value="Transport testowy GL" /></label>
      <label>Odbior<input name="pickupAddress" value="Gdansk terminal" /></label>
      <label>Dostawa<input name="deliveryAddress" value="Berlin magazyn" /></label>
      <label>GPS odbioru lat<input name="pickupGps.lat" value="54.3520" inputmode="decimal" /></label>
      <label>GPS odbioru lng<input name="pickupGps.lng" value="18.6466" inputmode="decimal" /></label>
      <label>GPS dostawy lat<input name="deliveryGps.lat" value="52.5200" inputmode="decimal" /></label>
      <label>GPS dostawy lng<input name="deliveryGps.lng" value="13.4050" inputmode="decimal" /></label>
      <label>Waga kg<input name="weightKg" value="1200" inputmode="numeric" /></label>
      <label>Cena demo<input name="price" value="1500" inputmode="numeric" /></label>
      <input type="hidden" name="clientCompanyId" value="${state.session.companyId || "co-client-a"}" />
      <button class="action ready" type="submit"><strong>Utworz transport z formularza</strong><span>Przejdzie przez Core Engine</span></button>
    </form>
  `;
}

function renderPhotoForm(selected) {
  return `
    <form class="demo-form" data-form-action="${ActionTypes.ADD_LOAD_PHOTO}" data-payload="${encodePayload({ transportId: selected.id })}">
      <label>Typ zdjecia<input name="type" value="loading" /></label>
      <label>Opis zdjecia<input name="label" value="Zdjecie ladunku" /></label>
      <button class="action ready" type="submit"><strong>Dodaj zdjecie z formularza</strong><span>Mozesz dodac zdjecie ladunku</span></button>
    </form>
  `;
}

function renderGpsForm(selected) {
  return `
    <form class="demo-form" data-form-action="${ActionTypes.CONFIRM_GPS}" data-payload="${encodePayload({ transportId: selected.id })}">
      <label>Pickup lat<input name="pickupGps.lat" value="${selected.pickup.gps?.lat ?? 54.3520}" inputmode="decimal" /></label>
      <label>Pickup lng<input name="pickupGps.lng" value="${selected.pickup.gps?.lng ?? 18.6466}" inputmode="decimal" /></label>
      <label>Delivery lat<input name="deliveryGps.lat" value="${selected.delivery.gps?.lat ?? 52.5200}" inputmode="decimal" /></label>
      <label>Delivery lng<input name="deliveryGps.lng" value="${selected.delivery.gps?.lng ?? 13.4050}" inputmode="decimal" /></label>
      <button class="action ready" type="submit"><strong>Zapisz GPS z formularza</strong><span>Mozesz zapisac GPS</span></button>
    </form>
  `;
}

function renderDriverAssignmentForm(state, selected) {
  const drivers = state.users.filter((user) => user.roles.includes(Roles.DRIVER));
  const vehicles = state.vehicles.filter((vehicle) => !selected.carrierCompanyId || vehicle.companyId === selected.carrierCompanyId);
  return `
    <form class="demo-form" data-form-action="${ActionTypes.ASSIGN_DRIVER}" data-payload="${encodePayload({ transportId: selected.id })}">
      <label>Kierowca<select name="driverId">${drivers.map((driver) => `<option value="${driver.id}">${driver.name}</option>`).join("")}</select></label>
      <label>Pojazd<select name="vehicleId">${vehicles.map((vehicle) => `<option value="${vehicle.id}">${vehicle.plate}</option>`).join("")}</select></label>
      <button class="action ready" type="submit"><strong>Przypisz kierowce z formularza</strong><span>Mozesz przypisac kierowce</span></button>
    </form>
  `;
}

function renderDocumentForm(selected) {
  return `
    <form class="demo-form" data-form-action="${ActionTypes.UPLOAD_DOCUMENT}" data-payload="${encodePayload({ transportId: selected.id })}">
      <label>Typ dokumentu<select name="type">
        <option value="cmr">CMR</option>
        <option value="pickup_confirmation">Potwierdzenie zaladunku</option>
        <option value="delivery_confirmation">Potwierdzenie rozladunku</option>
        <option value="mrn">MRN</option>
      </select></label>
      <label>Nazwa dokumentu<input name="label" value="Dokument CMR" /></label>
      <button class="action ready" type="submit"><strong>Dodaj dokument z formularza</strong><span>Mozesz dodac dokument</span></button>
    </form>
  `;
}

function renderParkingReportForm(state) {
  const parking = state.parking[0];
  return `
    <form class="demo-form" data-form-action="${ActionTypes.PARKING_REPORT}">
      <label>Parking<select name="parkingId">${state.parking.map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></label>
      <label>Wolne miejsca<input name="freePlaces" value="${parking?.freePlaces ?? 4}" inputmode="numeric" /></label>
      <input type="hidden" name="credible" value="true" />
      <button class="action ready" type="submit"><strong>Zglos parking z formularza</strong><span>Mozesz zglosic parking</span></button>
    </form>
  `;
}

function metric(label, value, sub) {
  return `
    <article class="metric">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${sub}</small>
    </article>
  `;
}

function renderAccessDenied(title, message) {
  return `
    <section class="panel access-panel">
      <span class="eyebrow">Permission Engine</span>
      <h2>${title}</h2>
      <p class="muted">${message}</p>
    </section>
  `;
}

export function selectedTransport(state) {
  if (!state?.transports?.length) return null;
  return state.transports.find((transport) => transport.id === state.session?.selectedTransportId) || state.transports[0] || null;
}

function financialTotals(state) {
  const wallets = state.wallets || [];
  const payments = state.payments || [];
  const escrows = state.escrows || [];
  const sum = (items, selector) => items.reduce((total, item) => total + Number(selector(item) || 0), 0);
  const pendingPayments = payments.filter((payment) => String(payment.status).includes("pending"));
  const reservedPayments = payments.filter((payment) => String(payment.status).includes("reserved"));
  const blockedPayments = payments.filter((payment) => String(payment.status).includes("blocked"));

  return {
    available: sum(wallets, (wallet) => wallet.balance),
    blocked: sum(wallets, (wallet) => (wallet.heldBalance || 0) + (wallet.blockedBalance || 0)) + sum(blockedPayments, (payment) => payment.amount),
    pending: sum(wallets, (wallet) => wallet.pendingBalance) + sum(pendingPayments, (payment) => payment.amount),
    escrow: sum(escrows.filter((escrow) => escrow.status !== "released"), (escrow) => escrow.amount),
    inTransit: sum(wallets, (wallet) => wallet.paymentsInTransit) + sum(reservedPayments, (payment) => payment.amount),
    disputes: (state.disputes || []).length,
    totalSystem: sum(wallets, (wallet) => wallet.balance + (wallet.heldBalance || 0) + (wallet.pendingBalance || 0))
  };
}

function calculateGlFee(transport) {
  const gross = Number(transport?.price || 0);
  const currency = "EUR";
  const feeGross = Math.round(gross * 0.03 * 100) / 100;
  const tax = Math.round(feeGross * 0.23 * 100) / 100;
  const feeNet = Math.max(0, Math.round((feeGross - tax) * 100) / 100);
  return {
    gross,
    currency,
    feeGross,
    feeNet,
    tax,
    carrierAmount: Math.max(0, Math.round((gross - feeGross) * 100) / 100)
  };
}

function financeMetric(label, amount, currency, toneName) {
  return `
    <article class="finance-metric ${toneName}">
      <span>${label}</span>
      <strong>${formatMoney(amount, currency)}</strong>
      <small>DEMO ledger</small>
    </article>
  `;
}

function formatMoney(amount, currency = "EUR") {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function formatWalletDate(value) {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" }),
    time: date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
  };
}

function entityName(state, id) {
  if (!id) return "-";
  if (String(id).startsWith("escrow:")) return `Escrow ${String(id).replace("escrow:", "")}`;
  return companyName(state, id) || userName(state, id) || id;
}

function walletOwnerName(state, wallet) {
  return userName(state, wallet.ownerUserId)
    || companyName(state, wallet.ownerCompanyId)
    || (wallet.ownerCompanyId === "platform" ? "GL Enterprise" : wallet.ownerCompanyId);
}

function financeTone(value) {
  const text = String(value || "").toLowerCase();
  if (["critical", "high"].includes(text) || text.includes("blocked") || text.includes("rejected") || text.includes("cancelled") || text.includes("disputed")) return "danger";
  if (["info", "low"].includes(text) || text.includes("released") || text.includes("completed")) return "good";
  if (text.includes("pending") || text.includes("reserved") || text.includes("escrow") || text.includes("medium") || text.includes("refunded")) return "warning";
  return "info";
}

function companyName(state, companyId) {
  return state.companies.find((company) => company.id === companyId)?.name || "";
}

function userName(state, userId) {
  return state.users.find((user) => user.id === userId)?.name || "";
}

function vehiclePlate(state, vehicleId) {
  return state.vehicles.find((vehicle) => vehicle.id === vehicleId)?.plate || "GDA 5K92";
}

function transportNumber(state, transportId) {
  return state.transports.find((transport) => transport.id === transportId)?.number || transportId;
}

function subjectName(state, subjectId) {
  return companyName(state, subjectId)
    || userName(state, subjectId)
    || state.parking.find((parking) => parking.id === subjectId)?.name
    || subjectId;
}

function gpsLabel(gps) {
  if (!gps) return "missing";
  return `${Number(gps.lat).toFixed(3)}, ${Number(gps.lng).toFixed(3)}`;
}

function driverTimeLabel(state, driverId) {
  const record = state.driverTime.find((item) => item.driverId === driverId);
  if (!record) return "driver time missing";
  return `${record.remainingLegalHours}h legal left / ${record.legalToComplete ? "legal" : "blocked"}`;
}

function tone(value) {
  const text = String(value || "");
  if (text.includes("blocked") || text.includes("risk") || text.includes("dispute") || text.includes("high") || text.includes("suspended") || text.includes("violation") || text.includes("denied")) return "danger";
  if (text.includes("pending") || text.includes("open") || text.includes("medium") || text.includes("review") || text.includes("degraded")) return "warning";
  return "good";
}

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function sanitizeStateForUi(value, key = "") {
  const textKeys = new Set([
    "address",
    "body",
    "comment",
    "description",
    "dimensions",
    "label",
    "name",
    "phone",
    "reason"
  ]);
  if (Array.isArray(value)) return value.map((item) => sanitizeStateForUi(item, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, sanitizeStateForUi(entryValue, entryKey)])
    );
  }
  if (typeof value === "string" && textKeys.has(key)) return escapeHtml(value);
  return value;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function storageAvailable() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return true;
    const key = "__gl_storage_test__";
    window.localStorage.setItem(key, "1");
    const ok = window.localStorage.getItem(key) === "1";
    window.localStorage.removeItem(key);
    return ok;
  } catch (error) {
    return false;
  }
}

function encodePayload(payload) {
  return encodeURIComponent(JSON.stringify(payload));
}

function localizeHtml(html) {
  return html
    .split(/(<[^>]+>)/g)
    .map((part) => part.startsWith("<") ? part : localizeText(part))
    .join("");
}

const ExactText = Object.freeze({
  "GL Core Engine": "Rdzeń GL",
  "Core rule": "Reguła rdzenia",
  "User action -> permission -> validation -> workflow -> event -> audit -> UI": "Akcja użytkownika -> uprawnienia -> walidacja -> przepływ pracy -> zdarzenie -> audyt -> interfejs",
  "DEMO 2 / stable core": "DEMO 2 / stabilny rdzeń",
  "GL Core Engine ready": "Rdzeń GL gotowy",
  "Action accepted": "Akcja przyjęta",
  "Action blocked": "Akcja zablokowana",
  "Transports": "Transporty",
  "Shipments": "Ładunki",
  "Events": "Zdarzenia",
  "Audit rows": "Wiersze audytu",
  "AI alerts": "Alerty AI",
  "Escrow holds": "Blokady escrow",
  "Core pipeline": "Ścieżka rdzenia",
  "USER ACTION": "AKCJA UŻYTKOWNIKA",
  "PERMISSION CHECK": "SPRAWDZENIE UPRAWNIEŃ",
  "VALIDATION": "WALIDACJA",
  "WORKFLOW ENGINE": "SILNIK PRZEPŁYWU",
  "EVENT BUS": "MAGISTRALA ZDARZEŃ",
  "AUDIT LOG": "DZIENNIK AUDYTU",
  "UI UPDATE": "AKTUALIZACJA INTERFEJSU",
  "Modules": "Moduły",
  "Business engines": "Silniki biznesowe",
  "Auth system": "System logowania",
  "Phone login, register, verify, recover": "Telefon do logowania, rejestracji, weryfikacji i odzyskiwania",
  "Accounts": "Konta",
  "Permissions engine": "Silnik uprawnień",
  "Transport Engine": "Silnik transportu",
  "Shipment Engine": "Silnik ładunków",
  "Workflow blockers": "Blokady przepływu",
  "Create load": "Utwórz ładunek",
  "Warehouse photo step": "Etap zdjęcia magazynowego",
  "Photo Engine": "Silnik dowodów zdjęciowych",
  "Carrier acceptance": "Akceptacja przewoźnika",
  "Driver Time Engine": "Silnik czasu pracy kierowcy",
  "Driver assignment": "Przypisanie kierowcy",
  "Driver mobile": "Modul kierowcy",
  "GPS pipeline": "Ścieżka GPS",
  "Parking Live Network": "Sieć parkingów live",
  "Document Engine": "Silnik dokumentów",
  "Transport documents": "Dokumenty transportu",
  "Payment Engine": "Silnik płatności",
  "Payment ledger": "Księga płatności",
  "Wallet Engine": "Silnik portfeli",
  "Wallet ledger": "Księga portfela",
  "Escrow Engine": "Silnik escrow",
  "GL Revenue Engine": "Silnik przychodów GL",
  "Insurance Engine": "Silnik ubezpieczeń",
  "Dispute Evidence Engine": "Silnik paczek dowodowych",
  "Jobs Engine": "Silnik zleceń pracy",
  "Communication Engine": "Silnik komunikacji",
  "Translation Engine": "Silnik tłumaczeń",
  "Security Engine": "Silnik ochrony",
  "Plate-to-driver": "Kontakt tablica-kierowca",
  "GL API Engine": "Silnik API GL",
  "API clients": "Klienci API",
  "API audit": "Audyt API",
  "External Integration Engine": "Silnik integracji zewnętrznych",
  "Region rules": "Reguły regionów",
  "Integration status": "Status integracji",
  "Tachograph / Crew Compliance": "Tachograf / zgodność załogi",
  "Tachograph imports": "Importy tachografu",
  "Compliance checks": "Kontrole zgodności",
  "Anti Failure Engine": "Silnik odporności",
  "Service health": "Stan usług",
  "Resilience checks": "Kontrole odporności",
  "Trust Score Engine": "Silnik reputacji",
  "AI Control Agent": "Agent kontroli AI",
  "Audit Log": "Dziennik audytu",
  "Admin Panel": "Panel admina",
  "Permission Engine": "Silnik uprawnień",
  "Workflow history": "Historia przepływu",
  "Status history": "Historia statusów",
  "Transport audit": "Audyt transportu",
  "Photos in documentation": "Zdjęcia w dokumentacji",
  "ID": "ID",
  "Client": "Klient",
  "Carrier": "Przewoźnik",
  "Status": "Status",
  "Payment": "Płatność",
  "Photos": "Zdjęcia",
  "Docs": "Dokumenty",
  "Pickup": "Odbiór",
  "Delivery": "Dostawa",
  "Deviation": "Odchylenie trasy",
  "Driver": "Kierowca",
  "Pickup GPS": "GPS odbioru",
  "Delivery GPS": "GPS dostawy",
  "Double crew": "Podwójna obsada",
  "Ferry/Rail": "Prom/Kolej",
  "Emergency": "Tryb awaryjny",
  "Critical": "Krytyczne usługi",
  "Backups": "Kopie zapasowe",
  "No visible shipments for this role.": "Brak widocznych ładunków dla tej roli.",
  "No documents for selected transport.": "Brak dokumentów dla wybranego transportu.",
  "No visible wallets.": "Brak widocznych portfeli.",
  "No ledger rows visible.": "Brak widocznych wpisów księgi.",
  "No escrow rows visible.": "Brak widocznych rekordów escrow.",
  "No evidence pack for selected transport.": "Brak paczki dowodowej dla wybranego transportu.",
  "No jobs visible for this role.": "Brak widocznych zleceń pracy dla tej roli.",
  "No messages for selected transport.": "Brak wiadomości dla wybranego transportu.",
  "No messages visible.": "Brak widocznych wiadomości.",
  "No translations yet.": "Brak tłumaczeń.",
  "No checks for selected transport.": "Brak kontroli dla wybranego transportu.",
  "No plate lookups yet.": "Brak skanów tablic.",
  "No compliance checks for selected transport.": "Brak kontroli zgodności dla wybranego transportu.",
  "No resilience checks yet.": "Brak kontroli odporności.",
  "No audit records yet.": "Brak wpisów audytu.",
  "No photos yet.": "Brak zdjęć.",
  "not assigned": "nie przypisano",
  "confirmed": "potwierdzone",
  "missing": "brak",
  "restricted": "ograniczone",
  "ready": "gotowe",
  "blocked": "zablokowane",
  "hidden": "ukryte",
  "open": "otwarte",
  "read only": "tylko odczyt",
  "single source": "jedno źródło prawdy",
  "event bus": "magistrala zdarzeń",
  "yes": "tak",
  "no": "nie",
  "allowed": "dozwolone",
  "none": "brak",
  "enabled": "włączony",
  "backup ok": "kopie OK",
  "backup risk": "ryzyko kopii",
  "all healthy": "wszystko działa",
  "no violations": "brak naruszeń",
  "valid": "ważne",
  "invalid": "nieważne",
  "legal": "legalnie",
  "ok": "OK",
  "good": "dobry",
  "risk": "ryzyko",
  "high": "wysoki",
  "medium": "średni",
  "low": "niski",
  "draft": "szkic",
  "pending": "oczekuje",
  "verified": "zweryfikowane",
  "suspended": "zawieszone",
  "completed": "zakończone",
  "cancelled": "anulowane",
  "released": "zwolnione",
  "reserved": "zarezerwowane",
  "refunded": "zwrócone",
  "failed": "nieudane",
  "matched": "dopasowano",
  "not_found": "nie znaleziono",
  "healthy": "sprawne",
  "degraded": "pogorszone",
  "passed": "zaliczone",
  "violation": "naruszenie"
});

const PhraseTranslations = [
  ["Stan jest mockowany, ale akcje przechodza przez rdzen, event bus i audit log.", "Stan jest demonstracyjny, ale akcje przechodzą przez rdzeń, magistralę zdarzeń i dziennik audytu."],
  ["Nie ma logiki w przyciskach", "Nie ma logiki w przyciskach"],
  ["Run AI check", "Uruchom kontrolę AI"],
  ["Publish load", "Opublikuj ładunek"],
  ["Carrier accept", "Akceptacja przewoźnika"],
  ["Assign driver", "Przypisz kierowcę"],
  ["Release payment", "Zwolnij płatność"],
  ["Register by phone", "Zarejestruj przez telefon"],
  ["Verify document + face", "Zweryfikuj dokument i twarz"],
  ["Change phone safely", "Bezpiecznie zmień telefon"],
  ["Centralny obiekt systemu", "Centralny obiekt systemu"],
  ["Oddzielne shipment_id dla kazdego ladunku", "Oddzielne shipment_id dla każdego ładunku"],
  ["Nowy transport przechodzi przez Core Engine", "Nowy transport przechodzi przez rdzeń GL"],
  ["Create demo load", "Utwórz ładunek demo"],
  ["Add pre-publish photo", "Dodaj zdjęcie przed publikacją"],
  ["Confirm GPS", "Potwierdź GPS"],
  ["Publish selected load", "Opublikuj wybrany ładunek"],
  ["Przed publikacja musi istniec zdjecie ladunku. Zdjecia trafiaja do dokumentacji i audytu.", "Przed publikacją musi istnieć zdjęcie ładunku. Zdjęcia trafiają do dokumentacji i audytu."],
  ["Photo before publication", "Zdjęcie przed publikacją"],
  ["Photo at loading", "Zdjęcie przy załadunku"],
  ["Confirm loading", "Potwierdź załadunek"],
  ["Trust score blokuje ryzykownych przewoznikow", "Reputacja blokuje ryzykownych przewoźników"],
  ["Trust ", "Reputacja "],
  ["Accept carrier", "Akceptuj przewoźnika"],
  ["Assign", "Przypisz"],
  ["Start GPS", "Start GPS"],
  ["Arrive pickup", "Przyjazd na załadunek"],
  ["Start loading", "Rozpocznij załadunek"],
  ["Pickup doc", "Dokument załadunku"],
  ["In transit", "W trasie"],
  ["Select parking", "Wybierz parking"],
  ["Start break", "Rozpocznij pauzę"],
  ["Finish break", "Zakończ pauzę"],
  ["Arrive delivery", "Przyjazd na dostawę"],
  ["Start unloading", "Rozpocznij rozładunek"],
  ["Confirm delivery", "Potwierdź dostawę"],
  ["Delivery doc", "Dokument dostawy"],
  ["Koordynaty sa wymagane", "Koordynaty są wymagane"],
  ["Confirm selected GPS", "Potwierdź wybrany GPS"],
  ["Reports affect trust score", "Zgłoszenia wpływają na reputację"],
  [" free / trust ", " wolnych / reputacja "],
  ["Select", "Wybierz"],
  ["Report free places", "Zgłoś wolne miejsca"],
  ["False report demo", "Fałszywe zgłoszenie demo"],
  ["Encrypted docs and integrity hashes", "Szyfrowane dokumenty i hashe integralności"],
  ["Upload CMR", "Dodaj CMR"],
  ["Upload pickup confirmation", "Dodaj potwierdzenie załadunku"],
  ["Upload delivery confirmation", "Dodaj potwierdzenie dostawy"],
  ["Upload damage photo doc", "Dodaj dokument szkody"],
  ["Payment follows transport proof", "Płatność podąża za dowodami transportu"],
  ["Company wallets and held balance", "Portfele firm i środki zablokowane"],
  ["Immutable demo movements", "Niezmienialne ruchy demo"],
  ["Funds are reserved, blocked or released by events", "Środki są rezerwowane, blokowane albo zwalniane przez zdarzenia"],
  ["Platform fees recorded by events", "Opłaty platformy zapisywane przez zdarzenia"],
  ["Claim binds photos, GPS, docs and liability", "Roszczenie łączy zdjęcia, GPS, dokumenty i odpowiedzialność"],
  ["Open insurance claim", "Otwórz roszczenie ubezpieczeniowe"],
  ["Evidence packs", "Paczki dowodowe"],
  ["Driver work created from transport events", "Praca kierowcy tworzona ze zdarzeń transportu"],
  ["Transport thread creates message_id and audit", "Wątek transportu tworzy message_id i audyt"],
  ["Send PL update", "Wyślij aktualizację PL"],
  ["Send EN update", "Wyślij aktualizację EN"],
  ["Thread messages", "Wiadomości wątku"],
  ["Message translations are separate records", "Tłumaczenia wiadomości są osobnymi rekordami"],
  ["Translate to PL", "Przetłumacz na PL"],
  ["Gate clearance controls loading and unloading", "Odprawa na bramie kontroluje załadunek i rozładunek"],
  ["Scan selected plate", "Skanuj wybraną tablicę"],
  ["Clear pickup gate", "Zatwierdź bramę załadunku"],
  ["Block pickup gate", "Zablokuj bramę załadunku"],
  ["Clear delivery gate", "Zatwierdź bramę dostawy"],
  ["Notify thread", "Powiadom wątek"],
  ["Security checks", "Kontrole ochrony"],
  ["Recent plate lookups", "Ostatnie skany tablic"],
  ["External systems need api_client_id and scopes", "Systemy zewnętrzne potrzebują api_client_id i zakresów dostępu"],
  ["ERP create load", "ERP tworzy ładunek"],
  ["ERP forbidden finance", "ERP: zabroniona akcja finansowa"],
  ["GPS update", "Aktualizacja GPS"],
  ["Every integration call leaves a row", "Każde wywołanie integracji zostawia wpis"],
  ["ERP, GPS, insurance and payment bridges", "Mosty ERP, GPS, ubezpieczeń i płatności"],
  ["Sync ERP", "Synchronizuj ERP"],
  ["Sync GPS", "Synchronizuj GPS"],
  ["Sync insurance", "Synchronizuj ubezpieczenia"],
  ["Driver time is checked before risky steps", "Czas pracy kierowcy jest sprawdzany przed ryzykownymi krokami"],
  ["Run compliance check", "Uruchom kontrolę zgodności"],
  ["h drive / ", "h jazdy / "],
  ["h break", "h pauzy"],
  ["Service health, backups and emergency mode", "Stan usług, kopie zapasowe i tryb awaryjny"],
  ["Run resilience check", "Uruchom kontrolę odporności"],
  ["Reputation for companies, drivers, warehouses and parking", "Reputacja firm, kierowców, magazynów i parkingów"],
  ["Agent kontrolny, nie cichy decydent", "Agent kontrolny, nie cichy decydent"],
  ["AI moze tworzyc alerty, blokowac kolejny krok i przekazac sprawe adminowi. Nie usuwa danych i nie wyplaca pieniedzy.", "AI może tworzyć alerty, blokować kolejny krok i przekazać sprawę adminowi. Nie usuwa danych i nie wypłaca pieniędzy."],
  ["Run AI inspection", "Uruchom inspekcję AI"],
  ["Read only, event sourced", "Tylko do odczytu, oparte o zdarzenia"],
  ["Manual controls still go through Core Engine", "Kontrole ręczne nadal przechodzą przez rdzeń GL"],
  ["Block transport", "Zablokuj transport"],
  ["Resolve dispute", "Rozwiąż spór"],
  ["Block account", "Zablokuj konto"],
  ["Reset demo", "Reset demo"],
  ["Publish load", "Opublikuj ładunek"],
  ["Start transit", "Rozpocznij trasę"],
  ["driver time missing", "brak profilu czasu pracy kierowcy"],
  ["legal left", "h legalnej jazdy"],
  ["Financial ledger hidden for this role.", "Księga finansowa jest ukryta dla tej roli."],
  ["Wallet balances are not exposed to this role.", "Salda portfeli nie są udostępniane tej roli."],
  ["Escrow details are restricted for this role.", "Szczegóły escrow są ograniczone dla tej roli."],
  ["Platform revenue is restricted for this role.", "Przychody platformy są ograniczone dla tej roli."],
  ["API clients and audit are restricted to platform control roles.", "Klienci API i audyt API są dostępni tylko dla ról kontrolnych platformy."],
  ["Integration controls are hidden for this role.", "Kontrola integracji jest ukryta dla tej roli."],
  ["Resilience controls are restricted to platform control roles.", "Kontrole odporności są ograniczone do ról kontrolnych platformy."]
];

const CodeLabels = Object.freeze({
  pending_warehouse_photo: "oczekuje na zdjęcie magazynu",
  ready_to_publish: "gotowe do publikacji",
  published: "opublikowane",
  carrier_offer_received: "otrzymano ofertę przewoźnika",
  carrier_accepted: "przewoźnik zaakceptowany",
  driver_assigned: "kierowca przypisany",
  pickup_navigation_started: "nawigacja do odbioru rozpoczęta",
  arrived_at_pickup: "przyjazd na załadunek",
  loading_started: "załadunek rozpoczęty",
  loading_confirmed: "załadunek potwierdzony",
  pickup_documents_uploaded: "dokumenty załadunku dodane",
  in_transit: "w trasie",
  parking_break: "pauza parkingowa",
  customs_required: "wymagane cło",
  waiting_for_customs: "oczekuje na cło",
  customs_in_progress: "odprawa celna w toku",
  customs_cleared: "odprawa celna zakończona",
  customs_hold: "zatrzymanie celne",
  control_started: "kontrola rozpoczęta",
  document_check: "sprawdzenie dokumentów",
  road_inspection: "kontrola drogowa",
  control_passed: "kontrola pozytywna",
  control_issue_found: "problem w kontroli",
  ferry_required: "wymagany prom",
  ferry_booked: "prom zarezerwowany",
  going_to_port: "jedzie do portu",
  waiting_for_ferry: "oczekuje na prom",
  checked_in_ferry: "odprawa promowa potwierdzona",
  boarding: "wjazd na prom",
  on_ferry: "na promie",
  leaving_ferry: "zjazd z promu",
  ferry_completed: "prom zakończony",
  continue_road_transport: "kontynuacja drogowa",
  arrived_at_delivery: "przyjazd na dostawę",
  unloading_started: "rozładunek rozpoczęty",
  delivery_confirmed: "dostawa potwierdzona",
  delivery_documents_uploaded: "dokumenty dostawy dodane",
  invoice_pending: "oczekuje na fakturę",
  payment_pending: "oczekuje na płatność",
  payment_not_required: "płatność niewymagana",
  payment_reserved: "płatność zarezerwowana",
  payment_blocked: "płatność zablokowana",
  payment_released: "płatność zwolniona",
  payment_failed: "płatność nieudana",
  payment_refunded: "płatność zwrócona",
  dispute_opened: "spór otwarty",
  claim_opened: "roszczenie otwarte",
  awaiting_photo: "oczekuje na zdjęcie",
  disputed: "sporne",
  locked: "zablokowane",
  cleared: "zatwierdzone",
  availability_confirmed: "dostępność potwierdzona",
  transport_fee: "opłata za transport",
  insurance_commission: "prowizja ubezpieczeniowa",
  ferry_service_fee: "opłata za usługę promową",
  ferry_ticket: "bilet promowy",
  booking_confirmation: "potwierdzenie rezerwacji",
  boarding_confirmation: "potwierdzenie wejścia na prom",
  sad: "SAD",
  t1: "T1",
  ex: "EX",
  mrn: "MRN",
  commercial_invoice: "faktura handlowa",
  packing_list: "lista pakowa",
  certificate_of_origin: "certyfikat pochodzenia",
  transport_license: "licencja przewozowa",
  road_permit: "pozwolenie drogowe",
  certificate: "certyfikat",
  legal_required_document: "dokument prawnie wymagany",
  insurance_policy: "polisa ubezpieczeniowa",
  service_report: "raport serwisowy",
  simulated_paid: "płatność demo zapisana",
  breakdown_reported: "awaria zgłoszona",
  provider_selected: "serwis wybrany",
  accepted: "przyjęte",
  service: "serwis",
  customs: "cło",
  control: "kontrola",
  workshop: "warsztat",
  mobile_service: "serwis mobilny",
  roadside_assistance: "pomoc drogowa",
  police: "policja",
  transport_inspection: "inspekcja transportu",
  customs_authority: "organ celny",
  road_authority: "zarządca drogi",
  ROAD: "DROGA",
  FERRY: "PROM",
  TRAIN: "KOLEJ",
  INTERMODAL: "INTERMODAL",
  FERRY_REQUIRED: "WYMAGANY_PROM",
  FERRY_BOOKED: "PROM_ZAREZERWOWANY",
  GOING_TO_PORT: "JEDZIE_DO_PORTU",
  WAITING_FOR_FERRY: "OCZEKUJE_NA_PROM",
  CHECKED_IN_FERRY: "ODPRAWA_PROMOWA",
  BOARDING: "WJAZD_NA_PROM",
  ON_FERRY: "NA_PROMIE",
  LEAVING_FERRY: "ZJAZD_Z_PROMU",
  CONTINUE_ROAD_TRANSPORT: "KONTYNUACJA_DROGOWA",
  MARK_FERRY_REQUIRED: "OZNACZ_WYMOG_PROMU",
  BOOK_FERRY: "ZAREZERWUJ_PROM",
  START_PORT_NAVIGATION: "NAWIGUJ_DO_PORTU",
  CHECK_IN_FERRY: "ODPRAWA_PROMOWA",
  BOARD_FERRY: "WEJSCIE_NA_PROM",
  COMPLETE_FERRY: "ZAKONCZ_PROM",
  MARK_CUSTOMS_REQUIRED: "OZNACZ_WYMOG_CŁA",
  SEND_TO_CUSTOMS: "PRZEKAZ_DO_CŁA",
  START_CUSTOMS: "ROZPOCZNIJ_ODPRAWE",
  CLEAR_CUSTOMS: "ZWOLNIJ_CELNIE",
  HOLD_CUSTOMS: "ZATRZYMAJ_CELNIE",
  START_AUTHORITY_CONTROL: "ROZPOCZNIJ_KONTROLE",
  RECORD_DOCUMENT_CHECK: "SPRAWDZ_DOKUMENTY",
  RECORD_ROAD_INSPECTION: "KONTROLA_DROGOWA",
  PASS_AUTHORITY_CONTROL: "KONTROLA_POZYTYWNA",
  REPORT_AUTHORITY_ISSUE: "PROBLEM_KONTROLI",
  REPORT_BREAKDOWN: "ZGLOS_AWARIE",
  REQUEST_TECHNICAL_SERVICE: "WYBIERZ_SERWIS",
  ACCEPT_SERVICE_JOB: "SERWIS_PRZYJMUJE",
  COMPLETE_SERVICE_JOB: "ZAKONCZ_SERWIS",
  hold: "blokada",
  hold_release: "zwolnienie blokady",
  credit: "uznanie",
  completed: "zakończone",
  created: "utworzone",
  assigned: "przypisane",
  open: "otwarte",
  resolved: "rozwiązane",
  blocked: "zablokowane",
  active: "aktywne",
  completed: "zakończone",
  ACTION_BLOCKED: "AKCJA_ZABLOKOWANA",
  SESSION_ROLE_CHANGED: "ZMIANA_ROLI_SESJI",
  UI_VIEW_CHANGED: "ZMIANA_WIDOKU",
  USER_REGISTERED: "UŻYTKOWNIK_ZAREJESTROWANY",
  ACCOUNT_VERIFIED: "KONTO_ZWERYFIKOWANE",
  PHONE_CHANGED: "TELEFON_ZMIENIONY",
  ACCOUNT_BLOCKED: "KONTO_ZABLOKOWANE",
  LOAD_CREATED: "ŁADUNEK_UTWORZONY",
  LOAD_PHOTO_ADDED: "ZDJĘCIE_ŁADUNKU_DODANE",
  LOAD_PUBLISHED: "ŁADUNEK_OPUBLIKOWANY",
  CARRIER_ACCEPTED: "PRZEWOŹNIK_ZAAKCEPTOWANY",
  DRIVER_ASSIGNED: "KIEROWCA_PRZYPISANY",
  GPS_COORDINATES_CONFIRMED: "GPS_POTWIERDZONY",
  DRIVER_ARRIVED_PICKUP: "KIEROWCA_NA_ZAŁADUNKU",
  LOADING_STARTED: "ZAŁADUNEK_ROZPOCZĘTY",
  LOADING_CONFIRMED: "ZAŁADUNEK_POTWIERDZONY",
  DOCUMENT_UPLOADED: "DOKUMENT_DODANY",
  TRANSPORT_IN_TRANSIT: "TRANSPORT_W_TRASIE",
  PARKING_SELECTED: "PARKING_WYBRANY",
  BREAK_STARTED: "PAUZA_ROZPOCZĘTA",
  BREAK_FINISHED: "PAUZA_ZAKOŃCZONA",
  DELIVERY_CONFIRMED: "DOSTAWA_POTWIERDZONA",
  PAYMENT_RELEASED: "PŁATNOŚĆ_ZWOLNIONA",
  TRANSPORT_COMPLETED: "TRANSPORT_ZAKOŃCZONY",
  DISPUTE_OPENED: "SPÓR_OTWARTY",
  DISPUTE_RESOLVED: "SPÓR_ROZWIĄZANY",
  CLAIM_OPENED: "ROSZCZENIE_OTWARTE",
  TRUST_SCORE_CHANGED: "REPUTACJA_ZMIENIONA",
  AI_ALERT_CREATED: "ALERT_AI_UTWORZONY",
  TRANSPORT_BLOCKED: "TRANSPORT_ZABLOKOWANY",
  SHIPMENT_CREATED: "ŁADUNEK_SHIPMENT_UTWORZONY",
  SHIPMENT_UPDATED: "ŁADUNEK_SHIPMENT_ZAKTUALIZOWANY",
  WALLET_HOLD_CREATED: "BLOKADA_PORTFELA_UTWORZONA",
  WALLET_HOLD_RELEASED: "BLOKADA_PORTFELA_ZWOLNIONA",
  WALLET_CREDITED: "PORTFEL_UZNANY",
  ESCROW_RESERVED: "ESCROW_ZAREZERWOWANE",
  ESCROW_BLOCKED: "ESCROW_ZABLOKOWANE",
  ESCROW_RELEASED: "ESCROW_ZWOLNIONE",
  PLATFORM_FEE_RECORDED: "OPŁATA_PLATFORMY_ZAPISANA",
  JOB_CREATED: "ZLECENIE_PRACY_UTWORZONE",
  JOB_COMPLETED: "ZLECENIE_PRACY_ZAKOŃCZONE",
  MESSAGE_SENT: "WIADOMOŚĆ_WYSŁANA",
  MESSAGE_TRANSLATED: "WIADOMOŚĆ_PRZETŁUMACZONA",
  LICENSE_PLATE_IDENTIFIED: "TABLICA_ZIDENTYFIKOWANA",
  PLATE_CHAT_CREATED: "CZAT_TABLICA_KIEROWCA_UTWORZONY",
  SECURITY_CHECK_RECORDED: "KONTROLA_OCHRONY_ZAPISANA",
  SECURITY_GATE_DENIED: "BRAMA_ZABLOKOWANA",
  CUSTOMS_REQUIRED_RECORDED: "WYMOG_CŁA_ZAPISANY",
  CUSTOMS_WAITING: "OCZEKIWANIE_NA_CŁO",
  CUSTOMS_STARTED: "ODPRAWA_CELNA_ROZPOCZĘTA",
  CUSTOMS_CLEARED: "ODPRAWA_CELNA_ZAKOŃCZONA",
  CUSTOMS_HOLD_PLACED: "ZATRZYMANIE_CELNE",
  CUSTOMS_PAYMENT_SIMULATED: "PŁATNOŚĆ_CELNA_DEMO",
  CUSTOMS_DOCUMENT_RECEIVED: "DOKUMENT_CELNY_PRZYJĘTY",
  AUTHORITY_CONTROL_STARTED: "KONTROLA_ORGANU_ROZPOCZĘTA",
  AUTHORITY_DOCUMENT_CHECKED: "DOKUMENTY_SPRAWDZONE",
  AUTHORITY_ROAD_INSPECTION_DONE: "KONTROLA_DROGOWA_WYKONANA",
  AUTHORITY_CONTROL_PASSED: "KONTROLA_POZYTYWNA",
  AUTHORITY_ISSUE_FOUND: "PROBLEM_KONTROLI",
  AUTHORITY_ACCESS_RECORDED: "DOSTĘP_ORGANU_ZAPISANY",
  FERRY_REQUIRED_RECORDED: "WYMOG_PROMU_ZAPISANY",
  FERRY_BOOKED: "PROM_ZAREZERWOWANY",
  FERRY_GOING_TO_PORT: "JAZDA_DO_PORTU",
  FERRY_CHECKED_IN: "ODPRAWA_PROMOWA_ZAPISANA",
  FERRY_BOARDING: "WJAZD_NA_PROM",
  FERRY_ONBOARD: "POJAZD_NA_PROMIE",
  FERRY_COMPLETED: "PROM_ZAKONCZONY",
  FERRY_ETA_UPDATED: "ETA_PROMU_ZAKTUALIZOWANA",
  FERRY_PAYMENT_SIMULATED: "PLATNOSC_PROMOWA_DEMO",
  SERVICE_BREAKDOWN_REPORTED: "AWARIA_ZGŁOSZONA",
  SERVICE_PROVIDER_SELECTED: "SERWIS_WYBRANY",
  SERVICE_ACCEPTED: "SERWIS_PRZYJĘTY",
  SERVICE_COMPLETED: "SERWIS_ZAKOŃCZONY",
  SERVICE_ETA_UPDATED: "ETA_SERWISU_ZAKTUALIZOWANA",
  SERVICE_PAYMENT_SIMULATED: "PŁATNOŚĆ_SERWISOWA_DEMO",
  API_CALL_RECORDED: "WYWOŁANIE_API_ZAPISANE",
  API_RATE_LIMIT_FLAGGED: "LIMIT_API_OZNACZONY",
  INTEGRATION_SYNC_COMPLETED: "SYNCHRONIZACJA_INTEGRACJI_ZAKOŃCZONA",
  INTEGRATION_SYNC_BLOCKED: "SYNCHRONIZACJA_INTEGRACJI_ZABLOKOWANA",
  RESILIENCE_CHECK_COMPLETED: "KONTROLA_ODPORNOŚCI_ZAKOŃCZONA",
  EMERGENCY_MODE_READY: "TRYB_AWARYJNY_GOTOWY",
  COMPLIANCE_CHECK_COMPLETED: "KONTROLA_ZGODNOŚCI_ZAKOŃCZONA",
  COMPLIANCE_CHECK_BLOCKED: "KONTROLA_ZGODNOŚCI_ZABLOKOWANA",
  DOCUMENT_CONFIRMED: "DOKUMENTY_POTWIERDZONE",
  DIGITAL_CMR_CREATED: "CYFROWY_CMR_UTWORZONY",
  DIGITAL_CMR_LOCKED: "CYFROWY_CMR_ZABLOKOWANY",
  DISPUTE_EVIDENCE_PACK_CREATED: "PACZKA_DOWODOWA_SPORU_UTWORZONA",
  INSURANCE_RISK_CLOSED: "RYZYKO_UBEZPIECZENIOWE_ZAMKNIĘTE"
});

function localizeText(input) {
  let output = input;
  PhraseTranslations
    .slice()
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([from, to]) => {
      output = output.replaceAll(from, to);
    });
  Object.entries(ExactText)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([from, to]) => {
      output = replaceWholeToken(output, from, to);
    });
  Object.entries(CodeLabels)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([from, to]) => {
      output = replaceWholeToken(output, from, to);
    });
  output = output
    .replaceAll("has no permission for", "nie ma uprawnienia do")
    .replaceAll("transport status must be", "status transportu musi być")
    .replaceAll("transport must be", "transport musi mieć status")
    .replaceAll("before carrier acceptance", "przed akceptacją przewoźnika")
    .replaceAll("before driver assignment", "przed przypisaniem kierowcy")
    .replaceAll("delivery documents and", "dokumenty dostawy oraz")
    .replaceAll("status are required", "są wymagane")
    .replaceAll("pickup confirmation document is required before transit", "potwierdzenie załadunku jest wymagane przed trasą")
    .replaceAll("carrier company is required", "firma przewoźnika jest wymagana")
    .replaceAll("driver is required", "kierowca jest wymagany")
    .replaceAll("vehicle is required", "pojazd jest wymagany")
    .replaceAll("customs can start only in active transport", "odprawa celna może zacząć się tylko w aktywnym transporcie")
    .replaceAll("MRN document is required before customs clearance", "dokument MRN jest wymagany przed zwolnieniem celnym")
    .replaceAll("authority control cannot start from", "kontrola organu nie może zacząć się ze statusu")
    .replaceAll("vehicle is required before service request", "pojazd jest wymagany przed zgłoszeniem serwisu")
    .replaceAll("driver is required before service request", "kierowca jest wymagany przed zgłoszeniem serwisu")
    .replaceAll("breakdown report is required before service selection", "zgłoszenie awarii jest wymagane przed wyborem serwisu")
    .replaceAll("service request not found", "nie znaleziono zgłoszenia serwisowego")
    .replaceAll("expected service status", "oczekiwany status serwisu")
    .replaceAll("has no access to transport", "nie ma dostępu do transportu")
    .replaceAll("expected status", "oczekiwany status")
    .replaceAll("current:", "obecny:")
    .replaceAll("driver and vehicle are required before ferry step", "przed etapem promowym wymagany jest kierowca i pojazd")
    .replaceAll("ferry cannot be required from", "nie można wymagać promu ze statusu")
    .replaceAll("transport wymaga przeprawy promowej", "transport wymaga przeprawy promowej")
    .replaceAll("shipment connected to ferry booking", "ładunek powiązany z rezerwacją promową")
    .replaceAll("shipment is on ferry leg", "ładunek jest na odcinku promowym")
    .replaceAll("shipment continues after ferry", "ładunek kontynuuje trasę po promie")
    .replaceAll("ferry leg completed", "odcinek promowy zakończony")
    .replaceAll("ferry rest completed", "odpoczynek promowy zakończony")
    .replaceAll("transport not found", "nie znaleziono transportu")
    .replaceAll("missing target role", "brak wybranej roli")
    .replaceAll("missing target view", "brak wybranego widoku")
    .replaceAll("message body is required", "treść wiadomości jest wymagana")
    .replaceAll("license plate is required", "tablica rejestracyjna jest wymagana")
    .replaceAll("document and face verification completed", "weryfikacja dokumentu i twarzy zakończona")
    .replaceAll("phone registration created", "rejestracja przez telefon utworzona")
    .replaceAll("permission:", "uprawnienia:")
    .replaceAll("validation:", "walidacja:")
    .replaceAll("not provided", "nie podano")
    .replaceAll("demo", "demo");
  return output;
}

function replaceWholeToken(input, from, to) {
  const escaped = escapeRegExp(from);
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`, "gu");
  return input.replace(pattern, `$1${to}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function viewTitle(role, view) {
  return menuForRole(role).find((item) => item.id === view)?.label || "Panel";
}
