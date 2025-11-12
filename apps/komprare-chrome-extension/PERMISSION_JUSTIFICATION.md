# Permission Justification voor Chrome Web Store

## Host Permissions

### 1. `https://www.ikea.com/*`

**Waarom nodig:**

- De extensie moet IKEA productpagina's kunnen detecteren in België, Nederland, Frankrijk en Duitsland
- Content script wordt geïnjecteerd om het prijsvergelijkingswidget te tonen op IKEA productpagina's
- Zonder deze permission kan de extensie niet functioneren op ikea.com

**Wat doet de extensie:**

- Detecteert IKEA product URLs (bijv. ikea.com/be/nl/p/billy-boekenkast-00263850/)
- Haalt productcode uit de URL
- Toont prijsvergelijkingswidget op de pagina

### 2. `https://api.ingka.ikea.com/*`

**Waarom nodig:**

- IKEA's officiële API voor voorraadchecks
- Gebruikt door de ikea-availability-checker package
- Toont real-time voorraad per winkel

**Wat doet de extensie:**

- Vraagt voorraad op voor geselecteerde winkels
- Toont voorraadstatus (HIGH_IN_STOCK, LOW_IN_STOCK, OUT_OF_STOCK)
- Geen data wordt weggeschreven of gewijzigd

### 3. `https://*.firebaseio.com/*` en `https://*.googleapis.com/*` en `https://firestore.googleapis.com/*`

**Waarom nodig:**

- Firebase Authentication voor anonieme gebruikers identificatie
- Firestore Database voor het opslaan van gebruikersvoorkeuren
- Cross-device synchronisatie van favoriete winkels

**Wat doet de extensie:**

- Slaat geselecteerde favoriete winkels op per land
- Synchroniseert voorkeuren tussen apparaten
- Anonieme authenticatie (geen persoonlijke data verzameld)

## Storage Permission

**Waarom nodig:**

- Lokale opslag van gebruikersvoorkeuren
- Caching van recent bekeken producten
- Fallback als Firebase niet beschikbaar is

**Wat wordt opgeslagen:**

- Geselecteerde winkels per land (BE, NL, FR, DE)
- Recent bekeken productcodes
- UI-voorkeuren (thema, taal)

## Content Scripts

**Matches:**

```json
["https://www.ikea.com/be/*/p/*", "https://www.ikea.com/nl/*/p/*", "https://www.ikea.com/fr/*/p/*", "https://www.ikea.com/de/*/p/*"]
```

**Waarom deze specifieke patterns:**

- Alleen actief op IKEA productpagina's (URLs die `/p/` bevatten)
- Niet actief op andere IKEA-pagina's (homepage, categorieën, etc.)
- Minimalistische approach: alleen waar nodig

**Wat doet het content script:**

- Leest productcode uit URL
- Injecteert prijsvergelijkingswidget in de pagina
- Communiceert met background service worker voor API calls

## Web Accessible Resources

**Resources:** `assets/logo.png`

**Waarom nodig:**

- Logo moet zichtbaar zijn in het geïnjecteerde widget
- Chrome vereist dat assets expliciet toegankelijk zijn gemaakt

## Privacy Statement

**Geen tracking of analytics:**

- Geen Google Analytics of andere tracking tools
- Geen data verkocht aan derden
- Geen advertenties

**Wel verzameld (anoniem):**

- Aantal keer dat extensie gebruikt wordt (anonieme counters)
- Populairste producten (productcodes zonder gebruikersidentificatie)
- Totale besparingen (voor statistieken op website)

**Gebruikersdata:**

- Alleen opgeslagen: geselecteerde winkels per land
- Opgeslagen lokaal + Firebase (optioneel, voor sync)
- Kan volledig verwijderd worden via extensie-instellingen

## Single Purpose

**De extensie heeft één duidelijk doel:**
"IKEA prijzen vergelijken tussen België, Nederland, Frankrijk en Duitsland, en voorraad checken voor geselecteerde winkels."

**Functionaliteit:**

1. Prijsvergelijking tussen 4 landen
2. Voorraadcheck voor specifieke winkels
3. Direct navigeren naar productpagina in ander land

**Geen extra functionaliteit:**

- Geen social media integratie
- Geen data export naar derden
- Geen advertenties of affiliate links
- Geen unrelated features

## Voor Chrome Web Store Review

**Permissions Breakdown:**

| Permission           | Justification                                     | User Benefit                                     |
| -------------------- | ------------------------------------------------- | ------------------------------------------------ |
| `ikea.com`           | Detect product pages and inject comparison widget | See prices across countries                      |
| `api.ingka.ikea.com` | Check real-time stock availability                | Know if product is in stock before visiting      |
| Firebase domains     | Store user preferences and sync across devices    | Don't need to select stores again on each device |
| `storage`            | Cache preferences locally                         | Extension works offline, faster load times       |

## Alternatief zonder Firebase (optioneel)

Als Chrome Web Store team bezwaar heeft tegen Firebase permissions, kan de extensie functioneren met alleen `storage` permission:

- Geen cross-device sync
- Alleen lokale opslag
- Gebruiker moet winkels per apparaat instellen

Dit zou echter de user experience verslechteren, omdat:

- Desktop en mobiel niet gesynchroniseerd zijn
- Bij extensie herinstallatie data verloren gaat
- Geen backup van voorkeuren
