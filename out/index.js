"use strict";
/**
 * @description holds the project generator
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var inquirer = __importStar(require("inquirer"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var shell = __importStar(require("shelljs"));
var chalk_1 = __importDefault(require("chalk"));
var yargs_1 = __importDefault(require("yargs"));
var ncp_1 = require("ncp");
var rimraf_1 = __importDefault(require("rimraf"));
var constant_1 = require("./constant");
// Questions
var QUESTIONS = [
    {
        name: 'template',
        type: 'input',
        message: '1) Payment Server \n' +
            '  2) Auth Server \n' +
            '  3) Basic Info Server \n' +
            '  4) File Storage Server \n' +
            '  5) Analytics Server \n' +
            '  Please enter a server type you want to generate: ',
        when: function () { return !yargs_1.default.argv['template']; },
        validate: function (input) {
            if (/^[1 | 2 | 3 | 4 | 5]$/.test(input))
                return true;
            else
                return 'Please enter correct server type. Server type can be 1, 2, 3, 4 and 5.';
        },
    },
    {
        name: 'name',
        type: 'input',
        message: 'Project name: ',
        when: function () { return !yargs_1.default.argv['template']; },
        validate: function (input) {
            if (/^([A-Za-z\-\_\d])+$/.test(input))
                return true;
            else
                return 'Project name may only include letters, numbers, underscores and hashes.';
        },
    },
];
// current directory
var CURR_DIR = process.cwd();
// prompts questions to user
inquirer.prompt(QUESTIONS).then(function (answers) {
    var userAnswers = Object.assign({}, answers, yargs_1.default.argv);
    var projectName = userAnswers['name'];
    var targetPath = path.join(CURR_DIR, projectName);
    if (!createProject(targetPath)) {
        return;
    }
    var templateType = userAnswers['template'];
    if (!cloneTemplate(targetPath, templateType)) {
        console.log(chalk_1.default.red('Can not clone the selected template.'));
        return;
    }
    if (!updateProjectName(targetPath, templateType, projectName)) {
        console.log(chalk_1.default.red('Can not set the project name.'));
        return;
    }
    if (!postProcessNode(targetPath)) {
        return;
    }
    showMessage(projectName);
});
var updateProjectName = function (targetPath, templateType, projectName) {
    var existingProjectName = '';
    var existingPackageName = '';
    shell.cd(targetPath);
    switch (templateType) {
        case constant_1.TemplateType.AuthServer:
            existingProjectName = constant_1.ProjectName.AuthServer;
            existingPackageName = constant_1.PackageName.AuthServer;
            break;
        case constant_1.TemplateType.PaymentServer:
            existingProjectName = constant_1.ProjectName.PaymentServer;
            existingPackageName = constant_1.PackageName.PaymentServer;
            break;
        case constant_1.TemplateType.BasicInfoServer:
            existingProjectName = constant_1.ProjectName.BasicInfoServer;
            existingPackageName = constant_1.PackageName.BasicInfoServer;
            break;
        case constant_1.TemplateType.FileStorageServer:
            existingProjectName = constant_1.ProjectName.FileStorageServer;
            existingPackageName = constant_1.PackageName.FileStorageServer;
            break;
        case constant_1.TemplateType.AnalyticsServer:
            existingProjectName = constant_1.ProjectName.AnalyticsServer;
            existingPackageName = constant_1.PackageName.AnalyticsServer;
            break;
    }
    var oldPath = path.join(targetPath, existingProjectName);
    ncp_1.ncp(oldPath, targetPath, function (err) {
        if (err) {
            return console.log(err);
        }
        else {
            rimraf_1.default(oldPath, function (errRmDir) {
                if (errRmDir) {
                    return console.log(errRmDir);
                }
                else {
                    var packageFile_1 = path.join(targetPath, 'package.json');
                    fs.readFile(packageFile_1, 'utf8', function (errReadFile, data) {
                        if (errReadFile) {
                            return console.log(errReadFile);
                        }
                        var result = data.replace(existingPackageName, projectName);
                        fs.writeFile(packageFile_1, result, 'utf8', function (errWriteFile) {
                            if (errWriteFile)
                                return console.log(errWriteFile);
                        });
                    });
                    var gitFolderPath = path.join(targetPath, '.git');
                    rimraf_1.default(gitFolderPath, function (errRmDirInner) {
                        if (errRmDirInner) {
                            return console.log(errRmDirInner);
                        }
                    });
                }
            });
        }
    });
    return true;
};
var cloneTemplate = function (targetPath, templateType) {
    shell.cd(targetPath);
    var cmd = '';
    var clone = 'git clone -b ';
    switch (templateType) {
        case constant_1.TemplateType.AuthServer:
            cmd =
                clone +
                    constant_1.BRANCH_NAME +
                    ' ' +
                    constant_1.TEMPLATE_HUB_URL +
                    '/' +
                    constant_1.ProjectName.AuthServer;
            break;
        case constant_1.TemplateType.PaymentServer:
            cmd =
                clone +
                    constant_1.BRANCH_NAME +
                    ' ' +
                    constant_1.TEMPLATE_HUB_URL +
                    '/' +
                    constant_1.ProjectName.PaymentServer;
            break;
        case constant_1.TemplateType.BasicInfoServer:
            cmd =
                clone +
                    constant_1.BRANCH_NAME +
                    ' ' +
                    constant_1.TEMPLATE_HUB_URL +
                    '/' +
                    constant_1.ProjectName.BasicInfoServer;
            break;
        case constant_1.TemplateType.FileStorageServer:
            cmd =
                clone +
                    constant_1.BRANCH_NAME +
                    ' ' +
                    constant_1.TEMPLATE_HUB_URL +
                    '/' +
                    constant_1.ProjectName.FileStorageServer;
            break;
        case constant_1.TemplateType.AnalyticsServer:
            cmd =
                clone +
                    constant_1.BRANCH_NAME +
                    ' ' +
                    constant_1.TEMPLATE_HUB_URL +
                    '/' +
                    constant_1.ProjectName.AnalyticsServer;
            break;
    }
    console.log('command: ', cmd);
    var result = shell.exec(cmd);
    if (result.code !== 0) {
        return false;
    }
    return true;
};
/**
 * shows message to user
 * @param projectName project name
 */
var showMessage = function (projectName) {
    console.log('');
    console.log(chalk_1.default.green('Done.'));
    console.log(chalk_1.default.green("Go into the project: cd " + projectName));
};
/**
 * creates project
 * @param projectPath project path
 * @returns true if folder does not already exist
 */
var createProject = function (projectPath) {
    if (fs.existsSync(projectPath)) {
        console.log(chalk_1.default.red("Folder " + projectPath + " exists. Delete or use another name."));
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
var postProcessNode = function (targetPath) {
    shell.cd(targetPath);
    var cmd = '';
    if (shell.which('yarn')) {
        cmd = 'yarn';
    }
    else if (shell.which('npm')) {
        cmd = 'npm install';
    }
    if (cmd) {
        var result = shell.exec(cmd);
        if (result.code !== 0) {
            return false;
        }
    }
    else {
        console.log(chalk_1.default.red('No yarn or npm found. Cannot run installation.'));
    }
    return true;
};
//# sourceMappingURL=index.js.map