"use strict";
const inquirer = require("inquirer");
const fs = require("fs");
const cliProgress = require("cli-progress");
const machine_type = process.platform;
const fileSeparator = () => {
  return machine_type === "win32" ? "\\" : "/";
};

const print = (text, clearLine) => {
  if (clearLine) process.stdout.clearLine();
  process.stdout.write(text);
};

const getAvailableCourses = async (page) => {
  try {
    return await page.evaluate(() => {
      const courses = [];
      document.querySelectorAll(".card-cat").forEach((element) => {
        if (element.childElementCount < 2) {
          courses.push({
            name: element.children[0].children[0].textContent.trim(),
            url: element.children[0].children[1].children[2].href,
          });
        } else if (element.childElementCount > 2) {
          courses.push({
            name: element.children[1].textContent.trim(),
            url: element.children[2].children[2].href,
          });
        } else {
          courses.push({
            name: element.children[0].textContent.trim(),
            url: element.children[1].children[2].href,
          });
        }
      });
      return courses;
    });
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
        url: availableCourses.find((c) => c.name === course).url,
      };
    });
  } catch (err) {
    console.log(err);
  }
};

const loadingBar = new cliProgress.MultiBar(
  {
    format: `Capturing ({value}/{total}): {title} | [{bar}] | ETA: {eta}s `,
    barCompleteChar: "#",
    barIncompleteChar: ".",
    hideCursor: true,
    clearOnComplete: true,
  },
  cliProgress.Presets.legacy
);

const getLessons = async (page, courses) => {
  try {
    for (let index = 0; index < courses.length; index++) {
      await page.goto(courses[index].url, {
        waitUntil: "networkidle2",
      });
      courses[index].challenges = await page.evaluate(() => {
        const challenges = [];
        const challengesContainer = document.querySelectorAll(
          '[class="card flex mb-4 challenge-card"]'
        );
        challengesContainer.forEach((challenge) => {
          const name =
            challenge.children[0].children[0].children[0].firstElementChild
              .innerText;
          const link =
            challenge.children[0].children[0].children[0].firstElementChild
              .href;
          challenges.push({
            name: name,
            url: link,
          });
        });
        return challenges;
      });
    }
    return courses;
  } catch (err) {
    console.log(err);
  }
};

const saveLessons = async (page, courses) => {
  try {
    for (let index = 0; index < courses.length; index++) {
      const coursePath = `${__dirname}${fileSeparator()}CyberTalentsLearn${fileSeparator()}${
        courses[index].name
      }${fileSeparator()}`;
      const challengesBar = loadingBar.create(
        courses[index].challenges.length + 1,
        1,
        {
          title: courses[index].name,
        }
      );
      for (let i = 0; i < courses[index].challenges.length; i++) {
        await page.goto(courses[index].challenges[i].url, {
          waitUntil: "networkidle2",
        });
        const challengeName = courses[index].challenges[i].name;
        const challengePath = `${coursePath}${challengeName}${fileSeparator()}`;
        fs.mkdirSync(challengePath, { recursive: true });
        await page.evaluate(() => {
          document.getElementById("stu").style.display = "none";
          document.getElementsByTagName("footer")[0].style.display = "none";
          document.getElementsByClassName("go2top")[0].style.display = "none";
        });
        await page.screenshot({
          path: `${challengePath}challenge.png`,
          fullPage: true,
        });
        await page.goto(`${courses[index].challenges[i].url}/writeups`, {
          waitUntil: "networkidle2",
        });
        await page.evaluate(() => {
          document.getElementById("stu").style.display = "none";
          document.getElementsByTagName("footer")[0].style.display = "none";
          document.getElementsByClassName("go2top")[0].style.display = "none";
        });
        await page.screenshot({
          path: `${challengePath}writeup.png`,
          fullPage: true,
        });
        challengesBar.increment();
      }
      loadingBar.remove(challengesBar);
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
  getLessons,
  saveLessons,
};
