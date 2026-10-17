"use client";

import { useSearchParams } from "next/navigation";
import { EditRequestDialog } from "./edit-request-dialog";
import { setDialogParams } from "./dialog-params";
import { RequestViewDialog } from "./request-view-dialog";

export function RequestDialogs() {
  const searchParams = useSearchParams();
  const viewId = searchParams.get("request");
  const editId = searchParams.get("edit");
  const cameFromView = searchParams.get("back") === "1";

  return (
    <>
      {/* Only one dialog is open at a time */}
      <RequestViewDialog
        id={editId ? null : viewId}
        onClose={() => setDialogParams({ request: null })}
        onEdit={(id) => setDialogParams({ edit: id, request: null, back: "1" })}
      />

      <EditRequestDialog
        id={editId}
        // closing edit returns to the view dialog when edit was opened from there
        onClose={() =>
          setDialogParams({
            edit: null,
            back: null,
            request: cameFromView ? editId : null,
          })
        }
      />
    </>
  );
}
