import { apiClient } from './lib/axios';
import { getPartnerProfile } from './lib/services';
const test = async () => {
  try {
    const rawRes = await getPartnerProfile();
    console.log('rawRes:', JSON.stringify(rawRes, null, 2));
  } catch (err) {
    console.error(err);
  }
};
test();
