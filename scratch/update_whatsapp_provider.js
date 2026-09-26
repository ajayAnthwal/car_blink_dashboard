const fs = require('fs');

const file = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/notification/providers/whatsapp.provider.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Fix components push condition: change bodyValues.length > 0 to sanitizedParams.length > 0
code = code.replace(
  'if (bodyValues.length > 0) {',
  'if (sanitizedParams.length > 0) {'
);

// 2. Update Graph API URL v18.0 to v20.0
code = code.replaceAll('v18.0', 'v20.0');

// 3. Add automatic language fallback (en_US -> en) if template language code mismatch occurs
if (!code.includes("language: { code: 'en' }")) {
  const oldMetaSend = `        const response = await axios.post(
          \`https://graph.facebook.com/v20.0/\${this.phoneNumberId}/messages\`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: \`Bearer \${this.whatsappToken}\`
            },
            timeout: 10000
          }
        );

        logger.info(\`[META WHATSAPP TEMPLATE SUCCESS] Message sent to \${formattedPhone}\`);
        return { success: true, data: response.data };`;

  const newMetaSend = `        let response;
        try {
          response = await axios.post(
            \`https://graph.facebook.com/v20.0/\${this.phoneNumberId}/messages\`,
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: \`Bearer \${this.whatsappToken}\`
              },
              timeout: 10000
            }
          );
        } catch (langErr: any) {
          // If en_US language fails, retry automatically with 'en' language code
          if (langErr.response?.data?.error?.code === 132001 || langErr.response?.data?.error?.message?.includes('translation')) {
            payload.template.language = { code: 'en' };
            response = await axios.post(
              \`https://graph.facebook.com/v20.0/\${this.phoneNumberId}/messages\`,
              payload,
              {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: \`Bearer \${this.whatsappToken}\`
                },
                timeout: 10000
              }
            );
          } else {
            throw langErr;
          }
        }

        logger.info(\`[META WHATSAPP TEMPLATE SUCCESS] Message sent to \${formattedPhone}\`);
        return { success: true, data: response.data };`;

  code = code.replace(oldMetaSend, newMetaSend);
}

fs.writeFileSync(file, code);
console.log('Successfully updated whatsapp.provider.ts with automatic template parameter & language fixes');
