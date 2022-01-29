#!/usr/bin/env node

import colors from 'colors';
import * as fs from 'fs';
import * as inquirer from 'inquirer';
import { ncp } from 'ncp';
import * as path from 'path';
import rmdir from 'rimraf';
import * as shell from 'shelljs';
import yargs from 'yargs/yargs';
import {
  BRANCH_NAME,
  PackageName,
  ProjectName,
  TEMPLATE_HUB_URL,
  TemplateType,
} from './constant';

// Questions
const QUESTIONS = [
  {
    name: 'template',
    type: 'input',
    message:
      '1) Payment Server \n' +
      '  2) Auth Server \n' +
      '  3) Business Logic Server \n' +
      '  4) File Storage Server \n' +
      '  5) Analytics Server \n' +
      '  6) Mail Server \n' +
      '  7) Sms Server \n' +
      '  Please enter a server type you want to generate: ',
    when: () => yargs().argv,
    validate: (input: string) => {
      if (/^[1 | 2 | 3 | 4 | 5 | 6 | 7]$/.test(input)) return true;
      else
        return 'Please enter correct server type. Server type can be 1, 2, 3, 4, 5, 6 and 7.';
    },
  },
  {
    name: 'name',
    type: 'input',
    message: 'Project name: ',
    when: () => yargs().argv,
    validate: (input: string) => {
      if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
      else
        return 'Project name may only include letters, numbers, underscores and hashes.';
    },
  },
];

// current directory
const CURR_DIR = process.cwd();

// prompts questions to user
inquirer.prompt(QUESTIONS).then((answers) => {
  let userAnswers = Object.assign({}, answers, yargs().argv);
  const projectName = userAnswers['name'];
  const targetPath = path.join(CURR_DIR, projectName);

  if (!createProject(targetPath)) {
    return;
  }

  const templateType = userAnswers['template'];

  if (!cloneTemplate(targetPath, templateType)) {
    console.log(colors.red('Can not clone the selected template.'));
    return;
  }

  if (!updateProjectName(targetPath, templateType, projectName)) {
    console.log(colors.red('Can not set the project name.'));
    return;
  }

  if (!postProcessNode(targetPath)) {
    return;
  }

  showMessage(projectName);
});

interface RepoConfig {
  projectName: string;
  packageName: string;
}

function updatePackageJson(
  targetPath: string,
  repoConfig: RepoConfig,
  projectName: string
) {
  let packageFile = path.join(targetPath, 'package.json');

  fs.readFile(packageFile, 'utf8', function (errReadFile, data) {
    if (errReadFile) {
      return console.log(errReadFile);
    }
    let result = data.replace(repoConfig.packageName, projectName);

    fs.writeFile(packageFile, result, 'utf8', function (errWriteFile) {
      if (errWriteFile) return console.log(errWriteFile);
    });
  });
}

const updateProjectName = (
  targetPath: string,
  templateType: string,
  projectName: string
) => {
  let repoConfig: RepoConfig = {
    packageName: '',
    projectName: '',
  };

  shell.cd(targetPath);

  switch (templateType) {
    case TemplateType.AuthServer:
      repoConfig.projectName = ProjectName.AuthServer;
      repoConfig.packageName = PackageName.AuthServer;
      break;
    case TemplateType.PaymentServer:
      repoConfig.projectName = ProjectName.PaymentServer;
      repoConfig.packageName = PackageName.PaymentServer;
      break;
    case TemplateType.BusinessLogicServer:
      repoConfig.projectName = ProjectName.BusinessLogicServer;
      repoConfig.packageName = PackageName.BusinessLogicServer;
      break;
    case TemplateType.FileStorageServer:
      repoConfig.projectName = ProjectName.FileStorageServer;
      repoConfig.packageName = PackageName.FileStorageServer;
      break;
    case TemplateType.AnalyticsServer:
      repoConfig.projectName = ProjectName.AnalyticsServer;
      repoConfig.packageName = PackageName.AnalyticsServer;
      break;
    case TemplateType.MailServer:
      repoConfig.projectName = ProjectName.MailServer;
      repoConfig.packageName = PackageName.MailServer;
      break;
    case TemplateType.SmsServer:
      repoConfig.projectName = ProjectName.SmsServer;
      repoConfig.packageName = PackageName.SmsServer;
      break;
  }

  let oldPath = path.join(targetPath, repoConfig.projectName);

  ncp(oldPath, targetPath, function (err) {
    if (err) {
      return console.log(err);
    }

    rmdir(oldPath, (errRmDir: any) => {
      if (errRmDir) {
        return console.log(errRmDir);
      }
      updatePackageJson(targetPath, repoConfig, projectName);

      const gitFolderPath = path.join(targetPath, '.git');

      rmdir(gitFolderPath, (errRmDirInner: any) => {
        if (errRmDirInner) {
          return console.log(errRmDirInner);
        }
      });
    });
  });

  return true;
};

const cloneTemplate = (targetPath: string, templateType: string) => {
  shell.cd(targetPath);

  let cmd = '';
  let clone = 'git clone -b ';

  switch (templateType) {
    case TemplateType.AuthServer:
      cmd =
        clone +
        BRANCH_NAME +
        ' ' +
        TEMPLATE_HUB_URL +
        '/' +
        ProjectName.AuthServer;
      break;
    case TemplateType.PaymentServer:
      cmd =
        clone +
        BRANCH_NAME +
        ' ' +
        TEMPLATE_HUB_URL +
        '/' +
        ProjectName.PaymentServer;
      break;
    case TemplateType.BusinessLogicServer:
      cmd =
        clone +
        BRANCH_NAME +
        ' ' +
        TEMPLATE_HUB_URL +
        '/' +
        ProjectName.BusinessLogicServer;
      break;
    case TemplateType.FileStorageServer:
      cmd =
        clone +
        BRANCH_NAME +
        ' ' +
        TEMPLATE_HUB_URL +
        '/' +
        ProjectName.FileStorageServer;
      break;
    case TemplateType.AnalyticsServer:
      cmd =
        clone +
        BRANCH_NAME +
        ' ' +
        TEMPLATE_HUB_URL +
        '/' +
        ProjectName.AnalyticsServer;
      break;
    case TemplateType.MailServer:
      cmd =
        clone +
        BRANCH_NAME +
        ' ' +
        TEMPLATE_HUB_URL +
        '/' +
        ProjectName.MailServer;
      break;
    case TemplateType.SmsServer:
      cmd =
        clone +
        BRANCH_NAME +
        ' ' +
        TEMPLATE_HUB_URL +
        '/' +
        ProjectName.SmsServer;
      break;
  }
  console.log('command: ', cmd);
  const result = shell.exec(cmd);

  if (result.code !== 0) {
    return false;
  }

  return true;
};

/**
 * shows message to user
 * @param projectName project name
 */
const showMessage = (projectName: string) => {
  console.log('');
  console.log(colors.green('Done.'));
  console.log(colors.green(`Go into the project: cd ${projectName}`));
};

/**
 * creates project
 * @param projectPath project path
 * @returns true if folder does not already exist
 */
const createProject = (projectPath: string) => {
  if (fs.existsSync(projectPath)) {
    console.log(
      colors.red(`Folder ${projectPath} exists. Delete or use another name.`)
    );
    return false;
  }

  fs.mkdirSync(projectPath);
  return true;
};

/**
 * applies post process for node,
 * npm install etc.
 * @param targetPath target path
 */
const postProcessNode = (targetPath: string) => {
  shell.cd(targetPath);

  let cmd = '';

  if (shell.which('yarn')) {
    cmd = 'yarn';
  } else if (shell.which('npm')) {
    cmd = 'npm install';
  }

  if (cmd) {
    const result = shell.exec(cmd);

    if (result.code !== 0) {
      return false;
    }
  } else {
    var message = colors.red('No yarn or npm found. Cannot run installation.');
    console.log(message);
  }

  return true;
};
