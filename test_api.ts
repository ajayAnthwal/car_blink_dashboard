import { apiClient } from './lib/axios';
import { getCities, getGarageVehicles } from './lib/services';

const test = async () => {
  try {
    const rawRes = await apiClient.get('/cities');
    console.log('rawRes:', rawRes);

    const citiesRes = await getCities();
    console.log('getCities():', citiesRes);

    const vehiclesRes = await getGarageVehicles();
    console.log('getGarageVehicles():', vehiclesRes);
  } catch (err) {
    console.error(err);
  }
};

test();
