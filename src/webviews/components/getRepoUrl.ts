import * as fs from "fs";
import * as vscode from "vscode";
import * as path from "path";

export function getRepositoryURL(): string | null {
  try {
    //@ts-ignore
    const workspaceFolderPath = vscode.workspace.workspaceFolders[0]?.uri.path; 
    if (workspaceFolderPath) {
      let gitConfigPath = path.join(workspaceFolderPath, ".git/config");
      gitConfigPath = gitConfigPath.substring(1,gitConfigPath.length);

      if (fs.existsSync(gitConfigPath)) {
        const gitConfig = fs.readFileSync(gitConfigPath, "utf-8");
        const match = gitConfig.match(/url = (.+)/);
        if (match && match[1]) {
          return match[1];
        }
      }else{
        throw new Error("Folder Not Found! ");
      }
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(" Repository information not found! ");
    return error;
  }

  return null;
}

export function getProjectName(): string | undefined   {
  try {
    const url=getRepositoryURL();
    if (url===null) {
      throw new Error("Url is undefined! ");
      
    }
    const startIndex = url.lastIndexOf('/') + 1;
    const endIndex = url.lastIndexOf('.git');
    const repoName = url.substring(startIndex, endIndex);
    return repoName;
  } catch (error: any) {
    vscode.window.showErrorMessage("Project name not found! ");
    return error;
  }
}

export function getCurrentBranchName(): string | null {
  try {
//@ts-ignore
const workspaceFolderPath = vscode.workspace.workspaceFolders[0]?.uri.path; 
if (workspaceFolderPath) {
  let gitPath = path.join(workspaceFolderPath, ".git");
  gitPath = gitPath.substring(1,gitPath.length);
  if (fs.existsSync(gitPath)) {
    const configPath = path.join(gitPath, "HEAD");
    const configContent =  fs.readFileSync(configPath, "utf-8");
    const match = configContent.match(/ref: refs\/heads\/(.+)/);

    if (match && match[1]) {
      return match[1];
    }
  }
}
  } catch (error: any) {
    vscode.window.showErrorMessage("Github Branch not found! ");
    return error;
  }

  return null;
}
