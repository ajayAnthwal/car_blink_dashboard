const fs = require('fs');

const controllerFile = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/auth/auth.controller.ts';
let code = fs.readFileSync(controllerFile, 'utf8');

const targetLine = "res.cookie('role', result.user?.role || 'CUSTOMER', { ...cookieOpts, httpOnly: false });";
const replacement = "res.cookie('role', result.user?.role || 'CUSTOMER', { ...cookieOpts, httpOnly: false });\n      res.cookie('user_role', result.user?.role || 'CUSTOMER', { ...cookieOpts, httpOnly: false });";

code = code.replaceAll(targetLine, replacement);

fs.writeFileSync(controllerFile, code);
console.log('Successfully updated auth.controller.ts to set both role and user_role cookies on all login/register handlers');
