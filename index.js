"use strict";
require("dotenv").config();
const {
  print,
  getAvailableCourses,
  getAnswers,
  getPageLessons,
  savePageLessons,
  selectTarget,
} = require("./scraper.js");
const puppeteer = require("puppeteer");

const userAuthData = {
  loginfield: process.env.CT_USERNAME,
  password: process.env.CT_PASSWORD,
};

const initBrowser = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    timeout: 100000,
  });
  const page = await browser.newPage();
  page.setViewport({
    height: 720,
    width: 1280,
    deviceScaleFactor: 2,
  });
  await page.goto("https://cybertalents.com/login", {
    waitUntil: "networkidle2",
  });
  page.setDefaultNavigationTimeout(0);
  return { browser, page };
};

const performLogin = async (page) => {
  await page.type('[name="loginfield"]', userAuthData.loginfield);
  await page.type('[name="password"]', userAuthData.password);
  await page.click('[type="submit"]');
  await page.waitForNavigation();
};

(async () => {
  print("[-] Starting Browser...", false);
  const { browser, page } = await initBrowser();
  print(`\r[+] Browser Started\n`, true);
  print(`[-] Authenticating...`, false);
  await performLogin(page);
  print(`\r[+] Authenticated\n`, true);
  const target = await selectTarget(page);
  const availableCourses = await getAvailableCourses(page, target);
  let selectedCourses = await getAnswers(availableCourses);
  print(`[-] Fetching Lessons of each course...`, false);
  selectedCourses = await getPageLessons(page, selectedCourses, target);
  print(`\r[+] Lessons Fetched\n`, true);
  await savePageLessons(page, selectedCourses, target);
  await browser.close();
  print(`\r[+] Downloaded and saved to "CyberTalents" folder\n`, true);
  process.exit();
})();
