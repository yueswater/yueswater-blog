// Where the site under test is served, and the page paths the specs open.
const PORT = Number(process.env.CONTACT_PORT || 4123);
const BASE_URL = process.env.CONTACT_BASE_URL || `http://localhost:${PORT}`;
const PATHS = { zh: '/contact/', en: '/contact-en/', admin: '/admin/?demo=in' };

module.exports = { PORT, BASE_URL, PATHS };
