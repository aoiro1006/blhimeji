"use client";

import { useEffect, useRef } from "react";
import type { AdminEditorStateCallback } from "@/app/admin/types";

/** 親の editorState 登録（save/discard の参照変化で再実行しない） */
export function useRegisterAdminEditorState(
  onEditorStateChange: AdminEditorStateCallback | undefined,
  isDirty: boolean,
  save: () => Promise<boolean>,
  discard: () => void
) {
  const saveRef = useRef(save);
  const discardRef = useRef(discard);
  saveRef.current = save;
  discardRef.current = discard;

  useEffect(() => {
    if (!onEditorStateChange) return;
    onEditorStateChange({
      isDirty,
      save: () => saveRef.current(),
      discard: () => discardRef.current(),
    });
    return () => onEditorStateChange(null);
  }, [isDirty, onEditorStateChange]);
}
