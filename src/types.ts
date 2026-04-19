export interface Action {
  id: string;
  title: string;
  command: string;
  icon?: string;
  when: string; // We'll support string expressions
  priority?: number;
}

export interface ActionContext {
  languageId: string;
  fileName: string;
  fileExt: string;
  isDirty: boolean;
  isUntitled: boolean;
  selectionEmpty: boolean;
  workspaceName?: string;
  gitBranch?: string; // Optional future expansion
}

export interface SlotState {
  id: string;
  actionId: string;
  command: string;
  icon: string;
  visible: boolean;
}
