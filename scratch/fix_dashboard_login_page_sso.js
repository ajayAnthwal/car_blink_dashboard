const fs = require('fs');

// 1. Update login/page.tsx in dashboard
const loginPageFile = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard/app/(auth)/login/page.tsx';
let loginCode = fs.readFileSync(loginPageFile, 'utf8');

loginCode = loginCode.replaceAll(
  'document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";',
  'document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";\n      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";'
);

loginCode = loginCode.replaceAll(
  'document.cookie = `role=${encodeURIComponent(resolvedUser.role)}; path=/; expires=${expires}; SameSite=Lax`;',
  'document.cookie = `role=${encodeURIComponent(resolvedUser.role)}; path=/; expires=${expires}; SameSite=Lax`;\n          document.cookie = `user_role=${encodeURIComponent(resolvedUser.role)}; path=/; expires=${expires}; SameSite=Lax`;'
);

fs.writeFileSync(loginPageFile, loginCode);
console.log('Successfully updated login/page.tsx cookie handling');

// 2. Update middleware.ts in dashboard
const middlewareFile = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard/middleware.ts';
let middlewareCode = fs.readFileSync(middlewareFile, 'utf8');

middlewareCode = middlewareCode.replace(
  'userRole = request.cookies.get("role")?.value || null;',
  'userRole = request.cookies.get("role")?.value || request.cookies.get("user_role")?.value || null;'
);

fs.writeFileSync(middlewareFile, middlewareCode);
console.log('Successfully updated middleware.ts user_role fallback');
