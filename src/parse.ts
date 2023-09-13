/* eslint-disable @typescript-eslint/naming-convention */
import * as fs from "fs";

export interface CodeSnippet {
  text: string;
  start_line: number;
  end_line: number;
}

export interface FlowSteps {
  document_name: string;
  document_path: string;
  project_name: string | null;
  start_linenumber: number;
  end_linenumber: number;
  start_codespan: number;
  end_codespan: number;
  step_type: string;
  step_text: string;
  code_snippet: CodeSnippet;
  document_extension: string;
}
export interface IssueState {
  id: string;
  project_name: string;
  rule_id: string;
  issue_id: string;
  weakness_id: string;
  scan_id: string;
  status: {
    value: string;
    description: string;
  };
  ticket: Record<string, any>;
  tags: Record<string, any>;
  severity: string;
  fixcost: string;
  history: {
    type: string;
    scanId?: string;
    status?: string;
    date: number;
  }[];
}

export interface KBFields {
  impacts: string[];
  labels: string[];
  rootcauses: string[];
  standards: string[];
  references: string[];
  platformnotes: {
    [key: string]: {
      [key: string]: {
        description: string;
        mitigation: string;
      };
    };
  };
  summary: {
    [key: string]: string;
  };
  title: {
    [key: string]: string;
  };
  trustlevel: {};
}

interface ParsedData {
  issueState: IssueState;
  kbFields: KBFields;
  flowSteps: FlowSteps;
}

export function parseData(data: any): ParsedData {
  const issueState: IssueState = {
    id: data.issue_state.id,
    project_name: data.issue_state.project_name,
    rule_id: data.issue_state.rule_id,
    issue_id: data.issue_state.issue_id,
    weakness_id: data.issue_state.weakness_id,
    scan_id: data.issue_state.scan_id,
    status: {
      value: data.issue_state.status.value,
      description: data.issue_state.status.description,
    },
    ticket: data.issue_state.ticket || {},
    tags: data.issue_state.tags || {},
    severity: data.issue_state.severity,
    fixcost: data.issue_state.fixcost,
    history: data.issue_state.history.map((entry: any) => ({
      type: entry.type,
      scan_id: entry.scan_id,
      status: entry.status,
      date: entry.date,
    })),
  };

  const kbFields: KBFields = {
    impacts: data.kb_fields.impacts,
    labels: data.kb_fields.labels,
    rootcauses: data.kb_fields.rootcauses,
    standards: data.kb_fields.standards,
    references: data.kb_fields.references || [],
    platformnotes: data.kb_fields.platformnotes,
    summary: data.kb_fields.summary,
    title: data.kb_fields.title,
    trustlevel: data.kb_fields.trustlevel,
  };
  const flowSteps: FlowSteps = {
    document_name: data.flow_steps.document_name,
    document_path: data.flow_steps.document_path,
    project_name: data.flow_steps.project_name,
    start_linenumber: data.flow_steps.start_linenumber,
    end_linenumber: data.flow_steps.end_linenumber,
    start_codespan: data.flow_steps.start_codespan,
    end_codespan: data.flow_steps.end_codespan,
    step_type: data.flow_steps.step_type,
    step_text: data.flow_steps.step_text,
    code_snippet: data.flow_steps.code_snippet?.map((entry: any) => ({
      text: entry.text,
      start_line: entry.start_line,
      end_line: entry.end_line,
    })),
    document_extension: data.flow_steps.document_extension,
  };

  return {
    issueState,
    kbFields,
    flowSteps,
  };
}

export function parseDataFromFile(filePath: string) {
  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(rawData);

    const parsedData = parseData(data);
  } catch (error) {
    console.error("Data parsing error:", error);
  }
}
