export function resolveReturnTo(returnTo: string | null | undefined, fallback: string) {
  if (!returnTo) {
    return fallback;
  }

  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return fallback;
  }

  return returnTo;
}

export function appendReturnTo(href: string, returnTo: string | null | undefined) {
  if (!returnTo) {
    return href;
  }

  const resolved = resolveReturnTo(returnTo, '');
  if (!resolved) {
    return href;
  }

  const url = new URL(href, 'http://localhost');
  url.searchParams.set('returnTo', resolved);

  const search = url.searchParams.toString();
  return search ? `${url.pathname}?${search}` : url.pathname;
}
