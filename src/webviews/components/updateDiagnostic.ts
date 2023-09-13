"use strict";
import * as vscode from "vscode";
import * as path from "path";
import { initExtensionSettings, stateData } from "../../extensionSettings";
import { getProjectName } from "../../getRepoUrl";
import { KBFields, FlowSteps, IssueState } from "../../parse";
import { AIQuickAsk } from "./quickfix";

export let diaInfos: vscode.Diagnostic[] = [];

export function getDiagnostics() {
    return diaInfos;
}

export function setDiagnostics(newDiagnostics: vscode.Diagnostic[]) {
    diaInfos = newDiagnostics;
}

export function addDiagnostic(diagnostic: vscode.Diagnostic) {
    diaInfos.push(diagnostic);
}

export function updateDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
): void {
  setDiagnostics([]); // Clear the diagnostics array

  if (document && path.basename(document.uri.fsPath)) {
      const localProjectName = getProjectName() ?? ""; 
      const documentPath = document.uri.fsPath;
      const normalizedPath =
          path.sep === "\\" ? documentPath.replace(/\\/g, "/") : documentPath;

      let documentComponents = normalizedPath.substring(
          normalizedPath.indexOf(localProjectName) + localProjectName.length,
          normalizedPath.length - 1
      );

      let states = stateData.filter((state) => {
          return (
              state.flow_steps.filter((f: FlowSteps) => {
                  let path = f.document_path;
                  let index = path.substring(1, path.length - 1).indexOf("/");
                  let stateDataComponents = path.substring(index + 1, path.length - 1);
                  return stateDataComponents === documentComponents;
              }).length !== 0
          );
      });
      states.forEach((state) => {
          let range = new vscode.Range(
              state.flow_steps[0].start_linenumber - 1,
              state.flow_steps[0].start_codespan,
              state.flow_steps[0].end_linenumber - 1,
              state.flow_steps[0].end_codespan
          );

          // Fetch text from the document for the given range
          const diagnosticText = document.getText(range);
          const expectedStepText = state.flow_steps[0].step_text; // Assuming step_text holds the expected text

          // Check if the diagnosticText matches with expectedStepText
          if (diagnosticText.trim() === expectedStepText.trim()) {
              let diagnostic = {
                  code: state.issue_state.issue_id,
                  message: state.kb_fields.title.en,
                  range,
                  severity:
                      state.issue_state.severity === "high" ||
                          state.issue_state.severity === "critical"
                          ? vscode.DiagnosticSeverity.Error
                          : vscode.DiagnosticSeverity.Warning,
                  source: "CodeThreat SAST",
                  relatedInformation: state.flow_steps.map((f: FlowSteps) => {
                      return new vscode.DiagnosticRelatedInformation(
                          new vscode.Location(
                              document.uri,
                              new vscode.Range(
                                  f.start_linenumber - 1,
                                  f.start_codespan,
                                  f.start_linenumber - 1,
                                  f.end_codespan
                              )
                          ),
                          f.step_text + ":" + f.step_type
                      );
                  }),
              };

              addDiagnostic(diagnostic);  // Add each diagnostic using the new function
          }
          else{
                        // If the diagnosticText doesn't match the expectedStepText, set the severity to Information or another appropriate level
              let diagnostic = {
                code: state.issue_state.issue_id,
                message: state.kb_fields.title.en + " (modified code state)",  // Modify this message as needed
                range,
                severity: vscode.DiagnosticSeverity.Information, // Setting the severity to Information
                source: "CodeThreat SAST",
                relatedInformation: state.flow_steps.map((f: FlowSteps) => {
                    return new vscode.DiagnosticRelatedInformation(
                        new vscode.Location(
                            document.uri,
                            new vscode.Range(
                                f.start_linenumber - 1,
                                f.start_codespan,
                                f.start_linenumber - 1,
                                f.end_codespan
                            )
                        ),
                        f.step_text + ":" + f.step_type
                    );
                }),
            };

            addDiagnostic(diagnostic);  // Add the new diagnostic
          }
      });

      collection.set(document.uri, getDiagnostics());  // Use getDiagnostics to retrieve the current diagnostics
  }
}