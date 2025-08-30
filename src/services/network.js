export function toErrorMessage(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'object' && 'status' in error && typeof error.status === 'number') {
    const status = error.status;
    if (status === 0) return 'Network error';
    if (status === 404) return 'Not found 404';
    if (status === 429) return 'Too many requests';
    if (status >= 500) return 'Server error';
    return error.message || `Request failed ${status}`;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String(error.message);
  return String(error);
}
