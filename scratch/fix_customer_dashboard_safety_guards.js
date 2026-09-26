const fs = require('fs');

const customerFile = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard/app/(customer)/customer/dashboard/page.tsx';
let content = fs.readFileSync(customerFile, 'utf8');

const targetBlock = `  // Derived state computed efficiently with useMemo
  const stats = useMemo(() => {
    const activeBookingsCount = bookings.filter(b => ['PENDING', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status)).length;
    const completedServicesCount = bookings.filter(b => b.status === 'COMPLETED').length;

    const totalSpentAmount = payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const activeWarrantiesCount = warranties.filter(w => w.status === 'ACTIVE').length;

    return {
      activeBookings: activeBookingsCount,
      completedServices: completedServicesCount,
      totalSpent: totalSpentAmount,
      activeWarranties: activeWarrantiesCount,
      totalSavings: customerStats?.totalSavings || 0,
      rewardPoints: customerStats?.rewardPoints || 0
    };
  }, [bookings, payments, warranties, customerStats]);

  const pieChartData = useMemo(() => {
    const statusCounts = bookings.reduce((acc: any, booking: Booking) => {
      const status = booking.status || 'PENDING';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(statusCounts).map(status => ({
      name: status.replace(/_/g, " "),
      value: statusCounts[status],
      color: getStatusColorTheme(status).hex
    }));
  }, [bookings]);

  const barChartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        monthKey: \`\${d.getFullYear()}-\${d.getMonth()}\`, 
        label: d.toLocaleDateString('default', { month: 'short' }), 
        spent: 0
      };
    }).reverse(); 

    payments.forEach(p => {
      if (p.status !== 'SUCCESS') return;
      const date = new Date(p.paidAt || p.createdAt);
      const monthKey = \`\${date.getFullYear()}-\${date.getMonth()}\`;
      const monthObj = last6Months.find(m => m.monthKey === monthKey);
      if (monthObj) {
        monthObj.spent += (p.amount || 0);
      }
    });

    return last6Months;
  }, [payments]);

  const recentBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  }, [bookings]);

  const quotesWaiting = useMemo(() => {
    return bookings.filter(b => b.status === 'QUOTED');
  }, [bookings]);

  const additionalPartsPending = useMemo(() => {
    return bookings.filter(b => {
      const bData = b as any;
      const jobExts = bData.jobDetails?.jobExtensions || bData.jobExtensions || bData.jobDetails?.extensions || [];
      const hasPendingExts = jobExts.some((ext: any) => String(ext.status || '').toUpperCase() === 'PENDING');

      const rawAddParts = bData.additionalParts || bData.pendingAdditionalParts || [];
      const hasPendingParts = Array.isArray(rawAddParts) && rawAddParts.some((part: any) => !part.status || String(part.status || '').toUpperCase() === 'PENDING');

      const isReqPending = bData.jobExtensionRequest && String(bData.jobExtensionRequest.status || '').toUpperCase() === 'PENDING';

      return hasPendingExts || hasPendingParts || isReqPending;
    });
  }, [bookings]);`;

const patchedBlock = `  // Safe Data Wrappers
  const safeBookings = useMemo(() => Array.isArray(bookings) ? bookings : [], [bookings]);
  const safePayments = useMemo(() => Array.isArray(payments) ? payments : [], [payments]);
  const safeWarranties = useMemo(() => Array.isArray(warranties) ? warranties : [], [warranties]);

  // Derived state computed efficiently with useMemo
  const stats = useMemo(() => {
    const activeBookingsCount = safeBookings.filter(b => b && ['PENDING', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status)).length;
    const completedServicesCount = safeBookings.filter(b => b && b.status === 'COMPLETED').length;

    const totalSpentAmount = safePayments
      .filter(p => p && p.status === 'SUCCESS')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const activeWarrantiesCount = safeWarranties.filter(w => w && w.status === 'ACTIVE').length;

    return {
      activeBookings: activeBookingsCount,
      completedServices: completedServicesCount,
      totalSpent: totalSpentAmount,
      activeWarranties: activeWarrantiesCount,
      totalSavings: customerStats?.totalSavings || 0,
      rewardPoints: customerStats?.rewardPoints || 0
    };
  }, [safeBookings, safePayments, safeWarranties, customerStats]);

  const pieChartData = useMemo(() => {
    const statusCounts = safeBookings.reduce((acc: any, booking: any) => {
      const status = booking?.status || 'PENDING';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(statusCounts).map(status => ({
      name: status.replace(/_/g, " "),
      value: statusCounts[status],
      color: getStatusColorTheme(status)?.hex || "#6B7280"
    }));
  }, [safeBookings]);

  const barChartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        monthKey: \`\${d.getFullYear()}-\${d.getMonth()}\`, 
        label: d.toLocaleDateString('default', { month: 'short' }), 
        spent: 0
      };
    }).reverse(); 

    safePayments.forEach(p => {
      if (!p || p.status !== 'SUCCESS') return;
      const date = new Date(p.paidAt || p.createdAt || Date.now());
      const monthKey = \`\${date.getFullYear()}-\${date.getMonth()}\`;
      const monthObj = last6Months.find(m => m.monthKey === monthKey);
      if (monthObj) {
        monthObj.spent += (p.amount || 0);
      }
    });

    return last6Months;
  }, [safePayments]);

  const recentBookings = useMemo(() => {
    return [...safeBookings].sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()).slice(0, 5);
  }, [safeBookings]);

  const quotesWaiting = useMemo(() => {
    return safeBookings.filter(b => b && b.status === 'QUOTED');
  }, [safeBookings]);

  const additionalPartsPending = useMemo(() => {
    return safeBookings.filter(b => {
      if (!b) return false;
      const bData = b as any;
      const jobExts = bData.jobDetails?.jobExtensions || bData.jobExtensions || bData.jobDetails?.extensions || [];
      const hasPendingExts = Array.isArray(jobExts) && jobExts.some((ext: any) => String(ext?.status || '').toUpperCase() === 'PENDING');

      const rawAddParts = bData.additionalParts || bData.pendingAdditionalParts || [];
      const hasPendingParts = Array.isArray(rawAddParts) && rawAddParts.some((part: any) => !part?.status || String(part?.status || '').toUpperCase() === 'PENDING');

      const isReqPending = bData.jobExtensionRequest && String(bData.jobExtensionRequest?.status || '').toUpperCase() === 'PENDING';

      return hasPendingExts || hasPendingParts || isReqPending;
    });
  }, [safeBookings]);`;

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, patchedBlock);
  fs.writeFileSync(customerFile, content, 'utf8');
  console.log('✅ Successfully applied bulletproof safety guards to Customer Dashboard!');
} else {
  console.log('⚠️ Target block not found in Customer Dashboard.');
}
