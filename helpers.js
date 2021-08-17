const cliProgress = require("cli-progress");

const fileSeparator = () => {
  const machine_type = process.platform;
  return machine_type === "win32" ? "\\" : "/";
};

const cleanupScreen = async (page) => {
  return await page.evaluate(() => {
    document.getElementById("stu").style.display = "none";
    document.getElementsByTagName("footer")[0].style.display = "none";
    document.getElementsByClassName("go2top")[0].style.display = "none";
  });
};

const savechallenge = async (page, url, challengePath) => {
  await page.goto(url, {
    waitUntil: "networkidle2",
  });
  await cleanupScreen(page);
  await page.screenshot({
    path: `${challengePath}challenge.png`,
    fullPage: true,
  });
};

const saveWriteUp = async (page, url, challengePath) => {
  await page.goto(`${url}/writeups`, {
    waitUntil: "networkidle2",
  });
  await cleanupScreen(page);
  await page.screenshot({
    path: `${challengePath}writeup.png`,
    fullPage: true,
  });
};

const saveLesson = async (page, path) => {
  await cleanupScreen(page);
  await page.screenshot({
    path: `${path}lesson.png`,
    fullPage: true,
  });
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

module.exports = {
  savechallenge,
  saveWriteUp,
  fileSeparator,
  loadingBar,
  saveLesson,
};
