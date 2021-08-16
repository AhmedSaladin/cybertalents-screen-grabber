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

const getLearnPageCourses = async (page) => {
  return await page.evaluate(() => {
    const courses = [];
    document
      .querySelectorAll(".course-card > .card-body > .card-title")
      .forEach((element) => {
        const parent = element.parentElement.parentElement;
        courses.push({
          name: element.textContent.trim(),
          url: parent.children[parent.childElementCount - 1].children[1].href,
        });
      });
    return courses;
  });
};

const getPracticePageCourses = async (page) => {
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
};

const getAvailableCourses = async (page, target) => {
  try {
    if (target === "LEARN") return await getLearnPageCourses(page);
    if (target === "PRACTICE") return await getPracticePageCourses(page);
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

const getPracticeLessons = async (page, courses) => {
  courses[index].challenges = await page.evaluate(() => {
    const challenges = [];
    const challengesContainer = document.querySelectorAll(
      '[class="card flex mb-4 challenge-card"]'
    );
    challengesContainer.forEach((challenge) => {
      const target =
        challenge.children[0].children[0].children[0].firstElementChild;
      challenges.push({
        name: target.innerText,
        url: target.href,
      });
    });
    return challenges;
  });
};

const getLessons = async (page, courses, target) => {
  try {
    for (let index = 0; index < courses.length; index++) {
      await page.goto(courses[index].url, {
        waitUntil: "networkidle2",
      });
      if (target === "PRACTICE") {
        await getPracticeLessons(page, courses);
      } else {
        courses[index].lessons = await page.evaluate(() => {
          const lessons = [];
          const lessonsContainer = document.querySelectorAll(
            '[class="competition-name ml-8 w-full"]'
          );
          lessonsContainer.forEach((les) => {
            let name = les.textContent.trim().replaceAll("-", "- ");
            name = name.substring(0, name.indexOf("(")).trim();
            lessons.push({
              name: name,
              url: les.parentElement.parentElement.parentElement.href,
            });
          });
          return lessons;
        });
      }
      return courses;
    }
  } catch (err) {
    console.log(err);
  }
};

const cleanupScreen = async (page) => {
  return await page.evaluate(() => {
    document.getElementById("stu").style.display = "none";
    document.getElementsByTagName("footer")[0].style.display = "none";
    document.getElementsByClassName("go2top")[0].style.display = "none";
  });
};

const getchallenge = async (page, url, challengePath) => {
  await page.goto(url, {
    waitUntil: "networkidle2",
  });
  await cleanupScreen(page);
  await page.screenshot({
    path: `${challengePath}challenge.png`,
    fullPage: true,
  });
};

const getWriteUps = async (page, url, challengePath) => {
  await page.goto(`${url}/writeups`, {
    waitUntil: "networkidle2",
  });
  await cleanupScreen(page);
  await page.screenshot({
    path: `${challengePath}writeup.png`,
    fullPage: true,
  });
};

const saveLessons = async (page, courses) => {
  try {
    for (let index = 0; index < courses.length; index++) {
      const coursePath = `${__dirname}${fileSeparator()}CyberTalentsLearn${fileSeparator()}${
        courses[index].name
      }${fileSeparator()}`;
      const challengesBar = loadingBar.create(
        courses[index].challenges.length,
        1,
        {
          title: courses[index].name,
        }
      );

      for (let i = 0; i < courses[index].challenges.length; i++) {
        const url = courses[index].challenges[i].url;
        const challengeName = courses[index].challenges[i].name;
        const challengePath = `${coursePath}${challengeName}${fileSeparator()}`;
        fs.mkdirSync(challengePath, { recursive: true });
        await getchallenge(page, url, challengePath);
        await getWriteUps(page, url, challengePath);
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
  selectTarget,
};
