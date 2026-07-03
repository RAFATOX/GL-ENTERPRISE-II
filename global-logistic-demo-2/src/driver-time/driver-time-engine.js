import { EventTypes } from "../core/constants.js";
import { createId, nowIso } from "../core/id.js";

export class DriverTimeEngine {
  constructor(state) {
    this.state = state;
  }

  get(driverId) {
    return this.state.driverTime.find((record) => record.driverId === driverId) || null;
  }

  canAssign(driverId) {
    const record = this.get(driverId);
    if (!record) {
      return { ok: false, reason: "driver time profile missing" };
    }
    if (!record.legalToComplete) {
      return { ok: false, reason: "driver would violate legal working time" };
    }
    if (record.remainingLegalHours < 1.5) {
      return { ok: false, reason: "remaining legal driving time too low" };
    }
    return { ok: true, reason: "driver time legal for demo assignment" };
  }

  dashboardFor(actor = {}, selectedTransportId = null, visibleState = this.state) {
    const state = visibleState || this.state;
    const transport = selectedTransportId
      ? (state.transports || []).find((item) => item.id === selectedTransportId)
      : null;
    const driverId = actor.role === "driver"
      ? actor.userId
      : transport?.driverId || (state.driverTime || [])[0]?.driverId || actor.userId;
    const record = (state.driverTime || []).find((item) => item.driverId === driverId) || null;
    const driver = (state.users || []).find((item) => item.id === driverId) || null;
    const tachograph = latestTachograph(state, driverId);
    const parking = nearestParking(state);
    const drivingToday = Number(record?.drivingHoursToday || 0);
    const breakHours = Number(record?.breakHours || 0);
    const remainingLegal = Number(record?.remainingLegalHours || 0);
    const continuousElapsed = clamp(drivingToday - Math.min(breakHours, 0.75), 0, 4.5);
    const continuousRemaining = Math.max(0, Math.min(4.5 - continuousElapsed, remainingLegal));
    const dailyRemaining9 = Math.max(0, 9 - drivingToday);
    const dailyRemaining10 = Math.max(0, 10 - drivingToday);
    const extensionUsed = drivingToday > 9;
    const weeklyUsed = clamp(drivingToday + 31.5, 0, 56);
    const weekTwoUsed = clamp(drivingToday + 23.25, 0, 44);
    const biWeeklyTotal = Math.min(90, weeklyUsed + weekTwoUsed);
    const otherWork = Number((Math.max(0.75, drivingToday * 0.28) + 0.5).toFixed(2));
    const shiftDuration = clamp(drivingToday + otherWork + Math.min(breakHours, 1), 0, 15);
    const maxShift = 13;
    const shiftRemaining = Math.max(0, maxShift - shiftDuration);
    const weeklyWork = clamp(weeklyUsed + 8.75, 0, 60);
    const canReachDestination = Boolean(record?.legalToComplete && remainingLegal >= estimatedRouteHours(transport));
    const legalLevel = legalTone(record, continuousRemaining, dailyRemaining9, shiftRemaining);
    const breakCountdown = Math.max(0, 0.75 - breakHours);

    return {
      driverId,
      driverName: driver?.name || actor.name || "Kierowca",
      transportNumber: transport?.number || null,
      status: record?.legalToComplete ? "Gotowy do jazdy" : "Ryzyko naruszenia",
      currentActivity: currentActivity(record, transport),
      activityTone: legalLevel,
      localTimeLabel: "Czas lokalny",
      utcTimeLabel: "UTC",
      connections: {
        ddd: tachograph ? "polaczony" : "brak pliku",
        card: tachograph ? "karta aktywna" : "karta niezsynchronizowana",
        gps: transport ? "GPS aktywny" : "GPS oczekuje",
        sync: tachograph?.status === "violation" ? "wymaga kontroli" : "zsynchronizowano"
      },
      driving: {
        continuous: timerBlock("Jazda ciagla", continuousElapsed, continuousRemaining, 4.5, legalLevel),
        daily: {
          used: drivingToday,
          remaining9: dailyRemaining9,
          remaining10: dailyRemaining10,
          extensionUsed,
          extensionRemaining: extensionUsed ? 0 : Math.max(0, 10 - Math.max(9, drivingToday)),
          tone: toneForRemaining(dailyRemaining9, 2, 1)
        },
        weekly: {
          limit: 56,
          used: weeklyUsed,
          remaining: Math.max(0, 56 - weeklyUsed),
          tone: toneForRemaining(56 - weeklyUsed, 8, 3)
        },
        biweekly: {
          limit: 90,
          week1: weeklyUsed,
          week2: weekTwoUsed,
          total: biWeeklyTotal,
          remaining: Math.max(0, 90 - biWeeklyTotal),
          tone: toneForRemaining(90 - biWeeklyTotal, 12, 5)
        },
        shift: {
          current: shiftDuration,
          max: maxShift,
          remaining: shiftRemaining,
          tone: toneForRemaining(shiftRemaining, 2, 1)
        },
        nextBreakIn: continuousRemaining,
        breakCountdown
      },
      otherWork: {
        current: otherWork,
        shift: shiftDuration,
        weekly: weeklyWork,
        ratioDriving: ratio(drivingToday, drivingToday + otherWork),
        ratioOther: ratio(otherWork, drivingToday + otherWork),
        tone: toneForRemaining(60 - weeklyWork, 8, 3)
      },
      rest: {
        currentBreak: breakHours,
        break45Remaining: breakCountdown,
        split15: Math.min(15, Math.round(breakHours * 60)),
        split30: Math.max(0, Math.min(30, Math.round(breakHours * 60) - 15)),
        dailyRest: 11,
        reducedDailyAvailable: record?.ferryRailAllowance ? 2 : 1,
        regularDailyRest: 11,
        weeklyRest: 45,
        reducedWeeklyRest: 24,
        compensationRequired: record?.legalToComplete ? "brak" : "wymagana kontrola"
      },
      availability: {
        timer: Math.max(0, shiftRemaining + 1.5),
        shift: shiftDuration,
        weeklyWorkingTime: weeklyWork,
        tone: toneForRemaining(60 - weeklyWork, 8, 3)
      },
      route: {
        canReachDestination,
        reason: canReachDestination
          ? "Mozesz bezpiecznie kontynuowac aktualny plan."
          : "Plan moze naruszyc limit czasu jazdy lub zmiany.",
        estimatedDriving: estimatedRouteHours(transport)
      },
      parking,
      tachograph: {
        importDate: tachograph?.importedAt || null,
        driverCardDate: tachograph?.cardDate || tachograph?.importedAt || null,
        newestActivity: tachograph ? `${tachograph.drivingHours}h jazdy / ${tachograph.breakHours}h pauzy` : "brak importu",
        status: tachograph?.status || "missing"
      },
      legal: {
        eu561: record?.legalToComplete ? "OK" : "naruszenie",
        aetr: "monitorowane",
        nationalExceptions: record?.ferryRailAllowance ? "tryb prom/kolej" : "brak",
        doubleCrew: transport?.doubleCrew ? "aktywna" : "nieaktywna",
        ferryMode: record?.ferryRailAllowance ? "aktywny" : "gotowy",
        trainMode: record?.ferryRailAllowance ? "aktywny" : "gotowy"
      },
      assistant: assistantMessages({
        record,
        continuousRemaining,
        parking,
        canReachDestination,
        transport,
        extensionUsed
      }),
      notifications: notificationsFor(record, continuousRemaining, dailyRemaining9, shiftRemaining, tachograph, parking)
    };
  }

  importDdd(actor = {}, payload = {}) {
    const driverId = payload.driverId || actor.userId;
    const record = this.get(driverId);
    const id = createId("ddd");
    const importRow = {
      id,
      driverId,
      source: "DDD",
      status: record?.legalToComplete === false ? "violation" : "ok",
      drivingHours: Number(record?.drivingHoursToday || payload.drivingHours || 0),
      breakHours: Number(record?.breakHours || payload.breakHours || 0),
      importedAt: nowIso(),
      cardDate: nowIso()
    };
    this.state.tachographImports.unshift(importRow);
    return {
      importRow,
      events: [{
        type: EventTypes.TACHOGRAPH_IMPORTED,
        objectType: "driver_time",
        objectId: driverId,
        previousState: "ddd_pending",
        newState: importRow.status,
        reason: "DDD import demo zapisany w Driver Time Engine"
      }]
    };
  }

  startBreak(driverId) {
    const record = this.get(driverId);
    if (record) {
      record.breakHours += 0.75;
      record.drivingHoursToday = Math.max(0, record.drivingHoursToday - 0.75);
      record.remainingLegalHours += 0.75;
      record.legalToComplete = record.remainingLegalHours >= 1.5;
    }
  }

  recordFerryRest(driverId, hours = 1.5) {
    const record = this.get(driverId);
    if (record) {
      record.breakHours += hours;
      record.drivingHoursToday = Math.max(0, record.drivingHoursToday - hours);
      record.remainingLegalHours += hours;
      record.legalToComplete = record.remainingLegalHours >= 1.5;
      record.ferryRailAllowance = true;
    }
  }
}

function timerBlock(label, elapsed, remaining, limit, tone) {
  return {
    label,
    elapsed,
    remaining,
    limit,
    progress: limit ? clamp(elapsed / limit, 0, 1) : 0,
    tone
  };
}

function latestTachograph(state, driverId) {
  return (state.tachographImports || [])
    .filter((item) => item.driverId === driverId)
    .slice()
    .sort((left, right) => String(right.importedAt || "").localeCompare(String(left.importedAt || "")))[0] || null;
}

function nearestParking(state) {
  return (state.parking || [])
    .slice()
    .sort((left, right) => (right.freeSpaces || 0) - (left.freeSpaces || 0) || (right.rating || 0) - (left.rating || 0))[0] || null;
}

function currentActivity(record, transport) {
  if (!record) return "Brak danych tacho";
  if (transport?.status === "parking_break") return "Pauza";
  if (record.remainingLegalHours <= 1) return "Jazda - limit blisko";
  return "Jazda";
}

function legalTone(record, continuousRemaining, dailyRemaining, shiftRemaining) {
  if (!record || !record.legalToComplete || continuousRemaining <= 0 || dailyRemaining <= 0 || shiftRemaining <= 0) return "red";
  if (continuousRemaining <= 0.5 || dailyRemaining <= 0.75 || shiftRemaining <= 0.75) return "orange";
  if (continuousRemaining <= 1 || dailyRemaining <= 1.5 || shiftRemaining <= 1.5) return "yellow";
  return "green";
}

function toneForRemaining(value, warning, danger) {
  if (value <= 0) return "red";
  if (value <= danger) return "orange";
  if (value <= warning) return "yellow";
  return "green";
}

function estimatedRouteHours(transport) {
  if (!transport) return 1.5;
  if (transport.eta) return 2.25;
  return 1.5;
}

function assistantMessages({ record, continuousRemaining, parking, canReachDestination, transport, extensionUsed }) {
  const messages = [];
  if (!record?.legalToComplete) messages.push("Aktualny plan narusza rozporzadzenie 561/2006.");
  if (continuousRemaining <= 0.75) messages.push(`Zatrzymaj sie w ciagu ${Math.max(1, Math.round(continuousRemaining * 60))} minut.`);
  else messages.push(`Mozesz jechac jeszcze ${formatHours(continuousRemaining)} bez przerwy.`);
  if (parking) messages.push(`Najblizszy bezpieczny parking: ${parking.name}, ${parking.freeSpaces} wolnych miejsc.`);
  if (!canReachDestination) messages.push("Nie dojedziesz legalnie do celu bez przerwy.");
  if (!extensionUsed) messages.push("Masz jeszcze dostepne rozszerzenie jazdy do 10h.");
  if (transport) messages.push("GL porownuje ETA, GPS i czas pracy kierowcy dla tego transportu.");
  return messages.slice(0, 5);
}

function notificationsFor(record, continuousRemaining, dailyRemaining, shiftRemaining, tachograph, parking) {
  const notifications = [];
  if (!tachograph) notifications.push({ title: "Brak DDD", tone: "orange", body: "Wykonaj import danych z karty kierowcy." });
  if (continuousRemaining <= 0.75) notifications.push({ title: "Przerwa wymagana", tone: "red", body: "Zaplanowana pauza 45 minut." });
  if (shiftRemaining <= 1) notifications.push({ title: "Koniec zmiany", tone: "orange", body: "Zbliza sie limit zmiany." });
  if (dailyRemaining <= 1.5) notifications.push({ title: "Limit dzienny", tone: "yellow", body: "Dzienny limit jazdy jest blisko." });
  if (parking) notifications.push({ title: "Parking rekomendowany", tone: "green", body: `${parking.name}: ${parking.freeSpaces} wolnych miejsc.` });
  if (record && !record.legalToComplete) notifications.push({ title: "Naruszenie", tone: "red", body: "Kontrol Agent blokuje ryzykowny plan." });
  return notifications;
}

function ratio(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function formatHours(hours) {
  const totalMinutes = Math.round(Math.max(0, Number(hours) || 0) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (!h) return `${m}m`;
  return `${h}h ${m}m`;
}
