export interface Action {
  id: string;
  title: string;
  command: string;
  icon?: string;
  when: string;
  priority?: number;
  enabled?: boolean;
  exts?: string;
}

export interface ActionContext {
  languageId: string;
  fileName: string;
  fileExt: string;
  isDirty: boolean;
  isUntitled: boolean;
  selectionEmpty: boolean;
  workspaceName?: string;
}

export interface SlotState {
  id: string;
  actionId: string;
  command: string;
  icon: string;
  visible: boolean;
}
