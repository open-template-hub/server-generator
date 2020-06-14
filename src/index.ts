#!/usr/bin/env node

import * as inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import * as shell from 'shelljs';
import chalk from 'chalk';
import * as yargs from 'yargs';
import { ncp } from 'ncp';
import * as rmdir from 'rimraf';
import { TemplateType, BRANCH_NAME, ProjectName, TEMPLATE_HUB_URL, PackageName } from './constant';

/**
 * @description holds the project generator
 */

 // Questions
const QUESTIONS = [
  {
    name: 'template',
    type: 'input',
    message: '1) Payment Server \n'
           + '  2) Basic Info Server \n'
           + '  3) Auth Server \n'
           +'  Please enter a server type you want to generate: ',
    when: () => !yargs.argv['template'],
    validate: (input: string) => {
      if (/^[1 | 2 | 3]$/.test(input)) return true;
      else return 'Please enter correct server type. Server type can be 1, 2 and 3.';
    }
  },
  {
    name: 'name',
    type: 'input',
    message: 'Project name: ',
    when: () => !yargs.argv['template'],
    validate: (input: string) => {
      if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
      else return 'Project name may only include letters, numbers, underscores and hashes.';
    }
  }
];

// current directory
const CURR_DIR = process.cwd();

// prompts questions to user
inquirer.prompt(QUESTIONS)
  .then(answers => {

    let userAnswers = Object.assign({}, answers, yargs.argv);

    const projectName = userAnswers['name'];
    const targetPath = path.join(CURR_DIR, projectName);

    if (!createProject(targetPath)) {
      return;
    }

    const templateType = userAnswers['template'];

    if(!cloneTemplate(targetPath, templateType)) {
      console.log(chalk.red('Can not clone the selected template.'));
      return;
    }

    if(!updateProjectName(targetPath, templateType, projectName)) {
      console.log(chalk.red('Can not set the project name.'));
      return;
    }

    if (!postProcessNode(targetPath)) {
      return;
    }

    showMessage(projectName);
  });

  const updateProjectName = (targetPath: string, templateType: string, projectName: string) => {
    let existingProjectName = "";
    let existingPackageName = "";
    shell.cd(targetPath);

    switch(templateType) {
      case TemplateType.AuthServer:
        existingProjectName = ProjectName.AuthServer;
        break;
      case TemplateType.PaymentServer:
        existingProjectName = ProjectName.PaymentServer;
        break;
      case TemplateType.BasicInfoServer:
        existingProjectName = ProjectName.BasicInfoServer;
        break;
    }

    switch(templateType) {
      case TemplateType.AuthServer:
        existingPackageName = PackageName.AuthServer;
        break;
      case TemplateType.PaymentServer:
        existingPackageName = PackageName.PaymentServer;
        break;
      case TemplateType.BasicInfoServer:
        existingPackageName = PackageName.BasicInfoServer;
        break;
    }

    let oldPath = path.join(targetPath, existingProjectName);

    ncp(oldPath, targetPath, function (err) {
      if (err) {
        return console.log(err);
      } else {
        rmdir(oldPath, (err: any) => {
          if (err) {
            return console.log(err);
          } else {
            let packageFile = path.join(targetPath, 'package.json');

            fs.readFile(packageFile, 'utf8', function (err,data) {
              if (err) {
                return console.log(err);
              }
              var result = data.replace(existingPackageName, projectName);
            
              fs.writeFile(packageFile, result, 'utf8', function (err) {
                 if (err) return console.log(err);
              });
            });
            const gitFolderPath = path.join(targetPath, ".git");
            rmdir(gitFolderPath, (err: any) => {
              if (err) {
                return console.log(err);
              }
            });
          }
      });
      }
    });

    return true;
  }

  const cloneTemplate = (targetPath: string, templateType: string) => {
    shell.cd(targetPath);

    let cmd = "";
    let clone = "git clone -b ";

    switch(templateType) {
      case TemplateType.AuthServer:
        cmd = clone + BRANCH_NAME + " " + TEMPLATE_HUB_URL + "/" + ProjectName.AuthServer;
        break;
      case TemplateType.PaymentServer:
        cmd = clone + BRANCH_NAME + " " + TEMPLATE_HUB_URL + "/" + ProjectName.PaymentServer;
        break;
      case TemplateType.BasicInfoServer:
        cmd = clone + BRANCH_NAME + " " + TEMPLATE_HUB_URL + "/" + ProjectName.BasicInfoServer;
        break;
    }
    console.log("command: ", cmd);
    const result = shell.exec(cmd);

    if (result.code !== 0) {
      return false;
    }
  
    return true;
  }

/**
 * shows message to user
 * @param projectName project name
 */  
const showMessage = (projectName: string) => {
  console.log('');
  console.log(chalk.green('Done.'));
  console.log(chalk.green(`Go into the project: cd ${projectName}`));
}

/**
 * creates project
 * @param projectPath project path
 * @returns true if folder does not already exist
 */
const createProject = (projectPath: string) => {
  if (fs.existsSync(projectPath)) {
    console.log(chalk.red(`Folder ${projectPath} exists. Delete or use another name.`));
    return false;
  }

  fs.mkdirSync(projectPath);
  return true;
}

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
    console.log(chalk.red('No yarn or npm found. Cannot run installation.'));
  }

  return true;
}