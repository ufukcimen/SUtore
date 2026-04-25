export function getDownloadFilename(response, fallback) {
  const disposition = response.headers?.["content-disposition"];
  if (typeof disposition !== "string") {
    return fallback;
  }

  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1].trim());
  }

  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (filenameMatch?.[1]) {
    return filenameMatch[1].trim();
  }

  return fallback;
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function downloadResponseBlob(response, fallbackFilename) {
  downloadBlob(response.data, getDownloadFilename(response, fallbackFilename));
}
