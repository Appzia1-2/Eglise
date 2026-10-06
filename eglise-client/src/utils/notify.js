import { toaster } from "../components/ui/toaster";

export const notifySuccess = (title, description) =>
  toaster.create({ type: "success", title, description, duration: 4000, closable: true });

export const notifyError = (title, description) =>
  toaster.create({ type: "error", title, description, duration: 7000, closable: true });

export const notifyWarning = (title, description) =>
  toaster.create({ type: "warning", title, description, duration: 5000, closable: true });

export const notifyInfo = (title, description) =>
  toaster.create({ type: "info", title, description, duration: 4000, closable: true });

const prettify = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const flatten = (data, parentKey = "") => {
  if (data == null) return [];
  if (typeof data === "string") {
    return [parentKey ? `${prettify(parentKey)}: ${data}` : data];
  }
  if (Array.isArray(data)) {
    return data.flatMap((item) => flatten(item, parentKey));
  }
  if (typeof data === "object") {
    return Object.entries(data).flatMap(([key, val]) =>
      flatten(
        val,
        key === "non_field_errors" || key === "detail" || key === "error"
          ? parentKey
          : key
      )
    );
  }
  return [String(data)];
};

export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  if (!error?.response) {
    return error?.request
      ? "Unable to reach the server. Please check your connection."
      : fallback;
  }

  const { status, data } = error.response;

  if (status >= 500) {
    return "A server error occurred. Please try again or contact support.";
  }
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You don't have permission to perform this action.";
  if (status === 404) return "The requested record was not found.";

  if (typeof data === "string") {
    return /<html|<!doctype/i.test(data) ? fallback : data;
  }

  const lines = flatten(data);
  return lines.length ? lines.join("\n") : fallback;
};