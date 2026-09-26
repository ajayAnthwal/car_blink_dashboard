const fs = require('fs');
const filePath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/customer/sub-modules/booking/booking.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

const target = `    const booking = await BookingModel.findById(bookingId)
      .populate('vehicleId')
      .populate('serviceId')
      .populate('cityId')
      .lean();`;

const replacement = `    const booking = await BookingModel.findById(bookingId)
      .populate('vehicleId')
      .populate('serviceId')
      .populate('cityId')
      .populate({
        path: 'assignedPartnerId',
        populate: { path: 'userId', select: 'fullName email phone' }
      })
      .populate('acceptedBidId')
      .lean();`;

if (content.includes(target)) {
  content = content.replace(target, replacement);

  // Also update privacy masking logic in getBookingById
  const target2 = `    return {
      ...booking,
      jobDetails: jobDetails || null,
      payments: payments || []
    };`;

  const replacement2 = `    const hasPaid15PercentAdvance = payments && payments.some((p) => p.status === 'SUCCESS' && p.amount > 0);
    const isUnlocked = hasPaid15PercentAdvance || ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status);

    let assignedPartner = booking.assignedPartnerId;
    if (assignedPartner && !isUnlocked) {
      assignedPartner = {
        ...assignedPartner,
        businessName: 'Verified CarBlink Workshop',
        businessAddress: 'Unlocked after 15% advance payment',
        phone: '+91 XXXXX XXXXX',
        userId: {
          fullName: 'CarBlink Certified Partner',
          email: 'unlocked_after_payment@carblink.in',
          phone: '+91 XXXXX XXXXX'
        }
      };
    }

    return {
      ...booking,
      assignedPartnerId: assignedPartner,
      jobDetails: jobDetails || null,
      payments: payments || []
    };`;

  if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated getBookingById partner population & masking in booking.service.ts');
} else {
  console.log('Target already updated or not found');
}
