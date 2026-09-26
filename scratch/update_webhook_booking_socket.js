const fs = require('fs');
const filePath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/payment/payment.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

const target = `        if (payment && payment.status !== PAYMENT_STATUS.SUCCESS) {
          payment.status = PAYMENT_STATUS.SUCCESS;
          payment.providerPaymentId = paymentId;
          payment.paidAt = new Date();
          await payment.save();
          logger.info(
            \`Webhook successfully processed: Payment \${payment._id} set to SUCCESS\`,
          );
        }`;

const replacement = `        if (payment && payment.status !== PAYMENT_STATUS.SUCCESS) {
          payment.status = PAYMENT_STATUS.SUCCESS;
          if (paymentId) payment.providerPaymentId = paymentId;
          payment.paidAt = new Date();
          await payment.save();

          // Update associated Booking status if PENDING
          if (payment.bookingId) {
            const booking = await BookingModel.findById(payment.bookingId);
            if (booking && booking.status === BOOKING_STATUS.PENDING) {
              booking.status = BOOKING_STATUS.ACCEPTED;
              await booking.save();
            }
          }

          if (payment.couponCode) {
            const { CouponService } = require("../super-admin/sub-modules/coupons/coupons.service");
            await CouponService.incrementCouponUsage(payment.couponCode).catch(() => {});
          }

          // Emit live socket updates so dashboard updates instantly without page refresh!
          try {
            const socketPayload = {
              bookingId: payment.bookingId,
              paymentId: payment._id,
              status: payment.status,
              amount: payment.amount,
              type: payment.paymentType,
              method: payment.provider,
            };
            emitToUser(
              payment.customerId.toString(),
              "payment_status_update",
              socketPayload,
            );

            const job = await JobModel.findOne({ bookingId: payment.bookingId });
            if (job && job.partnerId) {
              emitToUser(
                job.partnerId.toString(),
                "payment_status_update",
                socketPayload,
              );
            }
          } catch (socketErr) {
            logger.warn("Webhook socket emit failed:", socketErr);
          }

          logger.info(
            \`Webhook successfully processed: Payment \${payment._id} set to SUCCESS\`,
          );
        }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated booking & socket logic in handleWebhook in payment.service.ts');
} else {
  console.log('Target already updated or not found');
}
