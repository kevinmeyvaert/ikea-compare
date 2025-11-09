const axios = require('axios');
const cheerio = require('cheerio');

async function testScrape() {
  const productId = '39581130';
  const url = `https://www.ikea.com/nl/nl/p/${productId}/`;

  console.log('Testing updated extraction logic...\n');

  console.log('Fetching:', url);

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      timeout: 10000,
    });

    console.log('Status:', response.status);
    const $ = cheerio.load(response.data);

    // Look for JSON-LD
    console.log('\n=== Checking JSON-LD ===');
    $('script[type="application/ld+json"]').each((i, element) => {
      try {
        const jsonData = JSON.parse($(element).html() || '');
        console.log(`JSON-LD ${i}:`, JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Failed to parse JSON-LD');
      }
    });

    // Look for utag_data
    console.log('\n=== Checking utag_data ===');
    $('script').each((i, element) => {
      const scriptContent = $(element).html() || '';
      if (scriptContent.includes('utag_data')) {
        const match = scriptContent.match(/utag_data\s*=\s*({[\s\S]*?});/);
        if (match) {
          try {
            const data = JSON.parse(match[1]);
            console.log('utag_data:', JSON.stringify(data, null, 2));
          } catch (e) {
            console.log('Failed to parse utag_data');
          }
        }
      }
    });

    // Check title
    console.log('\n=== Page Info ===');
    console.log('Title:', $('title').text());
    console.log('OG Title:', $('meta[property="og:title"]').attr('content'));
    console.log('H1:', $('h1').first().text().trim());

    // Check for price elements
    console.log('\n=== Price Elements ===');
    console.log('pip-temp-price__integer:', $('.pip-temp-price__integer').text().trim());
    console.log('Any [class*="price"]:', $('[class*="price"]').first().text().trim());
    console.log('OG Image:', $('meta[property="og:image"]').attr('content'));

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testScrape();
