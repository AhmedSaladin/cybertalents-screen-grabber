# CyberTalents Screen Grabber

> **✅ This script is tested on mac and linux and windows**

> **✅ Your login credentials are saved in the .env file on your local machine**

## Script description

This script is created to automate downloading the content from the [Cyber Talents](https://cybertalents.com/) platform. It fetches the courses in [practice](https://cybertalents.com/challenges) section, creates a folder for each challenge, take screenshots for each challenge with its writeup and save it in the corresponding folder 🔥🔥

## Skip chromium installation "If you have chromium installed already"

```bash
export CHROMIUM_EXECUTABLE_PATH=$(which chromium)
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

When `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` is set to `true`, puppeteer skips downloading the binaries for chromium, however you **must** provide an executable path to a chromium binary (which is done via the `CHROMIUM_EXECUTABLE_PATH` environment variable).

## Prepare your machine (if windows machine)

1. Download [Node.js](https://nodejs.org/en/) the LTS version then install it. The usual install just next next...

2. Download [Git Bash](https://git-scm.com/downloads) the windows version and also the usual install. Just tick the option of creating a desktop icon

3. You should be ready to move to the next step (How to run)

## How to run

1.  Clone the repo

    - ssh

    ```bash
      git clone git@github.com:AhmedAshrafAZ/cybertalents-screen-grabber.git
    ```
2.  Navigate to the script directory

    ```
    cd cybertalents-screen-grabber
    ```

3.  Install node modules

    ```
    npm i
    ```

4.  Add your username to the ".env" file

    ```
    echo "CT_USERNAME=your_username" > .env
    ```

5.  Add your password to the ".env" file

    ```
    echo "CT_PASSWORD=your_password" >> .env
    ```

6.  Run the script and let the magic begin 🎩🎩🔥🔥
    ```
    npm start
    ```

## The Origanal Repo 👌

[Ahmed Ashraf AZ](https://github.com/AhmedAshrafAZ/cybertalents-screen-grabber)
