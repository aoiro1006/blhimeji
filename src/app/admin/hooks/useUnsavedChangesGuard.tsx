"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminEditorState } from "@/app/admin/types";
import UnsavedChangesDialog from "@/app/admin/components/UnsavedChangesDialog";

export function useUnsavedChangesGuard(editorState: AdminEditorState | null) {
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isDirty = editorState?.isDirty ?? false;

  const requestAction = useCallback(
    (action: () => void) => {
      if (!editorState?.isDirty) {
        action();
        return;
      }
      setPendingAction(() => action);
      setOpen(true);
    },
    [editorState]
  );

  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const completeAction = useCallback(() => {
    const action = pendingAction;
    setOpen(false);
    setPendingAction(null);
    action?.();
  }, [pendingAction]);

  const handleSave = useCallback(async () => {
    if (!editorState) return;
    setSaving(true);
    try {
      const ok = await editorState.save();
      if (ok) completeAction();
    } finally {
      setSaving(false);
    }
  }, [editorState, completeAction]);

  const handleDiscard = useCallback(() => {
    editorState?.discard();
    completeAction();
  }, [editorState, completeAction]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    setPendingAction(null);
  }, []);

  const dialog = open ? (
    <UnsavedChangesDialog
      saving={saving}
      onSave={handleSave}
      onDiscard={handleDiscard}
      onCancel={handleCancel}
    />
  ) : null;

  return { requestAction, dialog, isDirty };
}
