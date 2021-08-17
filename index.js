"use strict";
const {
  initBrowser,
  performLogin,
  getAvailableCourses,
  getAnswers,
  getPageLessons,
  savePageLessons,
  selectTarget,
} = require("./scraper.js");

const print = (text, clearLine) => {
  if (clearLine) process.stdout.clearLine();
  process.stdout.write(text);
};

const mainScreen = async () => {
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
};

mainScreen();
