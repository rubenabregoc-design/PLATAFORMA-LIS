/**
 * LISCORE Enterprise Dynamic Time-Based Greeting Engine
 * Calcula automáticamente el saludo según la hora local oficial de Panamá (UTC-5):
 * - Mañana: 05:00 a 11:59 -> ¡Buenos días! / Good morning!
 * - Tarde:  12:00 a 18:59 -> ¡Buenas tardes! / Good afternoon!
 * - Noche:  19:00 a 04:59 -> ¡Buenas noches! / Good evening!
 */

export function getTimeBasedGreeting(language: 'ES' | 'EN' = 'ES'): string {
  const currentHour = new Date().getHours();

  if (language === 'EN') {
    if (currentHour >= 5 && currentHour < 12) {
      return 'Good morning';
    } else if (currentHour >= 12 && currentHour < 19) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  } else {
    if (currentHour >= 5 && currentHour < 12) {
      return 'Buenos días';
    } else if (currentHour >= 12 && currentHour < 19) {
      return 'Buenas tardes';
    } else {
      return 'Buenas noches';
    }
  }
}

export function formatGreetingUserName(userName?: string, fallback: string = 'Usuario'): string {
  if (!userName || !userName.trim()) return fallback;
  const withoutParens = userName.includes('(') ? userName.split('(')[0].trim() : userName.trim();
  const normalized = withoutParens.replace(/Ruben Abrego/gi, 'Rubén Ábrego');
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;

  const isHonorific = /^(Ing\.|Licda\.|Lic\.|Dr\.|Dra\.|Sr\.|Sra\.|Prof\.|Mgtr\.)$/i.test(parts[0]);
  if (isHonorific) {
    // Título + Nombre (+ Apellido si existe), nunca dejar solo "Ing."
    return parts.slice(0, 3).join(' ');
  }
  return parts.slice(0, 2).join(' ');
}

export function getFullGreeting(userName?: string, language: 'ES' | 'EN' = 'ES'): string {
  const greeting = getTimeBasedGreeting(language);
  const fallback = language === 'EN' ? 'User' : 'Usuario';
  const name = formatGreetingUserName(userName, fallback);

  return `${greeting}, ${name}!`;
}
