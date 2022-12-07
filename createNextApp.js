#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const figlet = require('figlet');
const prompts = require('prompts');
const validate = require('validate-npm-package-name');

/**
 *
 * 1. check node version
 * 2. run init function
 * 3. validate projectName
 * 4. check yarn, pnpm, npm versions
 * 5. compile commands for installation
 * 6. install the dependencies
 */

/**
 * Questions to ask
 *
 * 1. yarn, pnpm, npm
 * 2. CSS styling, ChakraUI/Tailwindcss/None
 */

let projectName, projectPath;
const GITHUB_REPO = 'git@github.com:Aztriltus/nextjs-ts-tailwind-template.git';

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
      return 'chakra-ui/react @emotion/react@^11 @emotion/styled@^11 framer-motion@^6';
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
    console.error(
      'You are running Node ' +
        currentNodeVersion +
        '.\n' +
        'Create Airfoil Next App requires Node 14 or higher. \n' +
        'Please update your version of Node.'
    );
    process.exit(1);
  }
}

function validateAppName() {
  if (process.argv.length < 3) {
    console.log('You have to provide a name to your app.');
    console.log('For example :');
    console.log(' npx create-airfoil-nextjs-app my-app');
    process.exit(1);
  }

  projectName = process.argv[2];

  // making sure the project name conforms to NPM naming convention
  const validationResult = validate(projectName);
  if (!validationResult.validForNewPackages) {
    console.error(
      `Error: cannot create a project named ${projectName} because of npm naming restrictions.`
    );
    console.log(`Please fix the errors below: `);
    validationResult.errors.forEach((err) => console.error(`${err}`));
    validationResult.warnings.forEach((warning) => console.warn(`${warning}`));
  }
}

function validateProjectPath() {
  if (fs.existsSync(projectPath)) {
    console.error('Error: Directory already exist');
    process.exit(1);
  }
}

function cloneRepo() {
  console.log('Cloning files...');
  execSync(`git clone --depth 1 ${GITHUB_REPO} ${projectPath}`);
}

async function installDependencies() {
  // ask for npm, yarn, pnpm choice
  // let packageManager = 'npm';
  // change working directory
  process.chdir(projectPath);

  const { packageManager, cssStyling } = await prompts(questions);
  const cssStyleDependencies = getCssDependencies(cssStyling)

  console.log('Installing dependencies...');
  // option to use PNPM, Yarn and NPM
  execSync(`${packageManager} install`);
  if (cssStyleDependencies) {
    execSync(`${packageManager} install ${cssStyleDependencies}`);
  }
}

function cleanUp() {
  console.log('Cleaning up');
  execSync('npx rimraf ./.git');
}

function deleteDirectory() {
  console.log('Removing project');
  fs.rmdirSync(projectPath, { recursive: true });
}

function startUp() {
  console.log(figlet.textSync('Create Airfoil NextJS App'));
}

function success() {
  console.log(figlet.textSync('SUCCESS!'));
  console.log(`Airfoil NextJS App created! cd ${projectName} to start!`);
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
    cleanUp();
    success();
  } catch (err) {
    console.error(err);
    deleteDirectory();
  }
}

init();
