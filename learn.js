const fs = require("fs");
const {
  savechallenge,
  saveWriteUp,
  fileSeparator,
  loadingBar,
} = require("./helpers");

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

module.exports = {
  getLearnPageCourses,
  getLearnLessons,
  saveLearnLessons,
};
