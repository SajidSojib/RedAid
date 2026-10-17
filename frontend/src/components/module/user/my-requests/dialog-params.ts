type DialogParam = "request" | "edit" | "back";

// Updates the URL without a server round trip. useSearchParams() still picks the change up.
export function setDialogParams(
  changes: Partial<Record<DialogParam, string | null>>,
) {
  const url = new URL(window.location.href);

  for (const [key, value] of Object.entries(changes)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }

  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

// Full-screen on phones, a normal dialog from sm up
export const DIALOG_BASE =
  "flex h-dvh max-h-dvh w-screen max-w-none flex-col gap-0 rounded-none p-0 sm:h-auto sm:max-h-[88vh] sm:w-full sm:rounded-xl";
