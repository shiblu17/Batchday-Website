import votersData from '@/data/voters.json';

interface Voter {
  name: string;
  dept: string;
  hall: string;
}

const capitalize = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const shortenName = (fullName: string): string => {
  if (!fullName) return '';
  const isVerified = fullName.endsWith(' ✅');
  const name = fullName.replace(' ✅', '').trim();
  
  const parts = name.split(/\s+/);
  let short = name;
  
  if (parts.length > 0) {
    const firstUpper = parts[0].toUpperCase();
    if ((firstUpper === 'MD.' || firstUpper === 'MD' || firstUpper === 'MOST.' || firstUpper === 'MOST' || firstUpper === 'MST.' || firstUpper === 'MST') && parts.length > 1) {
      let part0 = 'Md.';
      if (firstUpper === 'MST' || firstUpper === 'MST.') part0 = 'Mst.';
      if (firstUpper === 'MOST' || firstUpper === 'MOST.') part0 = 'Most.';
      
      // Capitalize the second part correctly, respecting hyphenation if any
      const p1 = parts[1];
      if (p1.includes('-')) {
        short = `${part0} ${p1.split('-').map(capitalize).join('-')}`;
      } else {
        short = `${part0} ${capitalize(p1)}`;
      }
    } else {
      const p0 = parts[0];
      if (p0.includes('-')) {
        short = p0.split('-').map(capitalize).join('-');
      } else {
        short = capitalize(p0);
      }
    }
  }
  
  return short + (isVerified ? ' ✅' : '');
};
