"use strict";
const inquirer = require("inquirer");

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

const print = (text, clearLine) => {
  if (clearLine) process.stdout.clearLine();
  process.stdout.write(text);
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
  print,
  getAvailableCourses,
  getAnswers,
  getPageLessons,
  savePageLessons,
  selectTarget,
};
