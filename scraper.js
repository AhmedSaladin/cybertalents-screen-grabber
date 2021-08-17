"use strict";
require("dotenv").config();
const inquirer = require("inquirer");
const puppeteer = require("puppeteer");
const { fileSeparator } = require("./helpers");

const {
  getPracticePageCourses,
  getPracticeLessons,
  savePracticeLessons,
} = require("./practice");

const {
  getLearnPageCourses,
  getLearnLessons,
  saveLearnLessons,
} = require("./learn");

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

const selectTarget = async (page) => {
  const answer = await inquirer.prompt([
    {
      type: "list",
      message: "Select target page",
      name: "target",
      choices: ["LEARN", "PRACTICE"],
    },
  ]);

  if (answer.target === "LEARN") {
    await page.goto("https://cybertalents.com/learn", {
      waitUntil: "networkidle2",
    });
    return "LEARN";
  }

  if (answer.target === "PRACTICE") {
    await page.goto("https://cybertalents.com/challenges", {
      waitUntil: "networkidle2",
    });
    return "PRACTICE";
  }
};

const getAvailableCourses = async (page, target) => {
  try {
    if (target === "PRACTICE") return await getPracticePageCourses(page);
    else return await getLearnPageCourses(page);
  } catch (err) {
    console.log(err);
  }
};

const getAnswers = async (availableCourses) => {
  try {
    const answers = await inquirer.prompt([
      {
        type: "checkbox",
        message: "Select the courses you want",
        name: "courses",
        choices: availableCourses,
        validate(answer) {
          if (answer.length < 1) {
            return "You must choose at least one course.";
          }
          return true;
        },
        loop: false,
      },
    ]);
    return answers.courses.map((course) => {
      return {
        name: course,
        url: availableCourses.find((crs) => crs.name === course).url,
      };
    });
  } catch (err) {
    console.log(err);
  }
};

const getPageLessons = async (page, courses, target) => {
  try {
    for (let index = 0; index < courses.length; index++) {
      await page.goto(courses[index].url, {
        waitUntil: "networkidle2",
      });
      if (target === "PRACTICE") await getPracticeLessons(page, courses[index]);
      else await getLearnLessons(page, courses[index]);
    }
    return courses;
  } catch (err) {
    console.log(err);
  }
};

const savePageLessons = async (page, courses, target) => {
  try {
    for (let index = 0; index < courses.length; index++) {
      const coursePath = `${__dirname}${fileSeparator()}CyberTalents${fileSeparator()}`;
      if (target === "PRACTICE")
        await savePracticeLessons(page, courses[index], coursePath);
      else await saveLearnLessons(page, courses[index], coursePath);
    }
    loadingBar.stop();
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  initBrowser,
  performLogin,
  getAvailableCourses,
  getAnswers,
  getPageLessons,
  savePageLessons,
  selectTarget,
};
