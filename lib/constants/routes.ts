/**
 * Route constants
 * Single source of truth for all application routes
 */

export const ROUTES = {
  /** Public entry page */
  home: '/',

  /** Authentication */
  auth: {
    login: '/auth/login',
    changePassword: '/auth/change-password',
  },

  /** Internal system (protected) */
  system: {
    root: '/system',
    changePassword: '/system/change-password',
    people: '/system/people',
    memberships: '/system/memberships',
    staff: '/system/staff',
    roles: '/system/roles',
    sportsSettings: '/system/sports/settings',
    sportsPlayers: '/system/sports/players',
    medicalApprovals: '/system/sports/medical-approvals',
    trainingGroups: '/system/sports/training-groups',
    pricingPlans: '/system/sports/pricing-plans',
    subscriptions: '/system/sports/subscriptions',
    attendance: '/system/sports/attendance',
    facilitiesSettings: '/system/facilities/settings',
    facilitiesSchedule: '/system/facilities/schedule',
    cmsArticles: '/system/cms/articles',
    cmsCategories: '/system/cms/categories',
    cmsMedia: '/system/cms/media',
  },
} as const;

/** Routes that require authentication */
export const PROTECTED_ROUTES = ['/system'] as const;

/** Routes that are always public */
export const PUBLIC_ROUTES = ['/', '/auth'] as const;
