# Global Logistic GL Enterprise II

Publiczne demo operacyjne GL Enterprise. Projekt jest statyczna aplikacja HTML/CSS/JavaScript ES modules z lokalnym serwerem Node.js do testow developerskich. To nie jest React, Next.js ani Vite.

Demo 2 zbudowane od poczatku wokol jednego trwalego rdzenia:

`GL CORE ENGINE`

Frontend nie trzyma regulek biznesowych. Przyciski wysylaja akcje do rdzenia, a rdzen wykonuje:

`USER ACTION -> PERMISSION CHECK -> VALIDATION -> WORKFLOW ENGINE -> EVENT BUS -> AUDIT LOG -> UI UPDATE`

## Uruchomienie

Mozesz kliknac:

```text
start-gl-2.cmd
```

Albo uruchomic z terminala:

```powershell
npm start
```

Adres lokalny:

```text
http://127.0.0.1:4288/
```

## Build

Build przygotowuje czysta wersje statyczna do publikacji:

```powershell
npm run build
```

Wynik:

```text
dist/
```

## Testy

```powershell
npm test
```

Zakres testow obejmuje permissions, blokady workflow, pusty `selectedTransport`, reset `localStorage` i bledny payload. W UI jest widok `System Tests` z checklist PASS / FAIL oraz widoczny przycisk `Reset demo data`.

## Publiczne demo HTTPS

Projekt jest przygotowany pod GitHub Pages przez workflow:

```text
../.github/workflows/gl-enterprise-demo-pages.yml
```

Docelowy publiczny link demo dla repozytorium `RAFATOX/GL-ENTERPRISE-II`:

```text
https://rafatox.github.io/GL-ENTERPRISE-II/
```

W GitHub kliknij:

```text
Settings -> Pages -> Source: GitHub Actions
Actions -> Deploy GL Enterprise Demo to GitHub Pages
```

Finalny link HTTPS bedzie widoczny w `Settings -> Pages` oraz w wyniku workflow jako `page_url`.

Jesli link zwraca `404`, sprawdz w GitHub:

```text
Settings -> Pages -> Source: GitHub Actions
Actions -> Deploy GL Enterprise Demo to GitHub Pages
```

Repozytorium musi istniec jako `RAFATOX/GL-ENTERPRISE-II`, a workflow musi zakonczyc sie statusem zielonym.

## Dane testowe

Glowne dane demo sa w:

```text
src/core/demo-data.js
```

Po zmianie danych odswiez przegladarke. Jesli widzisz stary stan, wyczysc dane strony albo `localStorage` dla lokalnego lub publicznego adresu demo.

## Zakres GL 2

- 21 rol systemowych z osobnymi permission sets, w tym SECURITY, CUSTOMS, AUTHORITY, FERRY, RAIL i SERWIS,
- modularny rdzen business logic w `src/`,
- workflow transportu, statusy, walidacje i blokady,
- event bus i audit log tylko do odczytu,
- GPS, dokumenty, zdjecia, platnosci, wallet, escrow, revenue, ubezpieczenia, trust score,
- shipment_id, digital CMR, dispute evidence pack, plate-to-driver contact,
- parking live network, driver time, compliance, jobs, communication, translation, security gate,
- prom/intermodal: rezerwacja DFDS, statusy promowe, bilet, ETA, odpoczynek kierowcy i platnosc demo,
- clo i kontrola drogowa: dokumenty celne, historia kontroli organu, ograniczony dostep bez portfeli i escrow,
- serwis techniczny: warsztat, serwis mobilny, pomoc drogowa, ETA, dokument, koszt demo i reputacja,
- API, integrations, region rules, resilience checks, AI Control Agent i powiadomienia,
- 6 transportow, 3 klientow, 3 przewoznikow, 6 kierowcow i 4 parkingi w danych demo,
- lokalny zapis stanu w przegladarce.

Nie ma prawdziwych platnosci, GPS, OCR tablic, polis ani integracji bankowych.

## Struktura

```text
src/
  core/
  auth/
  authority/
  customs/
  users/
  companies/
  transports/
  ferry/
  service/
  workflow/
  events/
  audit/
  gps/
  api/
  integrations/
  global-expansion/
  documents/
  photos/
  shipments/
  wallets/
  escrow/
  revenue/
  payments/
  disputes/
  cmr/
  insurance/
  trust/
  parking/
  driver-time/
  compliance/
  jobs/
  communication/
  translation/
  plate-to-driver/
  security/
  resilience/
  ai-control/
  notifications/
  permissions/
  ui/
```

Najwazniejszy plik orkiestrujacy:

```text
src/core/gl-core-engine.js
```

Mapa pokrycia pelnej specyfikacji:

```text
docs/GL_ENTERPRISE_COVERAGE.md
```
