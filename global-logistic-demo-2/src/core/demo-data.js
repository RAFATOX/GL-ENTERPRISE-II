import {
  AccountStatuses,
  AuthoritySubtypes,
  PaymentStatuses,
  Roles,
  SourceTypes,
  TransportStatuses
} from "./constants.js";

const baseTime = "2026-05-27T07:00:00.000Z";

export function createDemoState() {
  const state = {
    schemaVersion: 5,
    revision: 1,
    session: {
      userId: "u-platform",
      role: Roles.PLATFORM_OWNER,
      language: "pl",
      view: "dashboard",
      selectedTransportId: "tr-1001",
      lastResult: null
    },
    users: [
      user("u-platform", "Ewa Core", "+48500100100", Roles.PLATFORM_OWNER, null, AccountStatuses.VERIFIED),
      user("u-super", "Adam Super", "+48500100101", Roles.SUPER_ADMIN, null, AccountStatuses.VERIFIED),
      user("u-admin", "Marta Admin", "+48500100102", Roles.ADMIN, null, AccountStatuses.VERIFIED),
      user("u-client-owner", "Jan Client", "+48500100103", Roles.CLIENT_OWNER, "co-client-a", AccountStatuses.VERIFIED),
      user("u-client-dispatcher", "Olga Dispatcher", "+48500100104", Roles.CLIENT_DISPATCHER, "co-client-a", AccountStatuses.VERIFIED),
      user("u-warehouse", "Pawel Warehouse", "+48500100105", Roles.WAREHOUSE_WORKER, "co-client-b", AccountStatuses.VERIFIED),
      user("u-carrier-owner", "Kamil Carrier", "+48500100106", Roles.CARRIER_OWNER, "co-carrier-a", AccountStatuses.VERIFIED),
      user("u-carrier-dispatcher", "Nina CarrierOps", "+48500100107", Roles.CARRIER_DISPATCHER, "co-carrier-a", AccountStatuses.VERIFIED),
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
      user("u-support", "Sara Support", "+48500100116", Roles.SUPPORT_AGENT, null, AccountStatuses.VERIFIED),
      user("u-auditor", "Igor Auditor", "+48500100117", Roles.READONLY_AUDITOR, null, AccountStatuses.VERIFIED),
      user("u-demo-pending", "New Pending", "+48500100999", Roles.CLIENT_DISPATCHER, "co-client-c", AccountStatuses.PENDING, { documentVerified: false, faceVerified: false })
    ],
    companies: [
      company("co-client-a", "Nord Market BV", "client", 93, ["u-client-owner", "u-client-dispatcher"], AccountStatuses.VERIFIED),
      company("co-client-b", "Mazovia Med", "client", 88, ["u-warehouse"], AccountStatuses.VERIFIED),
      company("co-client-c", "Casa Verde", "client", 79, ["u-demo-pending"], AccountStatuses.PENDING),
      company("co-carrier-a", "Baltic Line", "carrier", 96, ["u-carrier-owner", "u-carrier-dispatcher", "u-driver-1", "u-driver-4"], AccountStatuses.VERIFIED),
      company("co-carrier-b", "Cold Link", "carrier", 91, ["u-driver-2", "u-driver-5"], AccountStatuses.VERIFIED),
      company("co-carrier-c", "Oder Freight", "carrier", 61, ["u-driver-3", "u-driver-6"], AccountStatuses.VERIFIED),
      company("co-insurance-a", "ShieldCargo Insurance", "insurance", 94, ["u-insurance"], AccountStatuses.VERIFIED),
      company("co-payment-a", "DemoPay Operator", "payment", 99, ["u-payment"], AccountStatuses.VERIFIED),
      company("co-security-a", "GatePoint Security", "security", 89, ["u-security"], AccountStatuses.VERIFIED),
      company("co-customs-a", "Baltic Customs Agency", "customs_agent", 90, ["u-customs"], AccountStatuses.VERIFIED),
      company("co-authority-police", "Policja Drogowa", "authority", 100, ["u-authority-police"], AccountStatuses.VERIFIED),
      company("co-authority-itd", "Inspekcja Transportu Drogowego", "authority", 100, ["u-authority-itd"], AccountStatuses.VERIFIED),
      company("co-ferry-dfds", "DFDS Ferry", "ferry_operator", 92, ["u-ferry"], AccountStatuses.VERIFIED),
      company("co-rail-terminal", "EuroRail Terminal", "rail_operator", 86, ["u-rail"], AccountStatuses.VERIFIED),
      company("co-workshop-a", "TruckFix Warsztat", "workshop", 88, ["u-workshop"], AccountStatuses.VERIFIED),
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
    wallets: [
      wallet("wal-client-a", "co-client-a", 52000, 4280),
      wallet("wal-client-b", "co-client-b", 18000, 11200),
      wallet("wal-client-c", "co-client-c", 7600, 3650),
      wallet("wal-carrier-a", "co-carrier-a", 9400, 0),
      wallet("wal-carrier-b", "co-carrier-b", 6800, 0),
      wallet("wal-carrier-c", "co-carrier-c", 2100, 0),
      wallet("wal-customs-a", "co-customs-a", 1200, 0),
      wallet("wal-ferry-dfds", "co-ferry-dfds", 5200, 0),
      wallet("wal-workshop-a", "co-workshop-a", 2400, 0),
      wallet("wal-mobile-service-a", "co-mobile-service-a", 3100, 0),
      wallet("wal-roadside-a", "co-roadside-a", 900, 0),
      wallet("wal-platform", "platform", 0, 0)
    ],
    walletLedger: [
      ledger("led-1", "wal-client-a", "tr-1001", "hold", -4280, "escrow reserved for GL2-1001"),
      ledger("led-2", "wal-client-b", "tr-1002", "hold", -11200, "escrow blocked for GL2-1002"),
      ledger("led-3", "wal-client-c", "tr-1004", "hold", -3650, "escrow blocked for GL2-1004"),
      ledger("led-6", "wal-ferry-dfds", "tr-1006", "credit", 430, "symulowana platnosc za prom Calais-Dover"),
      ledger("led-7", "wal-customs-a", "tr-1001", "credit", 180, "opłata za odprawę celną MRN-GL2-1001"),
      ledger("led-8", "wal-mobile-service-a", "tr-1001", "credit", 280, "opłata za serwis techniczny srv-1")
    ],
    escrows: [
      escrow("esc-1", "tr-1001", "co-client-a", "co-carrier-a", 4280, "reserved"),
      escrow("esc-2", "tr-1002", "co-client-b", "co-carrier-b", 11200, "blocked"),
      escrow("esc-4", "tr-1004", "co-client-c", "co-carrier-a", 3650, "blocked"),
      escrow("esc-6", "tr-1006", "co-client-a", "co-carrier-a", 5100, "reserved")
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
        createdBy: "u-client-owner"
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
    companyComplianceEntries: [],
    serviceProviders: [
      serviceProvider("srvprov-1", "co-workshop-a", "TruckFix Warsztat", "workshop", 52.21, 16.91, 45, 320),
      serviceProvider("srvprov-2", "co-mobile-service-a", "MobileTruck Serwis", "mobile_service", 52.12, 18.86, 25, 280),
      serviceProvider("srvprov-3", "co-roadside-a", "RoadHelp 24", "roadside_assistance", 52.03, 18.97, 35, 420)
    ],
    serviceRequests: [
      serviceRequest("srv-1", "tr-1001", "vh-1", "u-driver-1", "co-carrier-a", "co-mobile-service-a", "mobile_service", "awaria opony", "accepted", 25, 280, "2026-05-27T13:40:00.000Z")
    ],
    servicePayments: [
      servicePayment("spay-1", "srv-1", "tr-1001", "co-mobile-service-a", 280, "simulated_paid")
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

  seedEvents(state);
  return state;
}

function user(id, name, phone, primaryRole, companyId, accountStatus, options = {}) {
  return {
    id,
    name,
    phone,
    language: "pl",
    companyId,
    roles: [primaryRole],
    accountStatus,
    documentVerified: options.documentVerified ?? true,
    faceVerified: options.faceVerified ?? true,
    documentsValid: options.documentsValid ?? true,
    driverTimeLegal: options.driverTimeLegal ?? true,
    authoritySubtype: options.authoritySubtype || null,
    recoveryEnabled: true,
    previousPhones: []
  };
}

function company(id, name, type, trustScore, people, status) {
  return {
    id,
    name,
    type,
    trustScore,
    status,
    people,
    ownerUserIds: people.slice(0, 1)
  };
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
  return { id, transportId, status, amount, currency: "EUR", updatedAt: baseTime };
}

function wallet(id, ownerCompanyId, balance, heldBalance) {
  return {
    id,
    ownerType: ownerCompanyId === "platform" ? "platform" : "company",
    ownerCompanyId,
    currency: "EUR",
    balance,
    heldBalance,
    status: "demo_only"
  };
}

function ledger(id, walletId, transportId, type, amount, reason) {
  return {
    id,
    walletId,
    transportId,
    type,
    amount,
    currency: "EUR",
    reason,
    at: baseTime
  };
}

function escrow(id, transportId, payerCompanyId, payeeCompanyId, amount, status) {
  return {
    id,
    transportId,
    payerCompanyId,
    payeeCompanyId,
    amount,
    currency: "EUR",
    status,
    createdAt: baseTime,
    releasedAt: null
  };
}

function revenue(id, transportId, type, amount, reason) {
  return {
    id,
    transportId,
    type,
    amount,
    currency: "EUR",
    reason,
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
  return {
    id,
    disputeId,
    transportId,
    photoIds,
    documentIds,
    messageIds,
    createdAt: baseTime,
    locked: true
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
