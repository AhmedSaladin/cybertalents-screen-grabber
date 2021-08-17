"use strict";
const inquirer = require("inquirer");
const fs = require("fs");
const cliProgress = require("cli-progress");
const { savechallenge, saveWriteUp, saveLesson } = require("./helpers");
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

const getPracticeLessons = async (page, course) => {
  course.challenges = await page.evaluate(() => {
    const challenges = [];
    const challengesContainer = document.querySelectorAll(
      '[class="card flex mb-4 challenge-card"]'
    );
    challengesContainer.forEach((challenge) => {
      const target =
        challenge.children[0].children[0].children[0].firstElementChild;
      challenges.push({
        name: target.innerText.replace("?", " "),
        url: target.href,
      });
    });
    return challenges;
  });
};

const getLearnLessons = async (page, course) => {
  course.lessons = await page.evaluate(() => {
    const lessons = [];
    const lessonsContainer = document.querySelectorAll(
      '[class="competition-name ml-8 w-full"]'
    );
    lessonsContainer.forEach((lesson) => {
      let name = lesson.textContent.trim().replaceAll("-", "- ");
      name = name.substring(0, name.indexOf("(")).trim();
      lessons.push({
        name: name,
        url: lesson.parentElement.parentElement.parentElement.href,
      });
    });
    return lessons;
  });
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

const savePracticeLessons = async (page, course, path) => {
  const challengesBar = loadingBar.create(course.challenges.length, 1, {
    title: course.name,
  });
  for (let i = 0; i < course.challenges.length; i++) {
    const url = course.challenges[i].url;
    const challengeName = course.challenges[i].name;
    const challengePath = `${path}Practice${fileSeparator()}${
      course.name
    }${fileSeparator()}${challengeName}${fileSeparator()}`;
    fs.mkdirSync(challengePath, { recursive: true });
    await savechallenge(page, url, challengePath);
    await saveWriteUp(page, url, challengePath);
    challengesBar.increment();
  }
  loadingBar.remove(challengesBar);
};

const getLearnChallenges = async (page, url) => {
  await page.goto(url, {
    waitUntil: "networkidle2",
  });
  return await page.evaluate(() => {
    const challenges = [];
    document
      .querySelectorAll('[class="card flex mb-4 challenge-card"]')
      .forEach((element) => {
        challenges.push({
          name: element.children[0].children[0].children[0].children[0].text
            .trim()
            .replace("?", " "),
          level:
            element.children[0].children[0].children[1].children[1].textContent.trim(),
          url: element.children[0].children[0].children[0].children[0].href,
        });
      });
    return challenges;
  });
};

const saveLearnChallenges = async (page, lesson, path) => {
  const challenges = await getLearnChallenges(page, `${lesson.url}/challenges`);
  fs.mkdirSync(`${path}challenges${fileSeparator()}`, {
    recursive: true,
  });
  const challengesBar = loadingBar.create(challenges.length, 1, {
    title: "challenge",
  });
  for (let i = 0; i < challenges.length; i++) {
    const challengePath = `${path}challenges${fileSeparator()}[${challenges[
      i
    ].level
      .substring(challenges[i].level.indexOf(":") + 1)
      .trim()}] ${challenges[i].name}${fileSeparator()}`;
    fs.mkdirSync(challengePath, { recursive: true });
    await savechallenge(page, challenges[i].url, challengePath);
    await saveWriteUp(page, challenges[i].url, challengePath);
    challengesBar.increment();
  }
  loadingBar.remove(challengesBar);
};

const saveLearnLessons = async (page, course, path) => {
  const lessonsBar = loadingBar.create(course.lessons.length, 1, {
    title: course.name,
  });
  for (let i = 0; i < course.lessons.length; i++) {
    await page.goto(course.lessons[i].url, {
      waitUntil: "networkidle2",
    });
    const lessonName = course.lessons[i].name;
    const lessonPath = `${path}Learn${fileSeparator()}${
      course.name
    }${fileSeparator()}${lessonName}${fileSeparator()}`;
    fs.mkdirSync(lessonPath, { recursive: true });
    await saveLesson(page, lessonPath);
    await saveLearnChallenges(page, course.lessons[i], lessonPath);
    lessonsBar.increment();
  }
  loadingBar.remove(lessonsBar);
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
