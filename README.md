# GL Enterprise Public Demo

Repozytorium zawiera publiczne demo GL Enterprise w folderze `global-logistic-demo-2`.

Technologia projektu:

- statyczny frontend HTML/CSS/JavaScript ES modules,
- lokalny serwer developerski Node.js,
- brak React, Next.js i Vite,
- deploy przez GitHub Pages z artefaktu `global-logistic-demo-2/dist`.

## Publiczny link demo

Docelowy publiczny link demo dla repozytorium `RAFATOX/GL-ENTERPRISE-II`:

```text
https://rafatox.github.io/GL-ENTERPRISE-II/
```

Link zacznie odpowiadac po wypchnieciu kodu do repozytorium i wlaczeniu GitHub Pages przez GitHub Actions.

GitHub pokazuje finalny adres w:

```text
GitHub -> repozytorium -> Actions -> Deploy GL Enterprise Demo to GitHub Pages -> deploy -> page_url
```

oraz w:

```text
GitHub -> repozytorium -> Settings -> Pages
```

Jesli adres `https://rafatox.github.io/GL-ENTERPRISE-II/` zwraca `404`, oznacza to, ze GitHub Pages nie opublikowal jeszcze artefaktu. Najczestsze przyczyny:

- repozytorium nie jest publiczne albo nie istnieje pod nazwa `RAFATOX/GL-ENTERPRISE-II`,
- pliki nie zostaly jeszcze wypchniete do repozytorium,
- w `Settings -> Pages` nie ustawiono `Source: GitHub Actions`,
- workflow `Deploy GL Enterprise Demo to GitHub Pages` nie zostal uruchomiony albo zakonczyl sie bledem.

## Uruchomienie lokalne

```powershell
cd global-logistic-demo-2
npm start
```

Adres lokalny:

```text
http://127.0.0.1:4288/
```

## Build statyczny

```powershell
cd global-logistic-demo-2
npm run build
```

Wynik builda trafia do:

```text
global-logistic-demo-2/dist
```

## Testy

```powershell
cd global-logistic-demo-2
npm test
```

W aplikacji jest tez widok `System Tests`, ktory pokazuje checklist stabilnosci demo. Globalny przycisk `Reset demo data` czysci stan demo z `localStorage` i przywraca dane startowe.

## Deploy przez GitHub

1. Upewnij sie, ze repozytorium `RAFATOX/GL-ENTERPRISE-II` jest utworzone i publiczne albo ze masz do niego dostep.
2. Wypchnij ten folder roboczy do repozytorium.
3. Wejdz w `Settings -> Pages`.
4. W sekcji `Build and deployment` ustaw `Source: GitHub Actions`.
5. Wejdz w `Actions`.
6. Uruchom workflow `Deploy GL Enterprise Demo to GitHub Pages` albo zrob push na `main`/`master`.
7. Skopiuj link HTTPS pokazany w zakladce `Pages` albo w wyniku workflow.

Przykladowe komendy dla pierwszego wypchniecia:

```powershell
cd C:\Users\CEM\OneDrive\Dokumenty\jarvis
git add .
git commit -m "Prepare GL Enterprise public demo"
git branch -M main
git remote add origin https://github.com/RAFATOX/GL-ENTERPRISE-II.git
git push -u origin main
```

## Dane testowe

Dane demonstracyjne sa w:

```text
global-logistic-demo-2/src/core/demo-data.js
```

Po zmianie danych testowych odswiez demo. Jezeli przegladarka trzyma stary stan lokalny, wyczysc dane strony albo `localStorage` dla adresu demo.
