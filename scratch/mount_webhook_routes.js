const fs = require('fs');

const file = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/routes/index.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('whatsappWebhookRouter')) {
  code = code.replace(
    "import notificationRouter from '../modules/notification/notification.routes';",
    "import notificationRouter from '../modules/notification/notification.routes';\nimport whatsappWebhookRouter from '../modules/notification/whatsapp-webhook.routes';"
  );
  code = code.replace(
    "router.use('/notifications', notificationRouter);",
    "router.use('/notifications', notificationRouter);\nrouter.use('/webhook/whatsapp', whatsappWebhookRouter);"
  );
  fs.writeFileSync(file, code);
  console.log('Successfully mounted whatsappWebhookRouter in src/routes/index.ts');
} else {
  console.log('Already mounted');
}
