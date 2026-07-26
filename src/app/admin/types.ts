export interface AdminEditorState {
  isDirty: boolean;
  save: () => Promise<boolean>;
  discard: () => void;
}

export type AdminEditorStateCallback = (state: AdminEditorState | null) => void;
