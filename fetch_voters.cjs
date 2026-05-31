const fs = require('fs');
const path = require('path');

const TOTAL_PAGES = 36;
const SESSION = "2022-23";
const URL = `https://addresacademy.com/jucsu/voter-list_1st.php?session=${SESSION}&page=`;

async function fetchAll() {
  console.log("Starting to fetch voter list...");
  const allVoters = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    console.log(`Fetching page ${page}/${TOTAL_PAGES}...`);
    try {
      const res = await fetch(URL + page);
      const html = await res.text();

      // Extract rows
      const rowRegex = /<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/g;
      
      let match;
      let count = 0;
      while ((match = rowRegex.exec(html)) !== null) {
        // Skip header if it matches (it shouldn't because header uses th)
        const hall = match[2].trim();
        const name = match[5].trim();
        const dept = match[6].trim();
        const reg = match[7].trim();
        
        // Sometimes HTML entities like &#039; appear in Hall Names
        const cleanHall = hall.replace(/&#039;/g, "'");
        const cleanName = name.replace(/&#039;/g, "'").replace(/&amp;/g, "&");
        const cleanDept = dept.replace(/&#039;/g, "'").replace(/&amp;/g, "&");

        allVoters.push({
          name: cleanName,
          dept: cleanDept,
          hall: cleanHall
        });
        count++;
      }
      console.log(`Found ${count} records on page ${page}`);
      
      // Small delay to be polite to the server
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error(`Error on page ${page}:`, e);
    }
  }

  // Ensure src/data dir exists
  const dataDir = path.join(__dirname, 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outFile = path.join(dataDir, 'voters.json');
  fs.writeFileSync(outFile, JSON.stringify(allVoters, null, 2));
  console.log(`Successfully saved ${allVoters.length} voters to ${outFile}`);
}

fetchAll();
