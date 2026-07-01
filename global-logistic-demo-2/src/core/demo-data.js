import {
  AccountStatuses,
  AuthoritySubtypes,
  CompanyRoleNames,
  DEMO_DATA_VERSION,
  KnowledgeSourceTypes,
  PaymentStatuses,
  Roles,
  SourceTypes,
  TransportStatuses
} from "./constants.js";
import { buildCompanyAccessSeed } from "../companies/company-engine.js";

const baseTime = "2026-05-27T07:00:00.000Z";

export function createDemoState(options = {}) {
  const state = {
    schemaVersion: DEMO_DATA_VERSION,
    demoDataVersion: DEMO_DATA_VERSION,
    revision: 1,
    session: {
      userId: "u-platform",
      role: Roles.PLATFORM_OWNER,
      language: "pl",
      languageSelected: false,
      detectedLanguage: null,
      country: "PL",
      view: "onboarding",
      selectedTransportId: "tr-1001",
      contextType: "platform",
      companyId: null,
      companyRoleId: null,
      authSessionId: null,
      onboardingRequired: true,
      onboardingUserId: null,
      lastResult: null
    },
    authSessions: [],
    otpChallenges: [],
    users: [
      user("u-platform", "Ewa Core", "+48500100100", Roles.PLATFORM_OWNER, null, AccountStatuses.VERIFIED),
      user("u-gl-operator", "Grzegorz Operator GL", "+48500100130", Roles.GL_OPERATOR, null, AccountStatuses.VERIFIED),
      user("u-admin-finance", "Fin Marta", "+48500100131", Roles.ADMIN_FINANCE, null, AccountStatuses.VERIFIED),
      user("u-super", "Adam Super", "+48500100101", Roles.SUPER_ADMIN, null, AccountStatuses.VERIFIED),
      user("u-admin", "Marta Admin", "+48500100102", Roles.ADMIN, null, AccountStatuses.VERIFIED),
      user("u-client-owner", "Jan Client", "+48500100103", Roles.CLIENT_OWNER, "co-client-a", AccountStatuses.VERIFIED),
      user("u-client-dispatcher", "Olga Dispatcher", "+48500100104", Roles.CLIENT_DISPATCHER, "co-client-a", AccountStatuses.VERIFIED),
      user("u-warehouse", "Pawel Warehouse", "+48500100105", Roles.WAREHOUSE_WORKER, "co-client-b", AccountStatuses.VERIFIED),
      user("u-carrier-owner", "Kamil Carrier", "+48500100106", Roles.CARRIER_OWNER, "co-carrier-a", AccountStatuses.VERIFIED),
      user("u-carrier-dispatcher", "Nina CarrierOps", "+48500100107", Roles.CARRIER_DISPATCHER, "co-carrier-a", AccountStatuses.VERIFIED),
      user("u-carrier-finance", "Filip Finance", "+48500100132", Roles.CARRIER_OWNER, "co-carrier-a", AccountStatuses.VERIFIED),
      user("u-multi-company", "Maja Multi", "+48500100133", Roles.CARRIER_DISPATCHER, "co-carrier-a", AccountStatuses.VERIFIED),
      user("u-driver-1", "Marek Driver", "+48500100108", Roles.DRIVER, "co-carrier-a", AccountStatuses.VERIFIED, { documentsValid: true, faceVerified: true }),
      user("u-driver-2", "Piotr Cold", "+48500100109", Roles.DRIVER, "co-carrier-b", AccountStatuses.VERIFIED, { documentsValid: true, faceVerified: true }),
      user("u-driver-3", "Tomasz Late", "+48500100110", Roles.DRIVER, "co-carrier-c", AccountStatuses.VERIFIED, { documentsValid: true, faceVerified: true, driverTimeLegal: false }),
      user("u-driver-4", "Luca Alps", "+48500100111", Roles.DRIVER, "co-carrier-a", AccountStatuses.VERIFIED, { documentsValid: false, faceVerified: true }),
      user("u-driver-5", "Anna Express", "+48500100112", Roles.DRIVER, "co-carrier-b", AccountStatuses.VERIFIED, { documentsValid: true, faceVerified: true }),
      user("u-driver-6", "Jan Night", "+48500100113", Roles.DRIVER, "co-carrier-c", AccountStatuses.SUSPENDED, { documentsValid: true, faceVerified: true }),
      user("u-insurance", "Helena Insure", "+48500100114", Roles.INSURANCE_PARTNER, "co-insurance-a", AccountStatuses.VERIFIED),
      user("u-payment", "Rafal PayOps", "+48500100115", Roles.PAYMENT_OPERATOR, "co-payment-a", AccountStatuses.VERIFIED),
      user("u-security", "Oskar Gate", "+48500100118", Roles.SECURITY_GUARD, "co-security-a", AccountStatuses.VERIFIED),
      user("u-customs", "Celina Customs", "+48500100121", Roles.CUSTOMS_AGENT, "co-customs-a", AccountStatuses.VERIFIED),
      user("u-authority-police", "Anna Police", "+48500100122", Roles.AUTHORITY_USER, "co-authority-police", AccountStatuses.VERIFIED, { authoritySubtype: AuthoritySubtypes.POLICE }),
      user("u-authority-itd", "Tomasz ITD", "+48500100123", Roles.AUTHORITY_USER, "co-authority-itd", AccountStatuses.VERIFIED, { authoritySubtype: AuthoritySubtypes.TRANSPORT_INSPECTION }),
      user("u-ferry", "Maja DFDS", "+48500100119", Roles.FERRY_OPERATOR, "co-ferry-dfds", AccountStatuses.VERIFIED),
      user("u-rail", "Robert Rail", "+48500100120", Roles.RAIL_OPERATOR, "co-rail-terminal", AccountStatuses.VERIFIED),
      user("u-workshop", "Wiktor Warsztat", "+48500100124", Roles.WORKSHOP, "co-workshop-a", AccountStatuses.VERIFIED),
      user("u-mobile-service", "Mila Mobile", "+48500100125", Roles.MOBILE_SERVICE, "co-mobile-service-a", AccountStatuses.VERIFIED),
      user("u-roadside", "Roman Holownik", "+48500100126", Roles.ROADSIDE_ASSISTANCE, "co-roadside-a", AccountStatuses.VERIFIED),
      user("u-academy-teacher", "Tomasz Academy", "+48500100127", Roles.ACADEMY_TEACHER, null, AccountStatuses.VERIFIED),
      user("u-academy-student", "Kasia Student", "+48500100128", Roles.ACADEMY_STUDENT, null, AccountStatuses.VERIFIED),
      user("u-compliance", "Monika Compliance", "+48500100129", Roles.COMPLIANCE, null, AccountStatuses.VERIFIED),
      user("u-support", "Sara Support", "+48500100116", Roles.SUPPORT_AGENT, null, AccountStatuses.VERIFIED),
      user("u-auditor", "Igor Auditor", "+48500100117", Roles.READONLY_AUDITOR, null, AccountStatuses.VERIFIED),
      user("u-role-switch", "Laura Multirola", "+48500100134", Roles.DRIVER, "co-carrier-a", AccountStatuses.VERIFIED, {
        roles: [
          Roles.DRIVER,
          Roles.CARRIER_OWNER,
          Roles.CLIENT_OWNER,
          Roles.WAREHOUSE_WORKER,
          Roles.WORKSHOP,
          Roles.INSURANCE_PARTNER,
          Roles.PLATFORM_OWNER
        ],
        selectedRole: Roles.DRIVER,
        documentsValid: true,
        faceVerified: true
      }),
      user("u-demo-pending", "New Pending", "+48500100999", Roles.CLIENT_DISPATCHER, "co-client-c", AccountStatuses.PENDING, { documentVerified: false, faceVerified: false })
    ],
    companies: [
      company("co-client-a", "Nord Market BV", "client", 93, ["u-client-owner", "u-client-dispatcher", "u-multi-company", "u-role-switch"], AccountStatuses.VERIFIED),
      company("co-client-b", "Mazovia Med", "client", 88, ["u-warehouse", "u-role-switch"], AccountStatuses.VERIFIED),
      company("co-client-c", "Casa Verde", "client", 79, ["u-demo-pending"], AccountStatuses.PENDING),
      company("co-carrier-a", "Baltic Line", "carrier", 96, ["u-carrier-owner", "u-carrier-dispatcher", "u-carrier-finance", "u-multi-company", "u-driver-1", "u-driver-4", "u-role-switch"], AccountStatuses.VERIFIED),
      company("co-carrier-b", "Cold Link", "carrier", 91, ["u-driver-2", "u-driver-5"], AccountStatuses.VERIFIED),
      company("co-carrier-c", "Oder Freight", "carrier", 61, ["u-driver-3", "u-driver-6"], AccountStatuses.VERIFIED),
      company("co-insurance-a", "ShieldCargo Insurance", "insurance", 94, ["u-insurance", "u-role-switch"], AccountStatuses.VERIFIED),
      company("co-payment-a", "DemoPay Operator", "payment", 99, ["u-payment"], AccountStatuses.VERIFIED),
      company("co-security-a", "GatePoint Security", "security", 89, ["u-security"], AccountStatuses.VERIFIED),
      company("co-customs-a", "Baltic Customs Agency", "customs_agent", 90, ["u-customs"], AccountStatuses.VERIFIED),
      company("co-authority-police", "Policja Drogowa", "authority", 100, ["u-authority-police"], AccountStatuses.VERIFIED),
      company("co-authority-itd", "Inspekcja Transportu Drogowego", "authority", 100, ["u-authority-itd"], AccountStatuses.VERIFIED),
      company("co-ferry-dfds", "DFDS Ferry", "ferry_operator", 92, ["u-ferry"], AccountStatuses.VERIFIED),
      company("co-rail-terminal", "EuroRail Terminal", "rail_operator", 86, ["u-rail"], AccountStatuses.VERIFIED),
      company("co-workshop-a", "TruckFix Warsztat", "workshop", 88, ["u-workshop", "u-role-switch"], AccountStatuses.VERIFIED),
      company("co-mobile-service-a", "MobileTruck Serwis", "mobile_service", 91, ["u-mobile-service"], AccountStatuses.VERIFIED),
      company("co-roadside-a", "RoadHelp 24", "roadside_assistance", 85, ["u-roadside"], AccountStatuses.VERIFIED)
    ],
    vehicles: [
      vehicle("vh-1", "GDA 5K92", "co-carrier-a", "mega 13.6", true, true),
      vehicle("vh-2", "WX 9C20", "co-carrier-b", "duza chlodnia", true, true),
      vehicle("vh-3", "DW 41FR", "co-carrier-c", "zestaw 13.6", true, true),
      vehicle("vh-4", "KR 7ALP", "co-carrier-a", "solowka", false, true),
      vehicle("vh-5", "PO 4BUS", "co-carrier-b", "bus plandeka", true, true),
      vehicle("vh-6", "GD 2LOW", "co-carrier-c", "niskopodwoziowa", true, false),
      vehicle("vh-7", "BL 7DFD", "co-carrier-a", "mega 13.6 / prom", true, true)
    ],
    transports: [
      transport({
        id: "tr-1001",
        number: "GL2-1001",
        clientCompanyId: "co-client-a",
        carrierCompanyId: "co-carrier-a",
        driverId: "u-driver-1",
        warehouseWorkerId: "u-warehouse",
        vehicleId: "vh-1",
        pickup: point("Rotterdam warehouse", 51.9244, 4.4777),
        delivery: point("Lodz DC", 51.7592, 19.456),
        cargo: cargo("12 palet elektroniki", 8400, "13.6m x 2.45m x 2.7m", "ph-load-1"),
        price: 4280,
        status: TransportStatuses.IN_TRANSIT,
        paymentStatus: PaymentStatuses.RESERVED,
        insuranceId: "ins-1",
        documentIds: ["doc-1", "doc-2", "doc-7", "doc-8", "doc-9", "doc-10", "doc-11", "doc-12", "doc-15"],
        photoIds: ["ph-load-1", "ph-strap-1"],
        customsCaseId: "cust-1",
        activeServiceRequestId: "srv-1",
        insuranceLegallyRequired: true,
        eta: "2026-05-27T13:40:00.000Z",
        riskFlagged: false
      }),
      transport({
        id: "tr-1002",
        number: "GL2-1002",
        clientCompanyId: "co-client-b",
        carrierCompanyId: "co-carrier-b",
        driverId: "u-driver-2",
        warehouseWorkerId: "u-warehouse",
        vehicleId: "vh-2",
        pickup: point("Basel pharma hub", 47.5596, 7.5886),
        delivery: point("Warszawa med warehouse", 52.2297, 21.0122),
        cargo: cargo("farmacja 2-8 C", 4100, "7 palet / kontrola temperatury", "ph-load-2"),
        price: 11200,
        status: TransportStatuses.BLOCKED,
        paymentStatus: PaymentStatuses.BLOCKED,
        insuranceId: "ins-2",
        documentIds: ["doc-3"],
        photoIds: ["ph-load-2"],
        riskFlagged: true,
        activeAiAlertId: "ai-1"
      }),
      transport({
        id: "tr-1003",
        number: "GL2-1003",
        clientCompanyId: "co-client-a",
        carrierCompanyId: null,
        driverId: null,
        warehouseWorkerId: "u-warehouse",
        vehicleId: null,
        pickup: point("Poznan crossdock", 52.4064, 16.9252),
        delivery: point("Brno store", 49.1951, 16.6068),
        cargo: cargo("materialy POS", 1200, "8 palet", "ph-load-3"),
        price: 980,
        status: TransportStatuses.PUBLISHED,
        paymentStatus: PaymentStatuses.PENDING,
        insuranceId: null,
        documentIds: [],
        photoIds: ["ph-load-3"],
        riskFlagged: false
      }),
      transport({
        id: "tr-1004",
        number: "GL2-1004",
        clientCompanyId: "co-client-c",
        carrierCompanyId: "co-carrier-a",
        driverId: "u-driver-4",
        warehouseWorkerId: null,
        vehicleId: "vh-4",
        pickup: point("Milan furniture", 45.4642, 9.19),
        delivery: point("Krakow showroom", 50.0647, 19.945),
        cargo: cargo("meble premium", 3100, "18 m3", "ph-load-4"),
        price: 3650,
        status: TransportStatuses.DISPUTE_OPENED,
        paymentStatus: PaymentStatuses.BLOCKED,
        insuranceId: "ins-3",
        documentIds: ["doc-4"],
        photoIds: ["ph-load-4", "ph-damage-1"],
        activeDisputeId: "dis-1",
        riskFlagged: false
      }),
      transport({
        id: "tr-1005",
        number: "GL2-1005",
        clientCompanyId: "co-client-a",
        carrierCompanyId: null,
        driverId: null,
        warehouseWorkerId: "u-warehouse",
        vehicleId: null,
        pickup: point("Gdansk port", 54.352, 18.6466),
        delivery: point("Berlin DC", 52.52, 13.405),
        cargo: cargo("kontener tekstylia", 9400, "40 ft", null),
        price: 2400,
        status: TransportStatuses.PENDING_WAREHOUSE_PHOTO,
        paymentStatus: PaymentStatuses.PENDING,
        insuranceId: null,
        documentIds: [],
        photoIds: [],
        riskFlagged: false
      }),
      transport({
        id: "tr-1006",
        number: "GL2-1006",
        clientCompanyId: "co-client-a",
        carrierCompanyId: "co-carrier-a",
        driverId: "u-driver-1",
        warehouseWorkerId: "u-warehouse",
        vehicleId: "vh-7",
        pickup: point("Berlin supplier", 52.52, 13.405),
        delivery: point("London retail hub", 51.5072, -0.1276),
        cargo: cargo("towar intermodalny Berlin-London", 6200, "10 palet", "ph-load-6"),
        price: 5100,
        status: TransportStatuses.ON_FERRY,
        paymentStatus: PaymentStatuses.RESERVED,
        insuranceId: "ins-4",
        documentIds: ["doc-6", "doc-13", "doc-14"],
        photoIds: ["ph-load-6"],
        transportMode: "FERRY",
        vehicleStatus: "ON_FERRY",
        eta: "2026-05-28T14:30:00.000Z",
        riskFlagged: false
      })
    ],
    shipments: [
      shipment("sh-1001", "tr-1001", "co-client-a", "12 palet elektroniki", 8400, "in_transit", ["ph-load-1", "ph-strap-1"], ["doc-1", "doc-2", "doc-7", "doc-8", "doc-9", "doc-10", "doc-11", "doc-12", "doc-15"]),
      shipment("sh-1002", "tr-1002", "co-client-b", "farmacja 2-8 C", 4100, "blocked", ["ph-load-2"], ["doc-3"]),
      shipment("sh-1003", "tr-1003", "co-client-a", "materialy POS", 1200, "published", ["ph-load-3"], []),
      shipment("sh-1004", "tr-1004", "co-client-c", "meble premium", 3100, "disputed", ["ph-load-4", "ph-damage-1"], ["doc-4"]),
      shipment("sh-1005", "tr-1005", "co-client-a", "kontener tekstylia", 9400, "awaiting_photo", [], []),
      shipment("sh-1006", "tr-1006", "co-client-a", "towar intermodalny Berlin-London", 6200, "on_ferry", ["ph-load-6"], ["doc-6", "doc-13", "doc-14"])
    ],
    documents: [
      document("doc-1", "tr-1001", "cmr", "CMR Rotterdam-Lodz", ["platform_owner", "admin", "client_owner", "carrier_owner", "driver", "authority_user"], true),
      document("doc-2", "tr-1001", "pickup_confirmation", "Potwierdzenie zaladunku", ["platform_owner", "admin", "client_owner", "carrier_owner"], true),
      document("doc-3", "tr-1002", "temperature_report", "Raport temperatury", ["platform_owner", "admin", "insurance_partner"], true),
      document("doc-4", "tr-1004", "damage_report", "Raport szkody", ["platform_owner", "admin", "insurance_partner", "support_agent"], true),
      document("doc-6", "tr-1006", "ferry_ticket", "Bilet promowy Calais-Dover", ["platform_owner", "admin", "client_owner", "carrier_owner", "driver", "ferry_operator"], true),
      document("doc-7", "tr-1001", "mrn", "MRN Rotterdam-Lodz", ["platform_owner", "admin", "client_owner", "carrier_owner", "customs_agent"], true),
      document("doc-8", "tr-1001", "commercial_invoice", "Faktura handlowa Rotterdam-Lodz", ["platform_owner", "admin", "client_owner", "carrier_owner", "customs_agent"], true),
      document("doc-9", "tr-1001", "packing_list", "Packing list Rotterdam-Lodz", ["platform_owner", "admin", "client_owner", "carrier_owner", "customs_agent"], true),
      document("doc-10", "tr-1001", "certificate_of_origin", "Certyfikat pochodzenia", ["platform_owner", "admin", "client_owner", "carrier_owner", "customs_agent", "authority_user"], true),
      document("doc-11", "tr-1001", "transport_license", "Licencja przewozowa Baltic Line", ["platform_owner", "admin", "carrier_owner", "authority_user"], true),
      document("doc-12", "tr-1001", "road_permit", "Pozwolenie drogowe UE", ["platform_owner", "admin", "carrier_owner", "authority_user"], true),
      document("doc-13", "tr-1006", "booking_confirmation", "Potwierdzenie rezerwacji DFDS", ["platform_owner", "admin", "client_owner", "carrier_owner", "driver", "ferry_operator"], true),
      document("doc-14", "tr-1006", "boarding_confirmation", "Potwierdzenie wejścia na prom DFDS", ["platform_owner", "admin", "client_owner", "carrier_owner", "driver", "ferry_operator"], true),
      document("doc-15", "tr-1001", "insurance_policy", "Potwierdzenie ubezpieczenia prawnie wymagane", ["platform_owner", "admin", "carrier_owner", "insurance_partner", "authority_user"], true)
    ],
    photos: [
      photo("ph-load-1", "tr-1001", "pre_publish_load", "Elektronika przed publikacja", "u-warehouse", "ok"),
      photo("ph-strap-1", "tr-1001", "secured_load", "Ladunek zabezpieczony pasami", "u-driver-1", "ok"),
      photo("ph-load-2", "tr-1002", "pre_publish_load", "Farmacja na rampie", "u-warehouse", "ok"),
      photo("ph-load-3", "tr-1003", "pre_publish_load", "POS przed publikacja", "u-warehouse", "ok"),
      photo("ph-load-4", "tr-1004", "pre_publish_load", "Meble przed zaladunkiem", "u-client-owner", "ok"),
      photo("ph-damage-1", "tr-1004", "damage", "Uszkodzony naroznik", "u-driver-4", "risk"),
      photo("ph-load-6", "tr-1006", "pre_publish_load", "Ladunek przed przeprawa promowa", "u-warehouse", "ok")
    ],
    payments: [
      payment("pay-1", "tr-1001", PaymentStatuses.RESERVED, 4280),
      payment("pay-2", "tr-1002", PaymentStatuses.BLOCKED, 11200),
      payment("pay-3", "tr-1003", PaymentStatuses.PENDING, 980),
      payment("pay-4", "tr-1004", PaymentStatuses.BLOCKED, 3650),
      payment("pay-5", "tr-1005", PaymentStatuses.PENDING, 2400),
      payment("pay-6", "tr-1006", PaymentStatuses.RESERVED, 5100)
    ],
    onboardingDrafts: [],
    identityVerifications: [],
    roleVerifications: [],
    complianceFindings: [],
    financeModels: {
      platformWallet: "PlatformWallet",
      userWallet: "UserWallet",
      companyWallet: "CompanyWallet",
      partnerWallet: "PartnerWallet",
      transportEscrow: "TransportEscrow",
      walletTransaction: "WalletTransaction",
      invoice: "Invoice",
      settlement: "Settlement",
      payout: "Payout",
      paymentStatus: "PaymentStatus",
      auditLog: "AuditLog"
    },
    wallets: [
      wallet("wal-client-a", "co-client-a", 52000, 4280, { walletType: "Client Wallet", ownerType: "company", modelType: "CompanyWallet", pendingBalance: 2400, glWalletId: "GLW-CLIENT-0001" }),
      wallet("wal-client-b", "co-client-b", 18000, 11200, { walletType: "Client Wallet", ownerType: "company", modelType: "CompanyWallet", pendingBalance: 980, glWalletId: "GLW-CLIENT-0002" }),
      wallet("wal-client-c", "co-client-c", 7600, 3650, { walletType: "Client Wallet", ownerType: "company", modelType: "CompanyWallet", blockedBalance: 3650, glWalletId: "GLW-CLIENT-0003" }),
      wallet("wal-carrier-a", "co-carrier-a", 9400, 0, { walletType: "Carrier Wallet", ownerType: "company", modelType: "CompanyWallet", pendingBalance: 4280, paymentsInTransit: 5100, glWalletId: "GLW-CARRIER-0001" }),
      wallet("wal-carrier-b", "co-carrier-b", 6800, 0, { walletType: "Carrier Wallet", ownerType: "company", modelType: "CompanyWallet", glWalletId: "GLW-CARRIER-0002" }),
      wallet("wal-carrier-c", "co-carrier-c", 2100, 0, { walletType: "Carrier Wallet", ownerType: "company", modelType: "CompanyWallet", glWalletId: "GLW-CARRIER-0003" }),
      wallet("wal-driver-1", "co-carrier-a", 1260, 0, { walletType: "Driver Wallet", ownerType: "user", modelType: "UserWallet", ownerUserId: "u-driver-1", pendingBalance: 180, glWalletId: "GLW-DRIVER-0001" }),
      wallet("wal-role-switch-driver", "co-carrier-a", 990, 0, { walletType: "Driver Wallet", ownerType: "user", modelType: "UserWallet", ownerUserId: "u-role-switch", pendingBalance: 120, glWalletId: "GLW-DRIVER-MULTI" }),
      wallet("wal-warehouse-a", "co-client-b", 820, 0, { walletType: "Warehouse Wallet", ownerType: "user", modelType: "UserWallet", ownerUserId: "u-warehouse", glWalletId: "GLW-WAREHOUSE-0001" }),
      wallet("wal-insurance-a", "co-insurance-a", 12400, 0, { walletType: "Insurance Wallet", ownerType: "partner", modelType: "PartnerWallet", ownerUserId: "u-insurance", pendingBalance: 320, glWalletId: "GLW-INSURANCE-0001" }),
      wallet("wal-customs-a", "co-customs-a", 1200, 0, { walletType: "Customs Wallet", ownerType: "partner", modelType: "PartnerWallet", glWalletId: "GLW-CUSTOMS-0001" }),
      wallet("wal-ferry-dfds", "co-ferry-dfds", 5200, 0, { walletType: "Ferry Wallet", ownerType: "partner", modelType: "PartnerWallet", paymentsInTransit: 430, glWalletId: "GLW-FERRY-0001" }),
      wallet("wal-workshop-a", "co-workshop-a", 2400, 0, { walletType: "Workshop Wallet", ownerType: "partner", modelType: "PartnerWallet", glWalletId: "GLW-SERVICE-0001" }),
      wallet("wal-mobile-service-a", "co-mobile-service-a", 3100, 0, { walletType: "Mobile Service Wallet", ownerType: "partner", modelType: "PartnerWallet", paymentsInTransit: 280, glWalletId: "GLW-SERVICE-0002" }),
      wallet("wal-roadside-a", "co-roadside-a", 900, 0, { walletType: "Roadside Assistance Wallet", ownerType: "partner", modelType: "PartnerWallet", glWalletId: "GLW-SERVICE-0003" }),
      wallet("wal-admin", "platform", 0, 0, { walletType: "Administrator Wallet", ownerType: "user", ownerId: "u-admin", modelType: "UserWallet", ownerUserId: "u-admin", glWalletId: "GLW-ADMIN-0001" }),
      wallet("wal-platform", "platform", 7850, 0, { walletType: "GL System Wallet", ownerType: "platform", ownerId: "platform", modelType: "PlatformWallet", glWalletId: "GLW-SYSTEM-0001" })
    ],
    walletLedger: [
      ledger("led-1", "wal-client-a", "tr-1001", "hold", -4280, "escrow reserved for GL2-1001"),
      ledger("led-2", "wal-client-b", "tr-1002", "hold", -11200, "escrow blocked for GL2-1002"),
      ledger("led-3", "wal-client-c", "tr-1004", "hold", -3650, "escrow blocked for GL2-1004"),
      ledger("led-6", "wal-ferry-dfds", "tr-1006", "credit", 430, "symulowana platnosc za prom Calais-Dover"),
      ledger("led-7", "wal-customs-a", "tr-1001", "credit", 180, "opłata za odprawę celną MRN-GL2-1001"),
      ledger("led-8", "wal-mobile-service-a", "tr-1001", "credit", 280, "opłata za serwis techniczny srv-1")
    ],
    walletTransactions: [
      walletTransaction("gtx-1001", "2026-05-27T07:12:00.000Z", 4280, "EUR", "co-client-a", "escrow:esc-1", "Rezerwacja escrow dla GL2-1001", "Escrow", "hash-demo-6f4a-1001", "aud-esc-1001", "tr-1001"),
      walletTransaction("gtx-1002", "2026-05-27T07:18:00.000Z", 11200, "EUR", "co-client-b", "escrow:esc-2", "Blokada escrow - ryzyko temperatury", "Blocked", "hash-demo-9bc1-1002", "aud-esc-1002", "tr-1002"),
      walletTransaction("gtx-1003", "2026-05-27T07:33:00.000Z", 3650, "EUR", "co-client-c", "escrow:esc-4", "Sporny transport mebli premium", "Disputed", "hash-demo-c8a4-1004", "aud-dis-1004", "tr-1004"),
      walletTransaction("gtx-1004", "2026-05-27T08:05:00.000Z", 430, "EUR", "co-client-a", "co-ferry-dfds", "Oplata promowa Calais-Dover", "Completed", "hash-demo-ferry-430", "aud-fer-1006", "tr-1006"),
      walletTransaction("gtx-1005", "2026-05-27T08:21:00.000Z", 180, "EUR", "co-client-a", "co-customs-a", "Oplata odprawy MRN-GL2-1001", "Completed", "hash-demo-mrn-180", "aud-cus-1001", "tr-1001"),
      walletTransaction("gtx-1006", "2026-05-27T08:44:00.000Z", 280, "EUR", "co-carrier-a", "co-mobile-service-a", "Serwis mobilny - kontrola hamulca", "Completed", "hash-demo-srv-280", "aud-srv-1001", "tr-1001"),
      walletTransaction("gtx-1007", "2026-05-27T09:15:00.000Z", 980, "PLN", "co-client-a", "escrow:draft", "Oczekujaca rezerwacja po publikacji ladunku", "Pending", "hash-demo-pending-980", "aud-pay-1003", "tr-1003"),
      walletTransaction("gtx-1008", "2026-05-27T10:10:00.000Z", 5100, "EUR", "co-client-a", "escrow:esc-6", "Transport intermodalny na promie", "Reserved", "hash-demo-interop-5100", "aud-esc-1006", "tr-1006")
    ],
    invoices: [
      invoice("inv-client-1001", "co-client-a", "tr-1001", 4280, "EUR", "issued", "faktura klienta za transport"),
      invoice("inv-client-1006", "co-client-a", "tr-1006", 5100, "EUR", "issued", "faktura klienta za transport intermodalny"),
      invoice("inv-carrier-1001", "co-carrier-a", "tr-1001", 4152, "EUR", "pending_payout", "rozliczenie przewoznika po prowizji GL"),
      invoice("inv-ins-1001", "co-insurance-a", "tr-1001", 72, "EUR", "policy_active", "skladka polisy transportowej"),
      invoice("inv-service-1006", "co-workshop-a", "tr-1006", 320, "EUR", "paid_demo", "faktura za usluge serwisowa")
    ],
    settlements: [
      settlement("set-carrier-1001", "co-carrier-a", "tr-1001", 4152, "EUR", "waiting_for_documents", "carrier_transport"),
      settlement("set-platform-1001", "platform", "tr-1001", 128, "EUR", "fee_reserved", "platform_fee"),
      settlement("set-ins-1001", "co-insurance-a", "tr-1001", 72, "EUR", "premium_reserved", "insurance_premium"),
      settlement("set-service-1006", "co-workshop-a", "tr-1006", 320, "EUR", "completed", "service_order")
    ],
    payouts: [
      payout("payout-carrier-1001", "co-carrier-a", "tr-1001", 4152, "EUR", "pending"),
      payout("payout-ins-1001", "co-insurance-a", "tr-1001", 72, "EUR", "scheduled"),
      payout("payout-service-1006", "co-workshop-a", "tr-1006", 320, "EUR", "completed_demo")
    ],
    walletRiskAlerts: [
      walletRiskAlert("risk-wallet-1", "HIGH", "Escrow zablokowane przez dispute", "Transport GL2-1004 ma aktywny spor, srodki pozostaja zamrozone.", "gtx-1003"),
      walletRiskAlert("risk-wallet-2", "MEDIUM", "Nietypowa kwota w pharma", "GL2-1002 przekracza standardowy prog dla zimnego lancucha.", "gtx-1002"),
      walletRiskAlert("risk-wallet-3", "INFO", "AML demo check", "Brak prawdziwej weryfikacji AML - alert pokazowy dla architektury.", "gtx-1001")
    ],
    walletReports: [
      walletReport("Saldo", ["PDF", "Excel", "CSV"]),
      walletReport("Cash Flow", ["PDF", "Excel", "CSV"]),
      walletReport("Escrow", ["PDF", "Excel", "CSV"]),
      walletReport("Prowizje", ["PDF", "Excel", "CSV"]),
      walletReport("Przychody", ["PDF", "Excel", "CSV"]),
      walletReport("Zwroty", ["PDF", "Excel", "CSV"]),
      walletReport("Reklamacje", ["PDF", "Excel", "CSV"]),
      walletReport("Rozliczenia", ["PDF", "Excel", "CSV"])
    ],
    walletApiEndpoints: [
      walletEndpoint("Wallet", "GET", "/api/wallets/{walletId}", "Pobranie portfela i limitow", "architecture"),
      walletEndpoint("Escrow", "POST", "/api/escrow/reserve", "Rezerwacja srodkow po utworzeniu transportu", "architecture"),
      walletEndpoint("Transactions", "GET", "/api/transactions", "Historia transakcji i audit id", "architecture"),
      walletEndpoint("Balance", "GET", "/api/balance/{ownerId}", "Saldo dostepne, zablokowane i oczekujace", "architecture"),
      walletEndpoint("Insurance", "GET", "/api/insurance/policies/{transportId}", "Polisy powiazane z transportem", "architecture"),
      walletEndpoint("Settlement", "POST", "/api/settlement/release", "Zwolnienie escrow po dokumentach", "architecture"),
      walletEndpoint("Refund", "POST", "/api/refund", "Zwrot demo po decyzji administratora", "architecture"),
      walletEndpoint("Dispute", "POST", "/api/disputes/{id}/decision", "Release, refund albo split payment", "architecture"),
      walletEndpoint("Fees", "GET", "/api/fees/simulate", "Kalkulacja prowizji GL i podatku", "architecture"),
      walletEndpoint("Exchange Rates", "GET", "/api/exchange-rates", "Tabela kursow do przyszlych integracji", "architecture")
    ],
    exchangeRates: [
      exchangeRate("EUR", 1),
      exchangeRate("PLN", 4.31),
      exchangeRate("USD", 1.08),
      exchangeRate("CHF", 0.96),
      exchangeRate("GBP", 0.84),
      exchangeRate("CZK", 24.72),
      exchangeRate("SEK", 11.18),
      exchangeRate("NOK", 11.42),
      exchangeRate("DKK", 7.46)
    ],
    escrows: [
      escrow("esc-1", "tr-1001", "co-client-a", "co-carrier-a", 4280, "reserved"),
      escrow("esc-2", "tr-1002", "co-client-b", "co-carrier-b", 11200, "blocked"),
      escrow("esc-4", "tr-1004", "co-client-c", "co-carrier-a", 3650, "blocked"),
      escrow("esc-6", "tr-1006", "co-client-a", "co-carrier-a", 5100, "reserved")
    ],
    escrowOperations: [
      escrowOperation("escop-1001", "esc-1", "tr-1001", "reserve", "reserved", "aud-escop-1001", 4280),
      escrowOperation("escop-1002", "esc-2", "tr-1002", "block", "blocked", "aud-escop-1002", 11200),
      escrowOperation("escop-1004", "esc-4", "tr-1004", "block", "blocked", "aud-escop-1004", 3650),
      escrowOperation("escop-1006", "esc-6", "tr-1006", "reserve", "reserved", "aud-escop-1006", 5100)
    ],
    revenueLedger: [
      revenue("rev-1", "tr-1001", "transport_fee", 1, "demo transport fee"),
      revenue("rev-2", "tr-1002", "transport_fee", 1, "demo transport fee"),
      revenue("rev-3", "tr-1004", "insurance_commission", 1, "demo insurance channel fee"),
      revenue("rev-6", "tr-1006", "ferry_service_fee", 1, "demo ferry service fee")
    ],
    insurancePolicies: [
      policy("ins-1", "tr-1001", "ShieldCargo", "POL-4280", "standard CMR", 72, "active", ["doc-1"]),
      policy("ins-2", "tr-1002", "ShieldCargo", "POL-11200", "pharma cold chain", 320, "risk_review", ["doc-3"]),
      policy("ins-3", "tr-1004", "ShieldCargo", "POL-3650", "cargo damage", 96, "claim_pending", ["doc-4"]),
      policy("ins-4", "tr-1006", "ShieldCargo", "POL-5100", "intermodal ferry", 118, "active", ["doc-6"])
    ],
    trustRecords: [
      trust("co-client-a", "company", 93),
      trust("co-client-b", "company", 88),
      trust("co-client-c", "company", 79),
      trust("co-carrier-a", "company", 96),
      trust("co-carrier-b", "company", 91),
      trust("co-carrier-c", "company", 61),
      trust("u-driver-1", "driver", 95),
      trust("u-driver-2", "driver", 90),
      trust("u-driver-3", "driver", 67),
      trust("u-driver-4", "driver", 72),
      trust("u-warehouse", "warehouse", 87),
      trust("pk-1", "parking", 91),
      trust("pk-2", "parking", 82),
      trust("pk-3", "parking", 68),
      trust("pk-4", "parking", 77),
      trust("co-security-a", "security", 89),
      trust("u-security", "security", 89),
      trust("co-customs-a", "customs_agent", 90),
      trust("u-customs", "customs_agent", 90),
      trust("co-ferry-dfds", "ferry_operator", 92),
      trust("co-rail-terminal", "rail_operator", 86),
      trust("u-ferry", "ferry_operator", 92),
      trust("co-workshop-a", "workshop", 88),
      trust("co-mobile-service-a", "mobile_service", 91),
      trust("co-roadside-a", "roadside_assistance", 85)
    ],
    parking: [
      parking("pk-1", "A2 Secure Parking", 52.096, 18.93, 18, 91, ["shower", "food", "guarded"]),
      parking("pk-2", "Brno Truck Stop", 49.178, 16.59, 6, 82, ["fuel", "food"]),
      parking("pk-3", "A4 Night Bay", 50.07, 19.7, 0, 68, ["camera"]),
      parking("pk-4", "Basel Cold Dock", 47.58, 7.61, 4, 77, ["reefer_power", "guarded"])
    ],
    driverTime: [
      driverTime("u-driver-1", 4.0, 2.5, 7.5, true, true),
      driverTime("u-driver-2", 7.5, 0.75, 2.0, true),
      driverTime("u-driver-3", 9.5, 0.25, 0.5, false),
      driverTime("u-driver-4", 4.5, 1.5, 7.5, true),
      driverTime("u-driver-5", 2.0, 0.75, 8.0, true),
      driverTime("u-driver-6", 6.0, 0.5, 5.0, false)
    ],
    jobs: [
      job("job-1", "tr-1001", "u-driver-1", "co-carrier-a", "in_progress"),
      job("job-2", "tr-1002", "u-driver-2", "co-carrier-b", "blocked"),
      job("job-4", "tr-1004", "u-driver-4", "co-carrier-a", "disputed"),
      job("job-6", "tr-1006", "u-driver-1", "co-carrier-a", "on_ferry")
    ],
    aiAlerts: [
      {
        id: "ai-1",
        transportId: "tr-1002",
        severity: "high",
        reason: "temperature out of range and payment hold required",
        status: "open",
        createdAt: "2026-05-27T10:42:00.000Z"
      },
      {
        id: "ai-2",
        transportId: "tr-1004",
        severity: "medium",
        reason: "damage photo detected in dispute flow",
        status: "open",
        createdAt: "2026-05-27T08:36:00.000Z"
      }
    ],
    messageThreads: [
      thread("thread-tr-1001", "tr-1001", ["co-client-a", "co-carrier-a", "co-security-a", "co-customs-a", "co-mobile-service-a"]),
      thread("thread-tr-1004", "tr-1004", ["co-client-c", "co-carrier-a", "co-insurance-a", "co-security-a"]),
      thread("thread-tr-1006", "tr-1006", ["co-client-a", "co-carrier-a", "co-ferry-dfds"])
    ],
    messages: [
      message("msg-1", "thread-tr-1001", "tr-1001", "u-client-dispatcher", Roles.CLIENT_DISPATCHER, "Zaladunek potwierdzony, prosze trzymac trase A2.", "pl"),
      message("msg-2", "thread-tr-1001", "tr-1001", "u-driver-1", Roles.DRIVER, "Arrived at secure parking, break started.", "en"),
      message("msg-4", "thread-tr-1001", "tr-1001", "u-customs", Roles.CUSTOMS_AGENT, "MRN i packing list przyjęte do odprawy.", "pl"),
      message("msg-5", "thread-tr-1001", "tr-1001", "u-mobile-service", Roles.MOBILE_SERVICE, "Serwis mobilny przyjął zgłoszenie awarii opony.", "pl"),
      message("msg-3", "thread-tr-1004", "tr-1004", "u-driver-4", Roles.DRIVER, "Damage found at unloading, photos uploaded.", "en"),
      message("msg-6", "thread-tr-1006", "tr-1006", "u-ferry", Roles.FERRY_OPERATOR, "Vehicle BL 7DFD is on ferry Calais-Dover. Driver resting.", "en")
    ],
    translations: [
      translation("trs-1", "msg-2", "en", "pl", "Kierowca zglosil postoj na parkingu strzezonym."),
      translation("trs-4", "msg-4", "pl", "en", "Customs accepted MRN and packing list for clearance."),
      translation("trs-5", "msg-5", "pl", "en", "Mobile service accepted the tire failure request."),
      translation("trs-2", "msg-3", "en", "pl", "Kierowca zglosil uszkodzenie przy rozladunku."),
      translation("trs-6", "msg-6", "en", "pl", "Pojazd BL 7DFD jest na promie Calais-Dover. Kierowca odpoczywa.")
    ],
    securityChecks: [
      securityCheck("sec-1", "tr-1001", "pickup", "cleared", "u-security", "plate and seal verified"),
      securityCheck("sec-2", "tr-1002", "pickup", "blocked", "u-security", "temperature seal mismatch"),
      securityCheck("sec-3", "tr-1004", "delivery", "blocked", "u-security", "damage visible before gate release")
    ],
    notifications: [],
    events: [],
    audit: [],
    disputes: [
      {
        id: "dis-1",
        transportId: "tr-1004",
        status: "open",
        reason: "damage after unloading",
        createdBy: "u-client-owner",
        auditId: "audit-dis-1",
        auditLogId: "audit-dis-1",
        audit_log_id: "audit-dis-1",
        auditIds: ["audit-dis-1"]
      }
    ],
    claims: [],
    disputeEvidencePacks: [
      evidencePack("evpack-1", "dis-1", "tr-1004", ["ph-load-4", "ph-damage-1"], ["doc-4"], ["msg-3"])
    ],
    digitalCmrs: [
      digitalCmr("cmr-1", "tr-1001", "locked", ["doc-1", "doc-2"]),
      digitalCmr("cmr-4", "tr-1004", "draft", ["doc-4"])
    ],
    plateLookups: [],
    ferryBookings: [
      ferryBooking(
        "ferry-1",
        "DFDS-GL2-1006",
        "tr-1006",
        "co-ferry-dfds",
        "Calais",
        "Dover",
        "2026-05-28T08:30:00.000Z",
        "2026-05-28T10:00:00.000Z",
        "vh-7",
        "u-driver-1",
        "ON_FERRY",
        430,
        "EUR",
        "2026-05-28T14:30:00.000Z"
      )
    ],
    ferryPayments: [
      ferryPayment("fpay-1", "ferry-1", "DFDS-GL2-1006", "tr-1006", "co-ferry-dfds", 430, "simulated_paid")
    ],
    customsCases: [
      customsCase("cust-1", "tr-1001", "co-customs-a", "u-customs", "CUSTOMS_CLEARED", "Rotterdam / DE border", "MRN-GL2-1001", 180)
    ],
    customsPayments: [
      customsPayment("cpay-1", "cust-1", "tr-1001", "co-customs-a", 180, "simulated_paid")
    ],
    authorityControls: [
      authorityControl("authctrl-1", "tr-1001", "u-authority-police", AuthoritySubtypes.POLICE, "A2 Poznan", "CONTROL_PASSED", "passed", ["cmr", "transport_license", "road_permit", "insurance_policy"])
    ],
    authorityControlHistory: [
      authorityHistory("authhist-1", "authctrl-1", "tr-1001", "u-authority-police", AuthoritySubtypes.POLICE, "A2 Poznan", "vh-1", "sprawdzenie dokumentów", "pozytywny", ["cmr", "transport_license", "road_permit", "insurance_policy"])
    ],
    companyDocuments: [
      companyDocument("company-doc-ckz-1", "co-carrier-a", "professional_competence_certificate", "Certyfikat Kompetencji Zawodowych Baltic Line"),
      companyDocument("company-doc-license-1", "co-carrier-a", "carrier_license", "Licencja transportowa Baltic Line"),
      companyDocument("company-doc-ocp-1", "co-carrier-a", "ocp", "OCP przewoznika Baltic Line"),
      companyDocument("company-doc-adr-1", "co-carrier-a", "adr_certificate", "Zaswiadczenie ADR dla floty Baltic Line")
    ],
    companyEmployeeCandidates: [
      employeeCandidate("cand-driver-1", "drivers", "Adam Nowak", "Kierowca C+E", Roles.DRIVER, CompanyRoleNames.DRIVER, "PL", ["PL", "DE"], "7 lat w UE", "zweryfikowane", "dostepny od jutra", "6200 PLN netto"),
      employeeCandidate("cand-driver-2", "drivers", "Luka Horvat", "Kierowca ADR", Roles.DRIVER, CompanyRoleNames.DRIVER, "HR", ["HR", "EN", "DE"], "9 lat, ADR", "zweryfikowane", "dostepny za 3 dni", "3100 EUR"),
      employeeCandidate("cand-dispatcher-1", "dispatchers", "Nina Zielinska", "Spedytor / dyspozytor", Roles.CARRIER_DISPATCHER, CompanyRoleNames.DISPATCHER, "PL", ["PL", "EN"], "5 lat planowania tras", "zweryfikowane", "dostepna teraz", "7800 PLN"),
      employeeCandidate("cand-dispatcher-2", "dispatchers", "Marco Rossi", "Dyspozytor intermodalny", Roles.CARRIER_DISPATCHER, CompanyRoleNames.DISPATCHER, "IT", ["IT", "EN"], "6 lat prom i kolej", "zweryfikowane", "dostepny od poniedzialku", "2900 EUR"),
      employeeCandidate("cand-fleet-1", "fleet_managers", "Katarzyna Fleet", "Manager floty", Roles.CARRIER_DISPATCHER, CompanyRoleNames.FLEET_MANAGER, "PL", ["PL", "EN"], "12 lat utrzymania floty", "zweryfikowane", "dostepna za tydzien", "12000 PLN"),
      employeeCandidate("cand-accounting-1", "accounting", "Filip Ksiegi", "Księgowość przewoznika", Roles.CARRIER_OWNER, CompanyRoleNames.CARRIER_ACCOUNTANT, "PL", ["PL"], "8 lat faktur i rozliczen", "zweryfikowane", "dostepny teraz", "8500 PLN"),
      employeeCandidate("cand-admin-1", "administration", "Ola Administracja", "Administracja firmy", Roles.CARRIER_DISPATCHER, CompanyRoleNames.COMPANY_EMPLOYEE, "PL", ["PL", "EN"], "4 lata obslugi dokumentow", "w trakcie", "dostepna od jutra", "6200 PLN")
    ],
    knowledgeSources: [
      knowledgeSource("ks-ckz-1", "Certyfikat Kompetencji Zawodowych przewoznika", KnowledgeSourceTypes.PROFESSIONAL_COMPETENCE_CERTIFICATE, "Wymaganie kompetencyjne dla podmiotu wykonujacego transport drogowy.", "PL", ["certyfikat", "przewoznik", "firma"], [Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER], ["company", "documents", "transport"]),
      knowledgeSource("ks-cmr-1", "Konwencja CMR", KnowledgeSourceTypes.CMR_CONVENTION, "Podstawowe zasady miedzynarodowego przewozu drogowego towarow.", "EU", ["cmr", "dokumenty", "transport"], [Roles.CLIENT_OWNER, Roles.CARRIER_OWNER, Roles.DRIVER, Roles.AUTHORITY_USER], ["documents", "transport"]),
      knowledgeSource("ks-adr-1", "ADR", KnowledgeSourceTypes.ADR_REGULATION, "Informacyjne zrodlo dotyczace przewozu towarow niebezpiecznych.", "EU", ["adr", "ladunek", "pojazd", "driver"], [Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER, Roles.DRIVER], ["documents", "transport", "vehicles"]),
      knowledgeSource("ks-mobility-1", "Pakiet Mobilnosci", KnowledgeSourceTypes.MOBILITY_PACKAGE, "Reguly organizacji pracy przewoznika i kierowcy w transporcie UE.", "EU", ["mobilnosc", "przewoznik", "driver"], [Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER, Roles.DRIVER], ["transport", "driver_time"]),
      knowledgeSource("ks-driver-time-1", "Czas pracy kierowcy", KnowledgeSourceTypes.DRIVER_WORK_TIME, "Informacyjne wymagania dotyczace czasu pracy, przerw i odpoczynku.", "EU", ["czas_pracy", "tachograf", "driver"], [Roles.DRIVER, Roles.CARRIER_OWNER, Roles.CARRIER_DISPATCHER], ["driver_time", "transport"]),
      knowledgeSource("ks-tachograph-1", "Zasady tachografu", KnowledgeSourceTypes.TACHOGRAPH_RULES, "Podstawowe reguly rejestracji aktywnosci kierowcy.", "EU", ["tachograf", "driver", "kontrola"], [Roles.DRIVER, Roles.CARRIER_OWNER, Roles.AUTHORITY_USER], ["driver_time", "authority"]),
      knowledgeSource("ks-ocp-1", "OCP przewoznika", KnowledgeSourceTypes.INSURANCE_RULES, "Informacja o odpowiedzialnosci cywilnej przewoznika i dokumentach ubezpieczeniowych.", "PL", ["ocp", "ubezpieczenie", "przewoznik"], [Roles.CARRIER_OWNER, Roles.INSURANCE_PARTNER], ["insurance", "documents"]),
      knowledgeSource("ks-warehouse-1", "Procedura magazynu", KnowledgeSourceTypes.WAREHOUSE_PROCEDURE, "Minimalny opis krokow bramy, rampy, zdjec i potwierdzenia zaladunku.", "PL", ["magazyn", "rampa", "zdjecia"], [Roles.WAREHOUSE_WORKER, Roles.DRIVER, Roles.CLIENT_OWNER], ["photos", "documents", "transport"]),
      knowledgeSource("ks-academy-transport-1", "Material GL Academy: podstawy transportu", KnowledgeSourceTypes.ACADEMY_MATERIAL, "Material demo dla przyszlych kursow Akademii GL.", "PL", ["akademia", "szkolenie", "podstawy"], [Roles.ACADEMY_TEACHER, Roles.ACADEMY_STUDENT], ["academy"])
    ],
    companyComplianceEntries: [],
    serviceProviders: [
      serviceProvider("srvprov-1", "co-workshop-a", "TruckFix Warsztat", "workshop", 52.21, 16.91, 45, 320),
      serviceProvider("srvprov-2", "co-mobile-service-a", "MobileTruck Serwis", "mobile_service", 52.12, 18.86, 25, 280),
      serviceProvider("srvprov-3", "co-roadside-a", "RoadHelp 24", "roadside_assistance", 52.03, 18.97, 35, 420)
    ],
    serviceRequests: [
      serviceRequest("srv-1", "tr-1001", "vh-1", "u-driver-1", "co-carrier-a", "co-mobile-service-a", "mobile_service", "awaria opony", "accepted", 25, 280, "2026-05-27T13:40:00.000Z"),
      serviceRequest("srv-2", "tr-1006", "vh-7", "u-driver-1", "co-carrier-a", "co-workshop-a", "workshop", "diagnostyka naczepy", "completed", 45, 320, "2026-05-28T16:00:00.000Z")
    ],
    servicePayments: [
      servicePayment("spay-1", "srv-1", "tr-1001", "co-mobile-service-a", 280, "simulated_paid"),
      servicePayment("spay-2", "srv-2", "tr-1006", "co-workshop-a", 320, "simulated_paid")
    ],
    apiClients: [
      apiClient("api-erp-nord", "Nord Market ERP", "co-client-a", ["CREATE_LOAD", "UPLOAD_DOCUMENT"], 1200, "active"),
      apiClient("api-gps-baltic", "Baltic Line GPS", "co-carrier-a", ["GPS_UPDATE"], 8000, "active"),
      apiClient("api-ins-shield", "ShieldCargo Claims", "co-insurance-a", ["READ_RISK", "OPEN_CLAIM"], 2400, "active")
    ],
    apiAudit: [
      apiAudit("apia-1", "api-erp-nord", "CREATE_LOAD", "allowed", "demo baseline"),
      apiAudit("apia-2", "api-gps-baltic", "GPS_UPDATE", "allowed", "demo baseline")
    ],
    integrations: [
      integration("int-erp-1", "erp", "Nord Market SAP", "co-client-a", "healthy"),
      integration("int-gps-1", "gps", "Baltic telematics", "co-carrier-a", "healthy"),
      integration("int-ins-1", "insurance", "ShieldCargo API", "co-insurance-a", "degraded"),
      integration("int-pay-1", "payment", "DemoPay bank bridge", "co-payment-a", "healthy")
    ],
    integrationRuns: [],
    regionRules: [
      regionRule("eu", "EUR", ["pl", "en", "de", "fr", "it"], "eu_driver_time"),
      regionRule("usa", "USD", ["en", "es"], "us_hours_of_service"),
      regionRule("asia", "USD", ["en"], "partner_local_rules")
    ],
    tachographImports: [
      tachographImport("ddd-1", "u-driver-1", "DDD", "ok", 5.5, 1.0),
      tachographImport("ddd-2", "u-driver-3", "DDD", "violation", 9.5, 0.25)
    ],
    complianceChecks: [],
    crewPlans: [
      crewPlan("crew-1", "tr-1001", ["u-driver-1"], false, false),
      crewPlan("crew-2", "tr-1002", ["u-driver-2", "u-driver-5"], true, false),
      crewPlan("crew-4", "tr-1004", ["u-driver-4"], false, true),
      crewPlan("crew-6", "tr-1006", ["u-driver-1"], false, true)
    ],
    serviceHealth: [
      serviceHealth("svc-transport", "Transport Service", "healthy"),
      serviceHealth("svc-wallet", "Wallet Service", "healthy"),
      serviceHealth("svc-gps", "GPS Service", "healthy"),
      serviceHealth("svc-insurance", "Insurance Service", "degraded")
    ],
    backupSnapshots: [
      backupSnapshot("bak-1", "operational-db", "ok"),
      backupSnapshot("bak-2", "finance-db", "ok"),
      backupSnapshot("bak-3", "document-storage", "ok")
    ],
    emergencyMode: {
      enabled: false,
      criticalServices: ["transport", "documents", "communication"],
      lastCheckedAt: baseTime
    }
  };

  seedEmployeeCandidateUsers(state);
  buildCompanyAccessSeed(state);
  tuneDemoCompanyRoles(state);
  if (options.startInApp) activatePublicRoleSwitchDemo(state);
  seedEvents(state);
  seedFinancialAuditRecords(state);
  seedKnowledgeAuditRecords(state);
  return state;
}

function activatePublicRoleSwitchDemo(state) {
  const membership = state.userCompanyRoles.find((item) => (
    item.userId === "u-role-switch"
    && item.companyId === "co-carrier-a"
    && item.roleName === CompanyRoleNames.EMPLOYEE
  )) || state.userCompanyRoles.find((item) => item.userId === "u-role-switch" && item.companyId === "co-carrier-a");
  const user = state.users.find((item) => item.id === "u-role-switch");
  if (user) {
    user.selectedRole = Roles.DRIVER;
    user.companyId = "co-carrier-a";
    user.accountStatus = AccountStatuses.VERIFIED;
  }
  state.session = {
    ...state.session,
    userId: "u-role-switch",
    role: Roles.DRIVER,
    activeRole: Roles.DRIVER,
    language: "pl",
    languageSelected: true,
    detectedLanguage: null,
    country: "PL",
    view: "dashboard",
    selectedTransportId: null,
    contextType: "company",
    companyId: "co-carrier-a",
    activeCompanyId: "co-carrier-a",
    companyRoleId: membership?.id || null,
    activeContext: {
      contextType: "company",
      companyId: "co-carrier-a",
      userCompanyRoleId: membership?.id || null,
      label: "Baltic Line / kierowca"
    },
    authSessionId: null,
    onboardingRequired: false,
    onboardingUserId: null,
    deniedView: null,
    deniedRoute: null,
    lastResult: null
  };
}

function user(id, name, phone, primaryRole, companyId, accountStatus, options = {}) {
  const approved = accountStatus === AccountStatuses.APPROVED || accountStatus === AccountStatuses.VERIFIED;
  const [firstName = name, ...lastNameParts] = String(name).split(" ");
  const roles = options.roles || [primaryRole];
  const selectedRole = options.selectedRole || primaryRole;
  const roleVerificationStatus = Object.fromEntries(
    roles.map((role) => [role, approved ? AccountStatuses.APPROVED : AccountStatuses.ROLE_DOCUMENTS_PENDING])
  );
  const roleDocuments = approved
    ? Object.fromEntries(roles.map((role) => [role, ["identity_document", "selfie", "role_documents_demo"]]))
    : {};
  return {
    id,
    name,
    firstName: options.firstName || firstName,
    lastName: options.lastName || lastNameParts.join(" "),
    email: options.email || `${id.replaceAll("-", ".")}@demo.gl`,
    phone,
    language: "pl",
    country: options.country || "PL",
    countryOfResidence: options.countryOfResidence || options.country || "PL",
    userType: options.userType || primaryRole,
    companyId,
    roles,
    selectedRole,
    accountStatus,
    verificationStatus: accountStatus,
    onboardingStage: approved ? "approved" : "role_documents",
    phoneVerified: approved,
    documentVerified: options.documentVerified ?? true,
    faceVerified: options.faceVerified ?? true,
    documentsValid: options.documentsValid ?? true,
    identityDocument: approved ? {
      id: `id-doc-${id}`,
      type: "identity_card",
      country: "PL",
      expiresAt: "2030-12-31",
      selfieConfirmed: true,
      submittedAt: baseTime
    } : null,
    roleVerificationStatus,
    roleDocuments,
    companyVerification: companyId && approved ? {
      id: `company-ver-${id}`,
      role: selectedRole,
      companyName: companyId,
      vatEu: "DEMO-VAT",
      walletReady: true,
      hasCompanyDocuments: true,
      submittedAt: baseTime
    } : null,
    walletReady: approved,
    driverTimeLegal: options.driverTimeLegal ?? true,
    authoritySubtype: options.authoritySubtype || null,
    recoveryEnabled: true,
    previousPhones: []
  };
}

function company(id, name, type, trustScore, people, status) {
  return {
    id,
    company_id: id,
    name,
    country: "PL",
    vatEu: `DEMO-${id.toUpperCase()}`,
    address: "adres demo",
    type,
    companyType: type,
    trustScore,
    status,
    verificationStatus: status,
    people,
    ownerUserIds: people.slice(0, 1),
    invitedUserIds: [],
    documentIds: [],
    auditIds: []
  };
}

function companyDocument(id, companyId, type, label) {
  return {
    id,
    document_id: id,
    companyId,
    company_id: companyId,
    type,
    label,
    status: "verified",
    uploadedBy: "seed",
    uploadedAt: baseTime
  };
}

function employeeCandidate(id, category, name, roleLabel, appRole, companyRoleName, country, languages, experience, documentsStatus, availability, expectedSalary) {
  return {
    id,
    candidate_id: id,
    userId: `u-${id}`,
    category,
    name,
    roleLabel,
    appRole,
    companyRoleName,
    country,
    languages,
    experience,
    reputation: 4.8,
    reviewCount: 24,
    documentsStatus,
    availability,
    expectedSalary,
    avatar: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    status: "candidate"
  };
}

function seedEmployeeCandidateUsers(state) {
  (state.companyEmployeeCandidates || []).forEach((candidate, index) => {
    if (state.users.some((user) => user.id === candidate.userId)) return;
    const candidateUser = user(
      candidate.userId,
      candidate.name,
      `+48990${String(index + 1).padStart(6, "0")}`,
      candidate.appRole,
      null,
      AccountStatuses.VERIFIED,
      {
        roles: [candidate.appRole],
        selectedRole: candidate.appRole,
        documentsValid: candidate.documentsStatus === "zweryfikowane",
        faceVerified: true
      }
    );
    candidateUser.email = `${candidate.id}@candidates.demo.gl`;
    candidateUser.country = candidate.country;
    candidateUser.languages = candidate.languages;
    candidateUser.candidateStatus = "demo_candidate";
    state.users.push(candidateUser);
  });
}

function knowledgeSource(id, title, type, description, country, tags, relatedRoles, relatedModules) {
  const auditLogId = `audit-${id}`;
  return {
    id,
    knowledge_source_id: id,
    title,
    type,
    description,
    jurisdiction_country: country,
    language: "pl",
    version: "1.0",
    valid_from: baseTime,
    valid_to: null,
    status: "active",
    tags,
    related_roles: relatedRoles,
    related_modules: relatedModules,
    source_reference: "demo_seed",
    created_at: baseTime,
    updated_at: baseTime,
    auditLogId: auditLogId,
    audit_log_id: auditLogId
  };
}

function tuneDemoCompanyRoles(state) {
  const finance = state.userCompanyRoles.find((item) => item.userId === "u-carrier-finance" && item.companyId === "co-carrier-a");
  if (finance) {
    finance.roleName = CompanyRoleNames.FINANCE;
    finance.roleId = `company_role_${CompanyRoleNames.FINANCE}`;
    finance.role_id = finance.roleId;
  }

  const multiCarrier = state.userCompanyRoles.find((item) => item.userId === "u-multi-company" && item.companyId === "co-carrier-a");
  if (multiCarrier) {
    multiCarrier.roleName = CompanyRoleNames.DISPATCHER;
    multiCarrier.roleId = `company_role_${CompanyRoleNames.DISPATCHER}`;
    multiCarrier.role_id = multiCarrier.roleId;
  }

  const multiClient = state.userCompanyRoles.find((item) => item.userId === "u-multi-company" && item.companyId === "co-client-a");
  if (multiClient) {
    multiClient.roleName = CompanyRoleNames.FINANCE;
    multiClient.roleId = `company_role_${CompanyRoleNames.FINANCE}`;
    multiClient.role_id = multiClient.roleId;
  }

  const roleSwitchCarrierEmployee = state.userCompanyRoles.find((item) => item.userId === "u-role-switch" && item.companyId === "co-carrier-a");
  if (roleSwitchCarrierEmployee) setDemoMembershipRole(roleSwitchCarrierEmployee, CompanyRoleNames.EMPLOYEE);
  ensureDemoMembership(state, "ucr-role-switch-carrier-owner", "u-role-switch", "co-carrier-a", CompanyRoleNames.OWNER);

  const roleSwitchClient = state.userCompanyRoles.find((item) => item.userId === "u-role-switch" && item.companyId === "co-client-a");
  if (roleSwitchClient) setDemoMembershipRole(roleSwitchClient, CompanyRoleNames.OWNER);

  const roleSwitchWarehouse = state.userCompanyRoles.find((item) => item.userId === "u-role-switch" && item.companyId === "co-client-b");
  if (roleSwitchWarehouse) setDemoMembershipRole(roleSwitchWarehouse, CompanyRoleNames.WAREHOUSE_MANAGER);

  const roleSwitchWorkshop = state.userCompanyRoles.find((item) => item.userId === "u-role-switch" && item.companyId === "co-workshop-a");
  if (roleSwitchWorkshop) setDemoMembershipRole(roleSwitchWorkshop, CompanyRoleNames.MECHANIC);

  const roleSwitchInsurance = state.userCompanyRoles.find((item) => item.userId === "u-role-switch" && item.companyId === "co-insurance-a");
  if (roleSwitchInsurance) setDemoMembershipRole(roleSwitchInsurance, CompanyRoleNames.INSURANCE_MANAGER);
}

function ensureDemoMembership(state, id, userId, companyId, roleName) {
  let membership = state.userCompanyRoles.find((item) => item.id === id);
  if (!membership) {
    membership = {
      id,
      userCompanyRole_id: id,
      userId,
      user_id: userId,
      companyId,
      company_id: companyId,
      status: "active",
      permissions: [],
      deniedPermissions: [],
      invitedBy: userId,
      invitedAt: baseTime,
      acceptedAt: baseTime
    };
    state.userCompanyRoles.push(membership);
  }
  setDemoMembershipRole(membership, roleName);
  const company = state.companies.find((item) => item.id === companyId);
  company.people ||= [];
  if (!company.people.includes(userId)) company.people.push(userId);
  return membership;
}

function setDemoMembershipRole(membership, roleName) {
  membership.roleName = roleName;
  membership.roleId = `company_role_${roleName}`;
  membership.role_id = membership.roleId;
}

function vehicle(id, plate, companyId, type, documentsValid, available) {
  return { id, plate, companyId, type, documentsValid, available };
}

function point(address, lat, lng) {
  return { address, gps: { lat, lng } };
}

function cargo(description, weightKg, dimensions, prePublishPhotoId) {
  return { description, weightKg, dimensions, prePublishPhotoId };
}

function transport(input) {
  return {
    ...input,
    shipmentIds: input.shipmentIds || [input.id.replace("tr-", "sh-")],
    routeDeviation: false,
    activeDisputeId: input.activeDisputeId || null,
    activeClaimId: null,
    activeAiAlertId: input.activeAiAlertId || null,
    statusHistory: [
      {
        at: baseTime,
        from: null,
        to: input.status,
        by: "seed",
        reason: "demo seed"
      }
    ],
    eventIds: [],
    auditIds: [],
    requiredDocumentTypes: ["cmr", "delivery_confirmation"]
  };
}

function shipment(id, transportId, clientCompanyId, description, weightKg, status, photoIds, documentIds) {
  return {
    id,
    transportId,
    clientCompanyId,
    cargo: { description, weightKg },
    status,
    photoIds,
    documentIds,
    requiredProofs: ["pre_publish_load", "pickup_confirmation", "delivery_confirmation"]
  };
}

function document(id, transportId, type, label, visibleToRoles, encrypted) {
  return {
    id,
    transportId,
    type,
    label,
    visibleToRoles,
    encrypted,
    integrityHash: `sha256-demo-${id}`,
    uploadedBy: "seed",
    uploadedAt: baseTime
  };
}

function photo(id, transportId, type, label, uploadedBy, state) {
  return {
    id,
    transportId,
    type,
    label,
    uploadedBy,
    state,
    integrityHash: `photo-hash-${id}`,
    uploadedAt: baseTime
  };
}

function payment(id, transportId, status, amount) {
  const auditLogId = `audit-${id}`;
  return {
    id,
    modelType: "PaymentStatus",
    transportId,
    status,
    amount,
    currency: "EUR",
    auditId: auditLogId,
    auditLogId,
    audit_log_id: auditLogId,
    auditIds: [auditLogId],
    updatedAt: baseTime
  };
}

function wallet(id, ownerCompanyId, balance, heldBalance, options = {}) {
  const ownerType = options.ownerType || (options.ownerUserId ? "user" : ownerCompanyId === "platform" ? "platform" : "company");
  const ownerId = options.ownerId || (ownerType === "user" ? options.ownerUserId : ownerType === "platform" ? "platform" : ownerCompanyId);
  return {
    id,
    modelType: options.modelType || walletModelForOwnerType(ownerType),
    glWalletId: options.glWalletId || `GLW-DEMO-${id.toUpperCase()}`,
    walletType: options.walletType || "Company Wallet",
    ownerType,
    ownerId,
    owner_type: ownerType,
    owner_id: ownerId,
    ownerCompanyId,
    ownerUserId: options.ownerUserId || null,
    currency: "EUR",
    balance,
    heldBalance,
    pendingBalance: options.pendingBalance || 0,
    blockedBalance: options.blockedBalance || 0,
    escrowBalance: options.escrowBalance || heldBalance,
    paymentsInTransit: options.paymentsInTransit || 0,
    status: "demo_only"
  };
}

function walletModelForOwnerType(ownerType) {
  if (ownerType === "platform") return "PlatformWallet";
  if (ownerType === "user") return "UserWallet";
  if (ownerType === "partner") return "PartnerWallet";
  if (ownerType === "transport_escrow") return "TransportEscrow";
  return "CompanyWallet";
}

function ledger(id, walletId, transportId, type, amount, reason) {
  const auditLogId = `audit-${id}`;
  return {
    id,
    modelType: "WalletLedgerEntry",
    walletId,
    transportId,
    type,
    amount,
    currency: "EUR",
    reason,
    auditId: auditLogId,
    auditLogId,
    audit_log_id: auditLogId,
    at: baseTime
  };
}

function walletTransaction(id, at, amount, currency, senderId, receiverId, reason, status, hash, auditId, transportId) {
  return {
    id,
    modelType: "WalletTransaction",
    at,
    amount,
    currency,
    senderId,
    receiverId,
    reason,
    status,
    hash,
    auditId,
    auditLogId: auditId,
    audit_log_id: auditId,
    transportId
  };
}

function walletRiskAlert(id, level, title, description, transactionId) {
  return {
    id,
    level,
    title,
    description,
    transactionId,
    createdAt: baseTime,
    source: "AI Risk Engine / demo"
  };
}

function walletReport(name, exports) {
  return { name, exports, status: "ready_demo" };
}

function walletEndpoint(group, method, path, purpose, status) {
  return { group, method, path, purpose, status };
}

function exchangeRate(currency, demoRateToEur) {
  return { currency, demoRateToEur, source: "demo_static" };
}

function escrow(id, transportId, payerCompanyId, payeeCompanyId, amount, status) {
  return {
    id,
    modelType: "TransportEscrow",
    ownerType: "transport_escrow",
    ownerId: transportId,
    owner_type: "transport_escrow",
    owner_id: transportId,
    transportId,
    payerCompanyId,
    payeeCompanyId,
    amount,
    currency: "EUR",
    status,
    auditIds: [],
    lastAuditLogId: null,
    lastAudit_log_id: null,
    createdAt: baseTime,
    releasedAt: null
  };
}

function escrowOperation(id, escrowId, transportId, operationType, newState, auditLogId, amount) {
  return {
    id,
    modelType: "EscrowOperation",
    escrowId,
    transportId,
    operationType,
    previousState: null,
    newState,
    amount,
    currency: "EUR",
    reason: `${operationType} demo escrow operation`,
    auditId: auditLogId,
    auditLogId,
    audit_log_id: auditLogId,
    at: baseTime
  };
}

function invoice(id, ownerCompanyId, transportId, amount, currency, status, reason) {
  const auditLogId = `audit-${id}`;
  return {
    id,
    modelType: "Invoice",
    ownerCompanyId,
    transportId,
    amount,
    currency,
    status,
    reason,
    auditId: auditLogId,
    auditLogId,
    audit_log_id: auditLogId,
    issuedAt: baseTime
  };
}

function settlement(id, ownerCompanyId, transportId, amount, currency, status, type) {
  const auditLogId = `audit-${id}`;
  return {
    id,
    modelType: "Settlement",
    ownerCompanyId,
    transportId,
    amount,
    currency,
    status,
    type,
    auditId: auditLogId,
    auditLogId,
    audit_log_id: auditLogId,
    createdAt: baseTime
  };
}

function payout(id, ownerCompanyId, transportId, amount, currency, status) {
  const auditLogId = `audit-${id}`;
  return {
    id,
    modelType: "Payout",
    ownerCompanyId,
    recipientCompanyId: ownerCompanyId,
    transportId,
    amount,
    currency,
    status,
    auditId: auditLogId,
    auditLogId,
    audit_log_id: auditLogId,
    createdAt: baseTime
  };
}

function revenue(id, transportId, type, amount, reason) {
  const auditLogId = `audit-${id}`;
  return {
    id,
    transportId,
    type,
    amount,
    currency: "EUR",
    reason,
    auditId: auditLogId,
    auditLogId,
    audit_log_id: auditLogId,
    at: baseTime
  };
}

function policy(id, transportId, partner, number, scope, cost, status, documentIds) {
  return { id, transportId, partner, number, scope, cost, status, documentIds, claimIds: [] };
}

function trust(subjectId, subjectType, score) {
  return { subjectId, subjectType, score, history: [{ at: baseTime, delta: 0, reason: "demo baseline" }] };
}

function parking(id, name, lat, lng, freePlaces, trustScore, amenities) {
  return {
    id,
    name,
    gps: { lat, lng },
    freePlaces,
    trustScore,
    amenities,
    reports: []
  };
}

function driverTime(driverId, drivingHoursToday, breakHours, remainingLegalHours, legalToComplete, ferryRailAllowance = false) {
  return {
    driverId,
    drivingHoursToday,
    breakHours,
    remainingLegalHours,
    legalToComplete,
    tachographMode: "demo",
    doubleCrew: false,
    ferryRailAllowance
  };
}

function job(id, transportId, driverId, carrierCompanyId, status) {
  return {
    id,
    transportId,
    driverId,
    carrierCompanyId,
    status,
    createdAt: baseTime,
    completedAt: null
  };
}

function thread(id, transportId, participantCompanyIds) {
  return {
    id,
    transportId,
    participantCompanyIds,
    messageIds: []
  };
}

function message(id, threadId, transportId, authorId, authorRole, body, language) {
  return {
    id,
    threadId,
    transportId,
    authorId,
    authorRole,
    body,
    language,
    createdAt: baseTime,
    translationIds: []
  };
}

function translation(id, messageId, sourceLanguage, targetLanguage, body) {
  return {
    id,
    messageId,
    sourceLanguage,
    targetLanguage,
    body,
    createdAt: baseTime
  };
}

function securityCheck(id, transportId, checkpoint, status, officerId, reason) {
  return {
    id,
    transportId,
    checkpoint,
    status,
    officerId,
    reason,
    createdAt: baseTime
  };
}

function evidencePack(id, disputeId, transportId, photoIds, documentIds, messageIds) {
  const auditLogId = `audit-${id}`;
  return {
    id,
    disputeId,
    transportId,
    photoIds,
    documentIds,
    messageIds,
    createdAt: baseTime,
    locked: true,
    auditId: auditLogId,
    auditLogId,
    audit_log_id: auditLogId
  };
}

function digitalCmr(id, transportId, status, documentIds) {
  return {
    id,
    transportId,
    status,
    documentIds,
    signatures: ["warehouse", "driver"],
    createdAt: baseTime,
    lockedAt: status === "locked" ? baseTime : null
  };
}

function ferryBooking(
  id,
  ferryBookingId,
  transportId,
  operatorCompanyId,
  departurePort,
  arrivalPort,
  departureAt,
  arrivalAt,
  vehicleId,
  driverId,
  status,
  cost,
  currency,
  etaAfterFerry
) {
  return {
    id,
    ferry_booking_id: ferryBookingId,
    transportId,
    operatorCompanyId,
    departurePort,
    arrivalPort,
    departureAt,
    arrivalAt,
    checkInDeadlineAt: "2026-05-28T07:45:00.000Z",
    vehicleId,
    driverId,
    status,
    cost,
    currency,
    etaAfterFerry,
    restHours: 1.5,
    createdAt: baseTime,
    updatedAt: baseTime
  };
}

function ferryPayment(id, bookingId, ferryBookingId, transportId, operatorCompanyId, amount, status) {
  return {
    id,
    bookingId,
    ferry_booking_id: ferryBookingId,
    transportId,
    operatorCompanyId,
    amount,
    currency: "EUR",
    status,
    createdAt: baseTime
  };
}

function customsCase(id, transportId, agentCompanyId, agentUserId, status, borderPoint, mrn, fee) {
  return {
    id,
    transportId,
    agentCompanyId,
    agentUserId,
    status,
    borderPoint,
    mrn,
    requiredDocumentTypes: ["sad", "t1", "ex", "mrn", "commercial_invoice", "packing_list", "certificate_of_origin"],
    checkedDocumentIds: ["doc-7", "doc-8", "doc-9", "doc-10"],
    fee,
    currency: "EUR",
    createdAt: baseTime,
    updatedAt: baseTime,
    clearedAt: baseTime,
    holdReason: null
  };
}

function customsPayment(id, customsCaseId, transportId, agentCompanyId, amount, status) {
  return {
    id,
    customsCaseId,
    transportId,
    agentCompanyId,
    amount,
    currency: "EUR",
    status,
    createdAt: baseTime
  };
}

function authorityControl(id, transportId, authorityUserId, authoritySubtype, place, status, result, checkedDocumentTypes) {
  const transportVehicleId = transportId === "tr-1001" ? "vh-1" : null;
  return {
    id,
    transportId,
    authorityUserId,
    authoritySubtype,
    place,
    vehicleId: transportVehicleId,
    carrierCompanyId: transportId === "tr-1001" ? "co-carrier-a" : null,
    status,
    result,
    issue: null,
    checkedDocumentTypes,
    createdAt: baseTime,
    updatedAt: baseTime
  };
}

function authorityHistory(id, controlId, transportId, authorityUserId, authoritySubtype, place, vehicleId, controlType, result, checkedDocumentTypes) {
  return {
    id,
    controlId,
    authorityUserId,
    authoritySubtype,
    checkedAt: baseTime,
    place,
    vehicleId,
    transportId,
    controlType,
    result,
    checkedDocumentTypes,
    recordedBy: authorityUserId
  };
}

function serviceProvider(id, companyId, name, type, lat, lng, responseMinutes, baseCost) {
  return {
    id,
    companyId,
    name,
    type,
    gps: { lat, lng },
    responseMinutes,
    baseCost,
    currency: "EUR",
    available: true
  };
}

function serviceRequest(id, transportId, vehicleId, driverId, carrierCompanyId, providerCompanyId, providerType, faultType, status, responseMinutes, cost, etaAfter) {
  return {
    id,
    transportId,
    transportNumber: transportId.replace("tr-", "GL2-"),
    vehicleId,
    driverId,
    carrierCompanyId,
    reportedBy: driverId,
    faultType,
    description: "kierowca zgłasza problem techniczny na trasie",
    gps: { lat: 52.096, lng: 18.93 },
    status,
    providerCompanyId,
    providerType,
    responseMinutes,
    cost,
    currency: "EUR",
    rating: null,
    documentId: null,
    etaBefore: null,
    etaAfter,
    insuranceRelevant: false,
    createdAt: baseTime,
    updatedAt: baseTime
  };
}

function servicePayment(id, serviceRequestId, transportId, providerCompanyId, amount, status) {
  return {
    id,
    serviceRequestId,
    transportId,
    providerCompanyId,
    amount,
    currency: "EUR",
    status,
    createdAt: baseTime
  };
}

function apiClient(id, name, companyId, scopes, dailyLimit, status) {
  return { id, name, companyId, scopes, dailyLimit, usedToday: 0, status };
}

function apiAudit(id, apiClientId, action, result, reason) {
  return {
    id,
    apiClientId,
    action,
    result,
    reason,
    at: baseTime
  };
}

function integration(id, type, name, companyId, status) {
  return {
    id,
    type,
    name,
    companyId,
    status,
    lastRunAt: baseTime
  };
}

function regionRule(region, currency, languages, complianceProfile) {
  return { region, currency, languages, complianceProfile };
}

function tachographImport(id, driverId, source, status, drivingHours, breakHours) {
  return {
    id,
    driverId,
    source,
    status,
    drivingHours,
    breakHours,
    importedAt: baseTime
  };
}

function crewPlan(id, transportId, driverIds, doubleCrew, ferryRailAllowance) {
  return {
    id,
    transportId,
    driverIds,
    doubleCrew,
    ferryRailAllowance
  };
}

function serviceHealth(id, name, status) {
  return {
    id,
    name,
    status,
    lastCheckedAt: baseTime
  };
}

function backupSnapshot(id, store, status) {
  return {
    id,
    store,
    status,
    createdAt: baseTime
  };
}

function seedEvents(state) {
  const initialEvents = [
    ["LOAD_CREATED", "tr-1001", "Transport GL2-1001 seeded"],
    ["LOAD_PHOTO_ADDED", "tr-1001", "Pre-publish photo exists"],
    ["GPS_COORDINATES_CONFIRMED", "tr-1001", "Pickup and delivery coordinates confirmed"],
    ["SECURITY_CHECK_RECORDED", "tr-1001", "Pickup gate cleared"],
    ["ESCROW_RESERVED", "tr-1001", "Client funds reserved in demo escrow"],
    ["TRANSPORT_IN_TRANSIT", "tr-1001", "Transport is in transit"],
    ["MESSAGE_SENT", "tr-1001", "Transport thread contains participant messages"],
    ["AI_ALERT_CREATED", "tr-1002", "AI risk flag created"],
    ["DISPUTE_OPENED", "tr-1004", "Damage dispute opened"],
    ["FERRY_BOOKED", "tr-1006", "DFDS ferry booking created"],
    ["FERRY_ONBOARD", "tr-1006", "Vehicle is on ferry Calais-Dover"],
    ["FERRY_PAYMENT_SIMULATED", "tr-1006", "Demo ferry payment recorded"],
    ["CUSTOMS_CLEARED", "tr-1001", "Customs clearance completed by agency"],
    ["AUTHORITY_CONTROL_PASSED", "tr-1001", "Road authority control passed"],
    ["SERVICE_ACCEPTED", "tr-1001", "Mobile service accepted technical support request"]
  ];

  initialEvents.forEach(([type, transportId, reason], index) => {
    const event = {
      id: `ev-seed-${index + 1}`,
      type,
      at: new Date(Date.parse(baseTime) + index * 60000).toISOString(),
      actorId: "seed",
      actorRole: "system",
      objectType: "transport",
      objectId: transportId,
      previousState: null,
      newState: state.transports.find((item) => item.id === transportId)?.status || null,
      source: SourceTypes.SYSTEM,
      reason,
      device: "demo-seed"
    };
    state.events.unshift(event);
    const transport = state.transports.find((item) => item.id === transportId);
    if (transport) transport.eventIds.push(event.id);
    const audit = {
      id: `audit-seed-${index + 1}`,
      eventId: event.id,
      at: event.at,
      actorId: event.actorId,
      actorRole: event.actorRole,
      objectType: event.objectType,
      objectId: event.objectId,
      action: event.type,
      previousState: event.previousState,
      newState: event.newState,
      device: event.device,
      reason: event.reason,
      source: event.source,
      readOnly: true
    };
    state.audit.unshift(audit);
    if (transport) transport.auditIds.push(audit.id);
  });
}

function seedFinancialAuditRecords(state) {
  const addAudit = ({ auditLogId, sourceId, action, objectType, objectId, transportId, reason, newState, at }) => {
    if (!auditLogId || state.audit.some((row) => row.id === auditLogId)) return;
    const audit = {
      id: auditLogId,
      audit_log_id: auditLogId,
      eventId: `financial-seed-${sourceId}`,
      at: at || baseTime,
      actorId: "seed",
      actorRole: "system",
      actorCompanyId: null,
      actorCompanyRole: null,
      actorContextType: "system",
      objectType,
      objectId,
      transportId: transportId || null,
      action,
      requestedAction: action,
      result: "success",
      previousState: null,
      newState: newState ?? null,
      device: "demo-seed",
      reason,
      source: SourceTypes.SYSTEM,
      readOnly: true
    };
    state.audit.unshift(audit);
    const transport = state.transports.find((item) => item.id === transportId);
    if (transport && !transport.auditIds.includes(audit.id)) transport.auditIds.push(audit.id);
  };

  state.walletLedger.forEach((entry) => addAudit({
    auditLogId: entry.audit_log_id || entry.auditLogId || entry.auditId,
    sourceId: entry.id,
    action: "WALLET_LEDGER_RECORDED",
    objectType: "wallet_ledger",
    objectId: entry.id,
    transportId: entry.transportId,
    reason: entry.reason,
    newState: entry.type,
    at: entry.at
  }));

  state.walletTransactions.forEach((entry) => addAudit({
    auditLogId: entry.audit_log_id || entry.auditLogId || entry.auditId,
    sourceId: entry.id,
    action: "WALLET_TRANSACTION_RECORDED",
    objectType: "wallet_transaction",
    objectId: entry.id,
    transportId: entry.transportId,
    reason: entry.reason,
    newState: entry.status,
    at: entry.at
  }));

  state.payments.forEach((entry) => addAudit({
    auditLogId: entry.audit_log_id || entry.auditLogId || entry.auditId,
    sourceId: entry.id,
    action: "PAYMENT_STATUS_RECORDED",
    objectType: "payment",
    objectId: entry.id,
    transportId: entry.transportId,
    reason: `demo payment ${entry.status}`,
    newState: entry.status,
    at: entry.updatedAt
  }));

  (state.escrowOperations || []).forEach((operation) => {
    addAudit({
      auditLogId: operation.audit_log_id || operation.auditLogId || operation.auditId,
      sourceId: operation.id,
      action: `ESCROW_${String(operation.operationType).toUpperCase()}_RECORDED`,
      objectType: "escrow_operation",
      objectId: operation.id,
      transportId: operation.transportId,
      reason: operation.reason,
      newState: operation.newState,
      at: operation.at
    });
    const escrow = state.escrows.find((item) => item.id === operation.escrowId);
    if (escrow) {
      escrow.auditIds ||= [];
      if (!escrow.auditIds.includes(operation.audit_log_id)) escrow.auditIds.push(operation.audit_log_id);
      escrow.lastAuditLogId = operation.auditLogId;
      escrow.lastAudit_log_id = operation.audit_log_id;
    }
  });

  state.invoices.forEach((entry) => addAudit({
    auditLogId: entry.audit_log_id || entry.auditLogId || entry.auditId,
    sourceId: entry.id,
    action: "INVOICE_RECORDED",
    objectType: "invoice",
    objectId: entry.id,
    transportId: entry.transportId,
    reason: entry.reason || `demo invoice ${entry.status}`,
    newState: entry.status,
    at: entry.issuedAt
  }));

  state.settlements.forEach((entry) => addAudit({
    auditLogId: entry.audit_log_id || entry.auditLogId || entry.auditId,
    sourceId: entry.id,
    action: "SETTLEMENT_RECORDED",
    objectType: "settlement",
    objectId: entry.id,
    transportId: entry.transportId,
    reason: `demo settlement ${entry.type}`,
    newState: entry.status,
    at: entry.createdAt
  }));

  state.revenueLedger.forEach((entry) => addAudit({
    auditLogId: entry.audit_log_id || entry.auditLogId || entry.auditId,
    sourceId: entry.id,
    action: "PLATFORM_FEE_RECORDED",
    objectType: "revenue",
    objectId: entry.id,
    transportId: entry.transportId,
    reason: entry.reason,
    newState: `${entry.amount} ${entry.currency}`,
    at: entry.at
  }));

  state.payouts.forEach((entry) => addAudit({
    auditLogId: entry.audit_log_id || entry.auditLogId || entry.auditId,
    sourceId: entry.id,
    action: "PAYOUT_RECORDED",
    objectType: "payout",
    objectId: entry.id,
    transportId: entry.transportId,
    reason: `demo payout ${entry.status}`,
    newState: entry.status,
    at: entry.createdAt
  }));

  state.disputes.forEach((entry) => addAudit({
    auditLogId: entry.audit_log_id || entry.auditLogId || entry.auditId,
    sourceId: entry.id,
    action: "DISPUTE_OPENED",
    objectType: "dispute",
    objectId: entry.id,
    transportId: entry.transportId,
    reason: entry.reason,
    newState: entry.status,
    at: entry.createdAt || baseTime
  }));

  state.disputeEvidencePacks.forEach((entry) => addAudit({
    auditLogId: entry.audit_log_id || entry.auditLogId || entry.auditId,
    sourceId: entry.id,
    action: "DISPUTE_EVIDENCE_PACK_CREATED",
    objectType: "dispute_evidence_pack",
    objectId: entry.id,
    transportId: entry.transportId,
    reason: "demo dispute evidence pack",
    newState: entry.locked ? "locked" : "open",
    at: entry.createdAt
  }));
}

function seedKnowledgeAuditRecords(state) {
  (state.knowledgeSources || []).forEach((source) => {
    const auditLogId = source.audit_log_id || source.auditLogId;
    if (!auditLogId || state.audit.some((row) => row.id === auditLogId || row.audit_log_id === auditLogId)) return;
    state.audit.unshift({
      id: auditLogId,
      audit_log_id: auditLogId,
      eventId: `knowledge-seed-${source.knowledge_source_id}`,
      at: source.created_at || baseTime,
      actorId: "seed",
      actorRole: "system",
      actorCompanyId: null,
      actorCompanyRole: null,
      actorContextType: "system",
      objectType: "knowledge_source",
      objectId: source.knowledge_source_id,
      transportId: null,
      action: "KNOWLEDGE_SOURCE_CREATED",
      requestedAction: "KNOWLEDGE_SOURCE_CREATED",
      result: "success",
      previousState: null,
      newState: source.status,
      device: "demo-seed",
      reason: `demo knowledge source: ${source.title}`,
      source: SourceTypes.SYSTEM,
      readOnly: true
    });
  });
}
