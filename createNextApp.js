#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const figlet = require('figlet');
const prompts = require('prompts');
const validate = require('validate-npm-package-name');
const chalk = require('chalk');

/**
 * Program flow
 *
 * 1. validate node version
 * 2. run init function
 * 3. validate project name
 * 4. validate project path
 * 5. clone template
 * 6. prompt user for css framework and package manager of choice
 * 7. install the dependencies
 * 8. copy over boilerplate codes based on chosen css framework
 *
 * 9. if any error occurs, after creating a directory, the directory would be deleted
 */

/**
 * Prompts
 *
 * 1. yarn, pnpm, npm
 * 2. Chakra UI, Tailwindcss, None
 */

let projectName, projectPath;
let cssStyleFramework;
const GITHUB_REPO = 'https://github.com/tzeweiwee/nextjs-template.git';

const questions = [
  {
    type: 'select',
    name: 'packageManager',
    message: 'Choose a package manager',
    choices: [
      { title: 'PNPM', value: 'pnpm' },
      { title: 'NPM', value: 'npm' },
      { title: 'Yarn', value: 'yarn' },
    ],
    initial: 1,
  },
  {
    type: 'select',
    name: 'cssStyling',
    message: 'Choose CSS styling',
    choices: [
      { title: 'None', value: 'none' },
      { title: 'Chakra UI', value: 'chakraui' },
      { title: 'Tailwindcss', value: 'tailwindcss' },
    ],
    initial: 1,
  },
];

function setProjectPath() {
  const currentPath = process.cwd();
  projectPath = path.join(currentPath, projectName);
}

function getCssDependencies(cssStyleFramework) {
  switch (cssStyleFramework) {
    case 'chakraui':
      return '@chakra-ui/react @emotion/react@^11 @emotion/styled@^11 framer-motion@^6';
    case 'tailwindcss':
      return 'tailwindcss postcss autoprefixer';
    default:
      return null;
  }
}

function validateNodeVersion() {
  const currentNodeVersion = process.versions.node;
  const semver = currentNodeVersion.split('.');
  const major = semver[0];

  if (major < 14) {
    console.error(chalk.red(
      'You are running Node ' +
        currentNodeVersion +
        '.\n' +
        'Create Airfoil Next App requires Node 14 or higher. \n' +
        'Please update your version of Node.'
    ));
    process.exit(1);
  }
}

function validateAppName() {
  if (process.argv.length < 3) {
    console.log(chalk.red('You have to provide a name to your app.'));
    console.log('For example :');
    console.log(chalk.green(' npx create-airfoil-nextjs-app my-app'));
    process.exit(1);
  }

  projectName = process.argv[2];

  // making sure the project name conforms to NPM naming convention
  const validationResult = validate(projectName);
  if (!validationResult.validForNewPackages) {
    console.error(
      chalk.red(
        `Cannot create a project named ${chalk.green(
          projectName
        )} due to npm naming restrictions.`
      )
    );
    console.log(chalk.yellow(`Please fix the errors below: `));
    if (validationResult.errors) {
      validationResult.errors.forEach((err) => console.error(` - ${chalk.red(err)}`));
    }
    if (validationResult.warnings) {
      validationResult.warnings.forEach((warning) => console.warn(` - ${chalk.yellow(warning)}`));
    }
    process.exit(1);
  }
}

function validateProjectPath() {
  if (fs.existsSync(projectPath)) {
    console.error(chalk.red('Directory already exist, please choose another directory or project name'));
    process.exit(1);
  }
}

function cloneRepo() {
  console.log(chalk.white.bgBlue.bold('Cloning files...'));
  execSync(`git clone --depth 1 ${GITHUB_REPO} ${projectPath}`);
}

async function installDependencies() {
  // change working directory
  process.chdir(projectPath);

  const { packageManager, cssStyling } = await prompts(questions);
  cssStyleFramework = cssStyling;
  const cssStyleDependencies = getCssDependencies(cssStyling);

  console.log(chalk.white.bgBlue.bold('Installing dependencies...'));
  // option to use PNPM, Yarn and NPM
  execSync(`${packageManager} install`);
  // option to install css frameworks or none
  if (cssStyleDependencies) {
    execSync(`${packageManager} install ${cssStyleDependencies}`);
  }
}

function copyBoilerplateFiles() {
  if (!cssStyleFramework || cssStyleFramework === 'none') {
    return;
  }
  console.log(chalk.white.bgBlue.bold('Copying boilerplate files...'));
  // copy boilerplate files to root project for chosen css framework
  execSync(`rsync -avh boilerplate_files/${cssStyleFramework}/* ./`);
}

function cleanUp() {
  console.log(chalk.white.bgBlue.bold('Cleaning up...'));
  fs.rmSync('./.git', { recursive: true });
  fs.rmSync('./boilerplate_files', { recursive: true });
}

function deleteDirectory() {
  console.log(chalk.white.bgBlue.bold('Removing project...'));
  fs.rmSync(projectPath, { recursive: true });
}

function startUp() {
  console.log(figlet.textSync('Create Airfoil NextJS App'));
}

function success() {
  console.log(figlet.textSync('SUCCESS!'));
  console.log(chalk.green.bold(`Airfoil NextJS App created! cd ${projectName} to start!`));
}

async function init() {
  startUp();
  validateNodeVersion();
  validateAppName();
  setProjectPath();
  validateProjectPath();
  try {
    cloneRepo();
    await installDependencies();
    copyBoilerplateFiles();
    cleanUp();
    success();
  } catch (err) {
    console.error(chalk.red(err));
    deleteDirectory();
  }
}

init();
