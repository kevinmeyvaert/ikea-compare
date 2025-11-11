export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[#0058A3] border-b-4 border-[#0058A3] pb-4 mb-6">
          Privacybeleid voor KOMPRÅRE Chrome-extensie
        </h1>
        <p className="text-gray-600 italic mb-8">Laatst bijgewerkt: november 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0058A3] mt-8 mb-4">1. Inleiding</h2>
          <p className="mb-4">
            KOMPRÅRE ("wij", "ons" of "de extensie") is een browserextensie die je helpt om IKEA-productprijzen te vergelijken
            in België, Nederland, Frankrijk en Duitsland. We zijn toegewijd aan het beschermen van je privacy en willen
            transparant zijn over de gegevens die we verzamelen en hoe we deze gebruiken.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0058A3] mt-8 mb-4">2. Welke gegevens we verzamelen</h2>
          <p className="mb-2">KOMPRÅRE verzamelt en bewaart de volgende informatie:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Winkelvoorkeuren:</strong> Je geselecteerde favoriete IKEA-winkels voor elk land (België, Nederland, Frankrijk, Duitsland)</li>
            <li><strong>Anoniem gebruikers-ID:</strong> Een willekeurig gegenereerde anonieme identificatie aangemaakt door Firebase Authentication</li>
            <li><strong>Gebruiksstatistieken:</strong> Informatie over welke producten je bekijkt en vergelijkt (product-ID's, tijdstempels)</li>
            <li><strong>Technische gegevens:</strong> Browsertype, extensieversie en foutlogs voor debugging-doeleinden</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0058A3] mt-8 mb-4">3. Hoe we je gegevens gebruiken</h2>
          <p className="mb-2">We gebruiken de verzamelde gegevens voor de volgende doeleinden:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Kernfunctionaliteit bieden:</strong> Je voorkeuren opslaan en gepersonaliseerde voorraadinformatie tonen</li>
            <li><strong>Synchroniseren tussen apparaten:</strong> Je winkelvoorkeuren gesynchroniseerd houden op alle apparaten waar je de extensie gebruikt</li>
            <li><strong>Service verbeteren:</strong> Gebruikspatronen analyseren om te begrijpen welke functies het meest waardevol zijn en verbeterpunten te identificeren</li>
            <li><strong>Problemen debuggen en oplossen:</strong> Foutlogs gebruiken om technische problemen te identificeren en op te lossen</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0058A3] mt-8 mb-4">4. Gegevensopslag en beveiliging</h2>
          <p className="mb-4">
            Je gegevens worden veilig opgeslagen met behulp van Google Firebase (Firestore en Firebase Authentication). Firebase is een beveiligd,
            toonaangevend cloudplatform dat gegevens versleutelt tijdens verzending en opslag. We implementeren passende technische en
            organisatorische maatregelen om je gegevens te beschermen tegen ongeautoriseerde toegang, wijziging, openbaarmaking of vernietiging.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0058A3] mt-8 mb-4">5. Gegevensdeling</h2>
          <p className="mb-2">We doen NIET het volgende:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Je persoonlijke gegevens verkopen aan derden</li>
            <li>Je gegevens delen met adverteerders</li>
            <li>Je gegevens gebruiken voor marketingdoeleinden</li>
            <li>Je gegevens delen met IKEA of andere commerciële entiteiten</li>
          </ul>
          <p className="mt-4">
            De enige derde partij die je gegevens verwerkt is Google Firebase, die optreedt als onze gegevensverwerker.
            Het privacybeleid van Firebase valt onder het privacybeleid van Google.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0058A3] mt-8 mb-4">6. Services van derden</h2>
          <p className="mb-2">KOMPRÅRE communiceert met de volgende services van derden:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>IKEA API:</strong> We halen productprijzen en voorraad op via de publieke API van IKEA. IKEA kan deze verzoeken loggen volgens hun eigen privacybeleid.</li>
            <li><strong>Google Firebase:</strong> Gebruikt voor gegevensopslag en anonieme authenticatie.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0058A3] mt-8 mb-4">7. Je rechten</h2>
          <p className="mb-2">Je hebt het recht om:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Toegang tot je gegevens:</strong> Een kopie opvragen van de gegevens die we over je bewaren</li>
            <li><strong>Je gegevens verwijderen:</strong> Verzoeken om verwijdering van je opgeslagen voorkeuren en gebruiksgegevens</li>
            <li><strong>Afmelden:</strong> De extensie op elk moment deïnstalleren om gegevensverzameling te stoppen</li>
          </ul>
          <p className="mt-4">
            Om een van deze rechten uit te oefenen, kun je de extensie deïnstalleren. Alle gegevens gekoppeld aan je anonieme
            gebruikers-ID blijven in onze database maar worden niet langer bijgewerkt. Als je wilt dat deze gegevens volledig
            worden verwijderd, neem dan contact met ons op (zie contactinformatie hieronder).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0058A3] mt-8 mb-4">8. Gegevensbewaring</h2>
          <p className="mb-4">
            We bewaren je gegevens zolang je de extensie geïnstalleerd hebt en actief gebruikt. Als je de extensie deïnstalleert,
            kunnen we geanonimiseerde gebruiksstatistieken bewaren voor analytische doeleinden, maar je persoonlijke
            winkelvoorkeuren worden niet langer bijgewerkt.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0058A3] mt-8 mb-4">9. Privacy van kinderen</h2>
          <p className="mb-4">
            KOMPRÅRE is niet gericht op kinderen jonger dan 16 jaar. We verzamelen niet bewust persoonlijke informatie
            van kinderen. Als je denkt dat we per ongeluk gegevens van een kind hebben verzameld, neem dan onmiddellijk contact met ons op.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0058A3] mt-8 mb-4">10. Wijzigingen in dit privacybeleid</h2>
          <p className="mb-4">
            We kunnen dit privacybeleid van tijd tot tijd bijwerken. Wanneer we dat doen, werken we de datum "Laatst bijgewerkt"
            bovenaan deze pagina bij. We raden je aan dit beleid regelmatig te bekijken. Voortgezet gebruik van de extensie
            na wijzigingen betekent dat je akkoord gaat met het bijgewerkte beleid.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0058A3] mt-8 mb-4">11. Juridische grondslag (AVG)</h2>
          <p className="mb-2">
            Voor gebruikers in de Europese Unie is onze juridische grondslag voor het verwerken van je gegevens:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Toestemming:</strong> Door de extensie te installeren en te gebruiken, stem je in met de gegevensverzameling zoals beschreven in dit beleid</li>
            <li><strong>Gerechtvaardigd belang:</strong> We hebben een gerechtvaardigd belang bij het verbeteren van onze service en het oplossen van technische problemen</li>
          </ul>
        </section>

        <section className="bg-gray-100 border-l-4 border-[#0058A3] p-6 mb-8">
          <h2 className="text-2xl font-semibold text-[#0058A3] mb-4">12. Contact</h2>
          <p className="mb-4">
            Als je vragen, zorgen of verzoeken hebt met betrekking tot dit privacybeleid of je gegevens,
            neem dan contact met ons op via GitHub.
          </p>
        </section>
      </div>
    </div>
  );
}
