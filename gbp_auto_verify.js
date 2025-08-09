// gbp_auto_verify.js
// Node.js 18+
// تشغيل مثال:
// DOMAIN='comedycompetitions.co.uk' PHONE='+96877338723' NAME_AR='استراحة الأناقة بركاء' CATEGORY_AR='استراحة' ADDRESS_AR='بركاء العبر، ولاية بركاء 134، عُمان' node gbp_auto_verify.js

import fs from 'fs';
import os from 'os';
import path from 'path';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const env = (k, d = '') => (process.env[k] || d).trim();

const CONFIG = {
  domain: env('DOMAIN'),
  phone: env('PHONE', '+96877338723'),
  nameAr: env('NAME_AR', 'استراحة الأناقة بركاء'),
  categoryAr: env('CATEGORY_AR', 'استراحة'),
  addressAr: env('ADDRESS_AR', 'بركاء العبر، ولاية بركاء 134، عُمان'),
  website: env('WEBSITE', ''),
  headless: env('HEADLESS', 'true') === 'true',
  userDataDir: env('USER_DATA_DIR', path.join(os.homedir(), '.gbp-auto-profile')),
  slowMoMs: parseInt(env('SLOWMO_MS', '50'), 10),
  maxWaitMs: 90_000,
};

function logInfo(msg, obj) {
  const t = new Date().toISOString();
  console.log(`[${t}] INFO ${msg}`, obj ? obj : '');
}
function logWarn(msg, obj) {
  const t = new Date().toISOString();
  console.warn(`[${t}] WARN ${msg}`, obj ? obj : '');
}
function logErr(msg, obj) {
  const t = new Date().toISOString();
  console.error(`[${t}] ERROR ${msg}`, obj ? obj : '');
}

async function waitAndClick(page, selector) {
  await page.waitForSelector(selector, { timeout: CONFIG.maxWaitMs });
  await page.click(selector, { delay: 60 });
}
async function waitAndType(page, selector, text) {
  await page.waitForSelector(selector, { timeout: CONFIG.maxWaitMs });
  await page.click(selector, { clickCount: 3, delay: 40 });
  await page.type(selector, text, { delay: 60 });
}
async function waitForAny(page, selectors) {
  const winner = await Promise.race(
    selectors.map((sel) => page.waitForSelector(sel, { timeout: CONFIG.maxWaitMs }).then(() => sel))
  );
  return winner;
}

async function ensureLoggedIn(page) {
  await page.goto('https://accounts.google.com/', { waitUntil: 'domcontentloaded' });
  const maybeSignIn = await page.$('a[href*="ServiceLogin"], a[href*="signin"], input[type="email"]');
  if (maybeSignIn) {
    logWarn('الرجاء تسجيل الدخول إلى حساب Google في هذه النافذة/الجلسة. سيتم الانتظار 120 ثانية...');
    await page.waitForTimeout(120_000);
  }
}

async function verifySearchConsole(page, domain) {
  const url = `https://search.google.com/search-console?resource_id=sc-domain:${domain}`;
  await page.goto(url, { waitUntil: 'networkidle2' });

  // تحرّي وجود حالة تم التحقق أو زر Verify
  try {
    const html = await page.content();
    if (/Verified|تم التحقق/i.test(html)) {
      logInfo('Search Console: الملكية مثبتة مسبقًا.');
      return true;
    }
  } catch {}

  // محاولة الضغط على Verify
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, div[role="button"], a'));
      const target = btns.find((b) => /verify|تحقق/i.test(b.textContent || ''));
      if (target) target.click();
    });
    await page.waitForTimeout(5000);
    const html2 = await page.content();
    if (/Verified|تم التحقق/i.test(html2)) {
      logInfo('Search Console: تم التحقق عبر النطاق.');
      return true;
    }
  } catch {}

  const html3 = await page.content();
  if (/Verified|تم التحقق/i.test(html3)) {
    logInfo('Search Console: تم التحقق.');
    return true;
  }
  logWarn('Search Console: لم أستطع تأكيد النجاح تلقائيًا الآن. أعد المحاولة لاحقًا.');
  return false;
}

async function createOrClaimGBP(page, cfg) {
  await page.goto('https://business.google.com/create', { waitUntil: 'networkidle2' });

  // اسم النشاط
  const nameSelectors = ['input[aria-label*="اسم"]', 'input[aria-label*="business name"]', 'input[type="text"]'];
  for (const sel of nameSelectors) {
    const el = await page.$(sel);
    if (el) {
      await waitAndType(page, sel, cfg.nameAr);
      break;
    }
  }

  // الفئة
  const catSel = 'input[aria-label*="فئة"], input[aria-label*="category"]';
  try {
    await waitAndType(page, catSel, cfg.categoryAr);
    await page.keyboard.press('Enter');
  } catch {}

  // التالي
  const nextButtons = [
    'button:has-text("التالي")',
    'button:has-text("Next")',
    'div[role="button"]:has(span:contains("Next"))',
  ];
  for (const sel of nextButtons) {
    try {
      await waitAndClick(page, sel);
      break;
    } catch {}
  }
  await page.waitForTimeout(1500);

  // العنوان
  const addrSelectors = [
    'textarea[aria-label*="العنوان"]',
    'textarea[aria-label*="Address"]',
    'input[aria-label*="العنوان"]',
    'input[aria-label*="Address"]',
  ];
  for (const sel of addrSelectors) {
    const el = await page.$(sel);
    if (el) {
      await waitAndType(page, sel, cfg.addressAr);
      break;
    }
  }

  // الموقع
  const webSel = 'input[aria-label*="موقع"], input[aria-label*="website"]';
  try {
    await waitAndType(page, webSel, cfg.website || `https://${cfg.domain}`);
  } catch {}

  // الهاتف
  const phoneSel = 'input[aria-label*="الهاتف"], input[aria-label*="phone"]';
  try {
    await waitAndType(page, phoneSel, cfg.phone);
  } catch {}

  // متابعة ضغط التالي لخطوات متعددة
  for (let i = 0; i < 6; i++) {
    let clicked = false;
    for (const sel of nextButtons) {
      try {
        await waitAndClick(page, sel);
        clicked = true;
        await page.waitForTimeout(1200);
        break;
      } catch {}
    }
    if (!clicked) break;
  }

  // محاولة اختيار التحقق عبر الموقع/النطاق
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('button, div[role="button"], a'));
    const target = candidates.find((c) => /website|الموقع|site|search console|النطاق/i.test(c.textContent || ''));
    if (target) target.click();
  });
  await page.waitForTimeout(6000);

  const html = await page.content();
  if (/Verified|تم التحقق/i.test(html)) {
    logInfo('Google Business Profile: تم التحقق وتفعيل الملف.');
    return true;
  }
  logWarn('Google Business Profile: لم تظهر حالة "تم التحقق" بعد. قد يتطلب انتظار/إعادة محاولة.');
  return false;
}

async function main() {
  if (!CONFIG.domain) {
    logErr('يرجى ضبط DOMAIN مثل: DOMAIN=comedycompetitions.co.uk');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    userDataDir: CONFIG.userDataDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--lang=ar',
      '--disable-blink-features=AutomationControlled',
    ],
    slowMo: CONFIG.slowMoMs,
  });

  try {
    const [page] = (await browser.pages()).length ? await browser.pages() : [await browser.newPage()];
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ar,ar-OM;q=0.9,en-US;q=0.8,en;q=0.7' });

    await ensureLoggedIn(page);

    const scOk = await verifySearchConsole(page, CONFIG.domain);
    if (!scOk) logWarn('قد يتطلب الأمر بضع دقائق قبل أن تظهر حالة التحقق في Search Console.');

    const gbpOk = await createOrClaimGBP(page, CONFIG);
    if (!gbpOk) {
      logWarn('قد تحتاج لإعادة تشغيل السكربت لاحقًا بعد تزامن بيانات Search Console/GBP.');
    } else {
      logInfo('اكتمل إنشاء/التحقق من ملف النشاط.');
    }

    console.log(JSON.stringify({
      domain: CONFIG.domain,
      phone: CONFIG.phone,
      nameAr: CONFIG.nameAr,
      addressAr: CONFIG.addressAr,
      website: CONFIG.website || `https://${CONFIG.domain}`,
      searchConsoleVerified: scOk,
      gbpVerified: gbpOk,
    }, null, 2));
  } catch (e) {
    logErr('فشل التنفيذ', e);
    process.exit(2);
  } finally {
    // تعمدنا إبقاء المتصفح مفتوحًا في حالة headless=false لتتمكن من النقر اليدوي عند الحاجة
  }
}

main();