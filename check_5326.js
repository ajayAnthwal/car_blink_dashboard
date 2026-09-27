const path = require('path');
const backendDir = 'c:/Users/ajay anthwal/Desktop/car_blink_backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const mongoose = require(path.join(backendDir, 'node_modules/mongoose'));

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const customerIdStr = '6ab772ac32d9bf3f1c958108';
  const customerIdObj = new mongoose.Types.ObjectId(customerIdStr);
  const userPhone = '7078235326';

  const userFilterOld = { $or: [{ customerId: customerIdStr }, { phone: userPhone }] };
  const countOld = await db.collection('bookings').countDocuments(userFilterOld);
  console.log('Count with userFilterOld (string customerId):', countOld);

  const userFilterNew = { 
    $or: [
      { customerId: customerIdObj }, 
      { customerId: customerIdStr }, 
      { phone: userPhone },
      { phone: '+917078235326' },
      { phone: '917078235326' }
    ] 
  };
  const countNew = await db.collection('bookings').countDocuments(userFilterNew);
  console.log('Count with userFilterNew (ObjectId + string customerId + phone variants):', countNew);

  process.exit(0);
}).catch(err => {
  console.error('DB Error:', err);
  process.exit(1);
});
