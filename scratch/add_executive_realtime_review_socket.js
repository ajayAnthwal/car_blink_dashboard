const fs = require('fs');

const reviewServicePath = 'C:/Users/ajay anthwal/Desktop/car_blink_backend/src/modules/review/review.service.ts';
let serviceContent = fs.readFileSync(reviewServicePath, 'utf8');

const faultyBlock = `    // 8. Live Real-Time Socket Broadcast & Notification to Executives & Admins
    try {
      const { emitToRole } = require('../../sockets');
      const { ROLES } = require('../../common/constants/roles.constant');
      const customer = await UserModel.findById(data.customerId);

      const reviewPayload = {
        reviewId: review._id.toString(),
        bookingId: data.bookingId,
        rating: data.rating,
        comment: review.comment,
        customerName: customer?.fullName || 'Customer',
        partnerId: job.partnerId,
        createdAt: review.createdAt
      };

      // Real-time socket broadcast to Executives and Admins
      emitToRole(ROLES.EXECUTIVE, 'review_submitted', reviewPayload);
      emitToRole(ROLES.EXECUTIVE, 'review:submitted', reviewPayload);
      emitToRole(ROLES.SUPER_ADMIN, 'review_submitted', reviewPayload);
      emitToRole(ROLES.SUPER_ADMIN, 'review:submitted', reviewPayload);

      // Save notification to Executive portal
      await notificationService.sendToRole(
        ROLES.EXECUTIVE,
        NOTIFICATION_TYPE.PUSH,
        NOTIFICATION_CATEGORY.REVIEW_RECEIVED,
        '⭐ New Customer Satisfaction Rating Received',
        \`\${customer?.fullName || 'Customer'} submitted a \${data.rating}/5 ⭐ rating for booking #\${data.bookingId.slice(-6).toUpperCase()}: "\${review.comment || 'No comment'}"\`,
        reviewPayload
      );
    } catch (realtimeErr: any) {
      logger.warn('Failed to dispatch real-time review notification to executive:', realtimeErr);
    }`;

const fixedBlock = `    // 8. Live Real-Time Socket Broadcast & Notification to Executives & Admins
    try {
      const { emitToRole } = require('../../sockets');
      const { ROLES } = require('../../common/constants/roles.constant');
      const { UserModel } = require('../user/user.model');
      const customer = await UserModel.findById(customerId);

      const reviewPayload = {
        reviewId: review._id.toString(),
        bookingId: data.bookingId,
        rating: data.rating,
        comment: review.comment,
        customerName: customer?.fullName || 'Customer',
        partnerId: job.partnerId,
        createdAt: review.createdAt
      };

      // Real-time socket broadcast to Executives and Admins
      emitToRole(ROLES.EXECUTIVE, 'review_submitted', reviewPayload);
      emitToRole(ROLES.EXECUTIVE, 'review:submitted', reviewPayload);
      emitToRole(ROLES.SUPER_ADMIN, 'review_submitted', reviewPayload);
      emitToRole(ROLES.SUPER_ADMIN, 'review:submitted', reviewPayload);

      // Save notification to Executive portal
      await notificationService.sendToRole(
        ROLES.EXECUTIVE,
        NOTIFICATION_TYPE.PUSH,
        NOTIFICATION_CATEGORY.REVIEW_RECEIVED,
        '⭐ New Customer Satisfaction Rating Received',
        \`\${customer?.fullName || 'Customer'} submitted a \${data.rating}/5 ⭐ rating for booking #\${data.bookingId.slice(-6).toUpperCase()}: "\${review.comment || 'No comment'}"\`,
        reviewPayload
      );
    } catch (realtimeErr: any) {
      logger.warn('Failed to dispatch real-time review notification to executive:', realtimeErr);
    }`;

serviceContent = serviceContent.replace(faultyBlock, fixedBlock);
fs.writeFileSync(reviewServicePath, serviceContent, 'utf8');
console.log('Successfully fixed customerId parameter and UserModel import in review.service.ts!');
