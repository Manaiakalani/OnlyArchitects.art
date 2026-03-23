// OnlyArchitects.art — Playwright Fit & Finish Tests
const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8080';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots');

(async () => {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR);

  const browser = await chromium.launch();
  const results = [];
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      results.push({ name, status: '✅ PASS' });
      passed++;
    } catch (e) {
      results.push({ name, status: '❌ FAIL', error: e.message });
      failed++;
    }
  }

  // ─── Desktop Tests ───
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktopCtx.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  // Track failed network requests
  const failedRequests = [];
  page.on('requestfailed', req => failedRequests.push(`${req.url()} - ${req.failure().errorText}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });

  // ─── Structure Tests ───
  await test('Page title contains OnlyArchitects', async () => {
    const title = await page.title();
    assert(title.includes('OnlyArchitects'), `Title was: ${title}`);
  });

  await test('Meta description exists', async () => {
    const desc = await page.$eval('meta[name="description"]', el => el.content);
    assert(desc.length > 20, 'Description too short');
  });

  await test('OG image points to local asset', async () => {
    const ogImg = await page.$eval('meta[property="og:image"]', el => el.content);
    assert(ogImg.includes('onlyarchitects.art/images/og-image.jpg'), `OG image was: ${ogImg}`);
  });

  await test('Favicon .ico exists', async () => {
    const ico = await page.$('link[href="favicon.ico"]');
    assert(ico, 'Missing favicon.ico link');
  });

  await test('Apple touch icon exists', async () => {
    const apple = await page.$('link[rel="apple-touch-icon"]');
    assert(apple, 'Missing apple-touch-icon link');
  });

  // ─── Header ───
  await test('Header is visible', async () => {
    const header = await page.$('#site-header');
    assert(header, 'Header not found');
    const visible = await header.isVisible();
    assert(visible, 'Header not visible');
  });

  await test('Logo text is ONLYARCHITECTS', async () => {
    const text = await page.$eval('.logo', el => el.textContent.trim());
    assert.strictEqual(text, 'ONLYARCHITECTS');
  });

  await test('Nav has 3 links (Projects, About, Connect)', async () => {
    const links = await page.$$eval('.header-nav a', els => els.map(e => e.textContent.trim()));
    assert.deepStrictEqual(links, ['Projects', 'About', 'Connect']);
  });

  // ─── Hero ───
  await test('Hero tagline renders 3 lines', async () => {
    const lines = await page.$$('.hero-line');
    assert.strictEqual(lines.length, 3);
  });

  await test('Hero subtitle is visible', async () => {
    const sub = await page.$('.hero-subtitle');
    assert(await sub.isVisible(), 'Subtitle not visible');
  });

  await test('CTA button has border-radius 999px (rounded)', async () => {
    const radius = await page.$eval('.cta-button', el => getComputedStyle(el).borderRadius);
    assert(radius === '999px', `Border radius was: ${radius}`);
  });

  // ─── Projects ───
  await test('6 project cards rendered', async () => {
    const cards = await page.$$('.project-card');
    assert.strictEqual(cards.length, 6);
  });

  await test('All project images load (no broken)', async () => {
    const images = await page.$$eval('.project-image-link img', imgs =>
      imgs.map(i => ({ src: i.src, natural: i.naturalWidth }))
    );
    const broken = images.filter(i => i.natural === 0);
    assert.strictEqual(broken.length, 0, `Broken images: ${JSON.stringify(broken)}`);
  });

  await test('All project images are self-hosted', async () => {
    const srcs = await page.$$eval('.project-image-link img', imgs => imgs.map(i => i.src));
    const external = srcs.filter(s => s.includes('unsplash.com'));
    assert.strictEqual(external.length, 0, `External images: ${external.join(', ')}`);
  });

  await test('Project images have border-radius', async () => {
    const radius = await page.$eval('.project-image-link', el => getComputedStyle(el).borderRadius);
    assert(radius === '8px', `Border radius was: ${radius}`);
  });

  await test('Coming Soon card exists with badge', async () => {
    const badge = await page.$('.coming-soon-badge');
    assert(badge, 'Coming Soon badge not found');
    const text = await badge.textContent();
    assert(text.trim() === 'Coming Soon', `Badge text: ${text}`);
  });

  await test('Coming Soon card has no link', async () => {
    const link = await page.$('.project-coming-soon a.project-image-link');
    assert(!link, 'Coming Soon card should not have an anchor wrapping the image');
  });

  await test('First image has fetchpriority=high', async () => {
    const prio = await page.$eval('.project-card img', el => el.getAttribute('fetchpriority'));
    assert.strictEqual(prio, 'high');
  });

  // ─── About ───
  await test('About section exists with heading', async () => {
    const heading = await page.$eval('.section-heading', el => el.textContent.trim());
    assert.strictEqual(heading, 'About');
  });

  await test('About has two-column layout on desktop', async () => {
    const cols = await page.$eval('.about-content', el => getComputedStyle(el).gridTemplateColumns);
    // Should have two columns (not "1fr" single)
    assert(cols.split(' ').length >= 2, `Grid columns: ${cols}`);
  });

  // ─── Connect ───
  await test('Connect email is hello@onlyarchitects.art', async () => {
    const href = await page.$eval('.connect .cta-button', el => el.href);
    assert(href.includes('hello@onlyarchitects.art'), `Email href: ${href}`);
  });

  await test('Connect background image loads', async () => {
    const bg = await page.$eval('.connect-inner', el => getComputedStyle(el).backgroundImage);
    assert(bg.includes('hero-bg.jpg'), `BG image: ${bg}`);
  });

  // ─── Footer ───
  await test('Footer email is hello@onlyarchitects.art', async () => {
    const href = await page.$eval('.footer-cta-list a[href^="mailto:"]', el => el.href);
    assert(href.includes('hello@onlyarchitects.art'), `Footer email: ${href}`);
  });

  await test('Copyright says 2026', async () => {
    const copy = await page.$eval('.footer-copyright', el => el.textContent);
    assert(copy.includes('2026'), `Copyright: ${copy}`);
  });

  // ─── Scroll Interactions ───
  await test('Header gets .scrolled class after scroll', async () => {
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(400);
    const cls = await page.$eval('#site-header', el => el.className);
    assert(cls.includes('scrolled'), `Header classes: ${cls}`);
  });

  await test('Header gets .light class over projects section', async () => {
    const projectsTop = await page.$eval('#projects', el => el.offsetTop);
    await page.evaluate(y => window.scrollTo(0, y + 50), projectsTop);
    await page.waitForTimeout(400);
    const cls = await page.$eval('#site-header', el => el.className);
    assert(cls.includes('light'), `Header classes after scroll to projects: ${cls}`);
  });

  await test('Reveal elements become visible on scroll', async () => {
    const aboutTop = await page.$eval('#about', el => el.offsetTop);
    await page.evaluate(y => window.scrollTo(0, y - 200), aboutTop);
    await page.waitForTimeout(800);
    const cls = await page.$eval('#about', el => el.className);
    assert(cls.includes('visible'), `About classes: ${cls}`);
  });

  // ─── No Console Errors / Failed Requests ───
  await test('No JavaScript console errors', async () => {
    assert.strictEqual(consoleErrors.length, 0, `Console errors: ${consoleErrors.join('; ')}`);
  });

  await test('No failed network requests', async () => {
    assert.strictEqual(failedRequests.length, 0, `Failed: ${failedRequests.join('; ')}`);
  });

  // ─── Screenshots ───
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop-hero.png'), fullPage: false });

  await page.evaluate(() => window.scrollTo(0, document.querySelector('#projects').offsetTop));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop-projects.png'), fullPage: false });

  await page.evaluate(() => window.scrollTo(0, document.querySelector('#about').offsetTop - 80));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop-about.png'), fullPage: false });

  await page.evaluate(() => window.scrollTo(0, document.querySelector('#connect').offsetTop - 80));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop-connect.png'), fullPage: false });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop-footer.png'), fullPage: false });

  await desktopCtx.close();

  // ─── Mobile Tests ───
  const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mPage = await mobileCtx.newPage();
  await mPage.goto(BASE, { waitUntil: 'networkidle' });

  await test('Mobile: single-column project grid', async () => {
    const cols = await mPage.$eval('.project-row', el => getComputedStyle(el).gridTemplateColumns);
    const colCount = cols.split(' ').length;
    assert(colCount === 1, `Mobile grid columns: ${cols} (${colCount} cols)`);
  });

  await test('Mobile: about section is single column', async () => {
    const cols = await mPage.$eval('.about-content', el => getComputedStyle(el).gridTemplateColumns);
    const colCount = cols.split(' ').length;
    assert(colCount === 1, `Mobile about columns: ${cols}`);
  });

  await mPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile-hero.png'), fullPage: false });
  await mPage.evaluate(() => window.scrollTo(0, document.querySelector('#projects').offsetTop));
  await mPage.waitForTimeout(600);
  await mPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile-projects.png'), fullPage: false });

  await mobileCtx.close();

  // ─── 404 Page Test ───
  const ctx404 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p404 = await ctx404.newPage();
  await p404.goto(`${BASE}/404.html`, { waitUntil: 'networkidle' });

  await test('404 page has correct title', async () => {
    const title = await p404.title();
    assert(title.includes('404'), `404 title: ${title}`);
  });

  await test('404 page has back-to-home link', async () => {
    const link = await p404.$('a.back');
    assert(link, '404 missing back link');
    const href = await link.getAttribute('href');
    assert.strictEqual(href, '/');
  });

  await test('404 page has rounded button', async () => {
    const radius = await p404.$eval('.back', el => getComputedStyle(el).borderRadius);
    assert(radius === '999px', `404 button radius: ${radius}`);
  });

  await p404.screenshot({ path: path.join(SCREENSHOTS_DIR, '404-page.png'), fullPage: false });
  await ctx404.close();

  await browser.close();

  // ─── Report ───
  console.log('\n' + '═'.repeat(60));
  console.log(' OnlyArchitects.art — Playwright Fit & Finish Report');
  console.log('═'.repeat(60));
  for (const r of results) {
    console.log(`  ${r.status}  ${r.name}`);
    if (r.error) console.log(`         → ${r.error}`);
  }
  console.log('─'.repeat(60));
  console.log(`  Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`  Screenshots saved to: ${SCREENSHOTS_DIR}/`);
  console.log('═'.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
})();
