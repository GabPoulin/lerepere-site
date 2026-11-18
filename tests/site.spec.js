// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const PAGE = '/index.html';

// Date locale au format AAAA-MM-JJ, décalée de n jours
function dansJours(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Ouvre la page, intercepte l'envoi vers Web3Forms et collecte les erreurs JS
async function ouvrir(page) {
  const erreurs = [];
  const envois = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && /Content Security Policy|Refused to/i.test(m.text())) erreurs.push(m.text()); });
  await page.route('https://api.web3forms.com/**', (route) => {
    envois.push(route.request().postData() || '');
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
  });
  await page.goto(PAGE);
  return { erreurs, envois };
}

// Extrait un champ d'un envoi multipart
function champ(corps, nom) {
  const m = corps.match(new RegExp('name="' + nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"\\r\\n\\r\\n([^\\r]*)'));
  return m ? m[1] : undefined;
}

async function remplirMinimum(page, forfait = 'dj') {
  await page.check(`input[data-cle=${forfait}]`);
  await page.fill('[name="Prénom et nom"]', 'Client Test');
  await page.fill('[name=email]', 'client@example.com');
  await page.fill('[name=Lieu]', 'Salle test, Québec');
}

async function envoyer(page) {
  await page.click('#formulaire button[type=submit]');
}

test.describe('Page', () => {
  test('respecte la politique de sécurité (CSP) sans blocage', async ({ page }) => {
    const { erreurs } = await ouvrir(page);
    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
    await expect(page.locator('script:not([src])')).toHaveCount(0);
    // Le script du formulaire doit s'être exécuté (prix estimé calculé)
    await page.check('input[data-cle=dj]');
    await expect(page.locator('#estimation')).toBeVisible();
    expect(erreurs).toEqual([]);
  });

  test('les liens qui ouvrent un nouvel onglet sont protégés (noopener)', async ({ page }) => {
    await ouvrir(page);
    const liens = await page.$$eval('a[target=_blank]', (a) => a.map((x) => x.rel));
    for (const rel of liens) expect(rel).toContain('noopener');
  });

  test('se charge sans erreur ni défilement horizontal', async ({ page }) => {
    const { erreurs } = await ouvrir(page);
    await expect(page.locator('h1')).toBeVisible();
    const deborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(deborde).toBe(false);
    expect(erreurs).toEqual([]);
  });

  test("n'affiche pas le numéro de téléphone en clair", async ({ page }) => {
    await ouvrir(page);
    const texte = await page.locator('body').innerText();
    expect(texte).not.toMatch(/421[\s .-]?1285/);
    await expect(page.locator('a[href^="sms:"]').first()).toBeAttached();
    await expect(page.locator('a[href^="tel:"]').first()).toBeAttached();
  });

  test('le bouton PDF pointe vers un fichier présent dans le dépôt', async ({ page }) => {
    await ouvrir(page);
    const href = await page.locator('a', { hasText: 'Télécharger la fiche des forfaits' }).getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).not.toMatch(/^https?:/);
    expect(fs.existsSync(path.resolve(__dirname, '..', href))).toBe(true);
  });
});

test.describe('Formulaire : valeurs par défaut', () => {
  test('samedi à au moins 5 jours, 19 h, 1 journée, 150 personnes et moins', async ({ page }) => {
    await ouvrir(page);
    const date = await page.inputValue('#date-evenement');
    expect(date >= dansJours(5)).toBe(true);
    expect(date < dansJours(12)).toBe(true);
    expect(new Date(date + 'T12:00').getDay()).toBe(6);
    await expect(page.locator('[name="Heure de début"]')).toHaveValue('19:00');
    await expect(page.locator('#duree')).toHaveValue('1 journée');
    await expect(page.locator('#audience')).toHaveValue('150 personnes et moins');
  });
});

test.describe('Formulaire : validation', () => {
  test('un formulaire incomplet est bloqué avec un message', async ({ page }) => {
    const { envois } = await ouvrir(page);
    await envoyer(page);
    await expect(page.locator('#statut')).toContainText('Il manque des informations');
    await expect(page.locator('#statut')).toContainText('forfait souhaité');
    expect(envois.length).toBe(0);
  });

  test('une date à moins de 5 jours est bloquée et propose texto, appel ou courriel', async ({ page }) => {
    const { envois } = await ouvrir(page);
    await remplirMinimum(page);
    await page.fill('#date-evenement', dansJours(4));
    await page.dispatchEvent('#date-evenement', 'change');
    await expect(page.locator('#aide-date')).toHaveClass(/alerte/);
    await envoyer(page);
    await expect(page.locator('#statut')).toContainText('au moins 5 jours');
    await expect(page.locator('#statut a[href^="sms:"]')).toBeAttached();
    await expect(page.locator('#statut a[href^="tel:"]')).toBeAttached();
    await expect(page.locator('#statut a[href*="Demande%20sp%C3%A9ciale"]')).toBeAttached();
    expect(envois.length).toBe(0);
  });

  test('une date à 5 jours est acceptée', async ({ page }) => {
    const { envois } = await ouvrir(page);
    await remplirMinimum(page);
    await page.fill('#date-evenement', dansJours(5));
    await envoyer(page);
    await expect(page.locator('#statut')).toContainText('Merci');
    expect(envois.length).toBe(1);
  });
});

test.describe('Formulaire : durées et prix', () => {
  const durees = async (page) => page.$$eval('#duree option:not([disabled])', (o) => o.map((x) => x.text));

  test('durées offertes selon le forfait', async ({ page }) => {
    await ouvrir(page);
    await page.check('input[data-cle=dj]');
    expect(await durees(page)).toEqual(['1 journée', '2 jours', '3 à 7 jours', 'Plus de 7 jours']);
    await page.check('input[data-cle=conf]');
    expect(await durees(page)).toEqual(['1 journée', '2 jours', '3 jours et plus']);
    await page.check('input[data-cle=trio]');
    expect(await durees(page)).toEqual(['1 journée', '2 jours et plus']);
    await page.check('input[data-cle=perso]');
    expect(await durees(page)).toEqual(['1 journée', '2 jours', '3 à 7 jours', 'Plus de 7 jours']);
  });

  const grille = [
    ['dj', '1 journée', /^395 \$/],
    ['dj', '2 jours', /^465 \$/],
    ['dj', '3 à 7 jours', /^600 \$/],
    ['dj', 'Plus de 7 jours', /^Sur soumission/],
    ['conf', '1 journée', /^665 \$/],
    ['conf', '2 jours', /^1 130 \$/],
    ['conf', '3 jours et plus', /^Sur soumission/],
    ['trio', '1 journée', /^1 150 \$/],
    ['trio', '2 jours et plus', /^Sur soumission/],
    ['perso', '1 journée', /^Sur soumission/],
  ];
  for (const [forfait, duree, attendu] of grille) {
    test(`prix ${forfait} · ${duree}`, async ({ page }) => {
      await ouvrir(page);
      await page.check(`input[data-cle=${forfait}]`);
      await page.selectOption('#duree', duree);
      const prix = (await page.inputValue('#prix-affiche')).replace(/ | /g, ' ');
      expect(prix).toMatch(attendu);
      await expect(page.locator('#estimation')).toBeVisible();
    });
  }

  test('plus de 150 personnes : sur soumission et audience estimée obligatoire', async ({ page }) => {
    const { envois } = await ouvrir(page);
    await remplirMinimum(page);
    await page.selectOption('#audience', 'Plus de 150 personnes');
    await expect(page.locator('#audience-estimee')).toBeVisible();
    expect(await page.inputValue('#prix-affiche')).toMatch(/^Sur soumission.*150/);
    await envoyer(page);
    await expect(page.locator('#statut')).toContainText('audience estimée');
    await page.fill('#audience-estimee', '120');
    await envoyer(page);
    expect(envois.length).toBe(0);
    await page.fill('#audience-estimee', '300');
    await envoyer(page);
    await expect(page.locator('#statut')).toContainText('Merci');
    expect(champ(envois[0], 'Audience estimée')).toBe('300');
  });
});

test.describe('Formulaire : envoi', () => {
  test('envoie tous les champs attendus puis se remet à zéro', async ({ page }) => {
    const { envois, erreurs } = await ouvrir(page);
    await remplirMinimum(page, 'conf');
    await page.check('#est-entreprise');
    await page.fill('[name=Entreprise]', 'Entreprise Test');
    await page.selectOption('#duree', '2 jours');
    await page.check('#exterieur');
    await expect(page.locator('#aide-exterieur')).toBeVisible();
    await page.fill('[name=Besoins]', 'Deux micros');
    await envoyer(page);
    await expect(page.locator('#statut')).toContainText('Merci');
    const c = envois[0];
    expect(champ(c, 'access_key')).toMatch(/^[0-9a-f-]{36}$/);
    expect(champ(c, 'Forfait')).toBe('Conférence / corporatif');
    expect(champ(c, 'Entreprise')).toBe('Entreprise Test');
    expect(champ(c, 'Prénom et nom')).toBe('Client Test');
    expect(champ(c, 'email')).toBe('client@example.com');
    expect(champ(c, 'Durée approximative')).toBe('2 jours');
    expect(champ(c, 'Heure de début')).toBe('19:00');
    expect(champ(c, "Taille de l'audience")).toBe('150 personnes et moins');
    expect(champ(c, 'Événement extérieur')).toBe('Oui');
    expect(champ(c, 'Prix affiché')).toMatch(/1\D{1,3}130\D{1,3}\$ \(2 jours\)/);
    // Remise à zéro
    await expect(page.locator('#duree')).toHaveValue('1 journée');
    await expect(page.locator('#exterieur')).not.toBeChecked();
    await expect(page.locator('#champ-entreprise')).toBeHidden();
    expect(erreurs).toEqual([]);
  });

  test('sans case extérieur, le courriel indique « Non »', async ({ page }) => {
    const { envois } = await ouvrir(page);
    await remplirMinimum(page);
    await envoyer(page);
    await expect(page.locator('#statut')).toContainText('Merci');
    expect(champ(envois[0], 'Événement extérieur')).toBe('Non');
    expect(champ(envois[0], 'Entreprise')).toBeUndefined();
  });

  test("affiche un message d'erreur si le service d'envoi refuse", async ({ page }) => {
    await page.route('https://api.web3forms.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":false}' }));
    await page.goto(PAGE);
    await remplirMinimum(page);
    await envoyer(page);
    await expect(page.locator('#statut')).toContainText("l’envoi n’a pas fonctionné");
    await expect(page.locator('#statut a[href^="mailto:"]')).toBeAttached();
  });
});
