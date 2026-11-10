import { Router } from '@angular/router';

/** Matches top-level navigation sections without activating sibling routes. */
export function isNavigationRouteActive(router: Router, baseRoute: string): boolean {
  const rawUrl = router.url;
  const path = (rawUrl.includes('#') ? rawUrl.slice(rawUrl.indexOf('#') + 1) : rawUrl)
    .split(/[?#]/, 1)[0]
    .replace(/\/+$/, '');
  const route = baseRoute.replace(/\/+$/, '');
  const currentSegments = path.split('/').filter(Boolean);
  const routeSegments = route.split('/').filter(Boolean);

  if (!routeSegments.length || !currentSegments.length) return false;

  // These two links share a URL section but represent separate destinations.
  if (route === '/dashboard/employees') {
    return currentSegments.join('/') === routeSegments.join('/');
  }
  if (route === '/dashboard/overview') {
    return currentSegments[0] === 'dashboard' && currentSegments[1] !== 'employees';
  }

  // Recruitment is a section link whose configured route is its landing page.
  if (route === '/recruitment/requisitions') {
    return currentSegments[0] === 'recruitment';
  }

  return currentSegments.length >= routeSegments.length &&
    routeSegments.every((segment, index) => currentSegments[index] === segment);
}
