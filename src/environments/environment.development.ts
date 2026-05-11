/**
 * Used when running `ng serve` (development configuration).
 *
 * Relative `/api` is forwarded by `proxy.conf.json` to your local ASP.NET URL.
 * Edit the `target` in proxy.conf.json to match EmployeesAPI launchSettings.json (https profile: 7065; IIS Express uses different ports).
 */
export const environment = {
  production: false,
  apiBaseUrl: '/api',
};
