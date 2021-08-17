const { savechallenge, saveWriteUp } = require("./helpers");
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

module.exports = {
  savePracticeLessons,
  getPracticeLessons,
  getPracticePageCourses,
};
