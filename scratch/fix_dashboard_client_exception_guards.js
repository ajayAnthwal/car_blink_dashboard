const fs = require('fs');

// =========================================================================
// 1. FIX PARTNER DASHBOARD (app/(partner)/partner/dashboard/page.tsx)
// =========================================================================
const partnerFile = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard/app/(partner)/partner/dashboard/page.tsx';
let partnerCode = fs.readFileSync(partnerFile, 'utf8');

partnerCode = partnerCode.replace(
  `  const jobs = jobsData?.jobs || [];
  const bids = bidsData?.bids || [];
  const leads = leadsData?.leads || [];`,
  `  const jobs = Array.isArray(jobsData?.jobs) ? jobsData.jobs : (Array.isArray(jobsData) ? jobsData : []);
  const bids = Array.isArray(bidsData?.bids) ? bidsData.bids : (Array.isArray(bidsData) ? bidsData : []);
  const leads = Array.isArray(leadsData?.leads) ? leadsData.leads : (Array.isArray(leadsData) ? leadsData : []);`
);

partnerCode = partnerCode.replace(
  `  const stats = useMemo(() => {
    const activeJobsCount = jobs.filter(j => ['NOT_STARTED', 'IN_PROGRESS'].includes(j.status)).length;
    const completedJobsCount = jobs.filter(j => j.status === 'COMPLETED').length;
    const totalEarned = (earnings as unknown)?.lifetimeEarnings || earnings?.totalEarnings || 0;
    const avgRating = profile?.rating || 0;
    const tReviews = profile?.totalReviews || 0;`,
  `  const stats = useMemo(() => {
    const safeJobs = Array.isArray(jobs) ? jobs : [];
    const activeJobsCount = safeJobs.filter(j => j && ['NOT_STARTED', 'IN_PROGRESS'].includes(j.status)).length;
    const completedJobsCount = safeJobs.filter(j => j && j.status === 'COMPLETED').length;
    const totalEarned = (earnings as any)?.lifetimeEarnings || earnings?.totalEarnings || 0;
    const avgRating = profile?.rating || 0;
    const tReviews = profile?.totalReviews || 0;`
);

partnerCode = partnerCode.replace(
  `  const barChartData = useMemo(() => {
    const statusCounts = jobs.reduce((acc: unknown, job: unknown) => {
      const status = job.status || 'NOT_STARTED';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0 });

    return [
      { name: "Not Started", value: statusCounts.NOT_STARTED, fill: getStatusColorTheme("NOT_STARTED").hex },
      { name: "In Progress", value: statusCounts.IN_PROGRESS, fill: getStatusColorTheme("IN_PROGRESS").hex },
      { name: "Completed", value: statusCounts.COMPLETED, fill: getStatusColorTheme("COMPLETED").hex }
    ];
  }, [jobs]);`,
  `  const barChartData = useMemo(() => {
    const safeJobs = Array.isArray(jobs) ? jobs : [];
    const statusCounts = safeJobs.reduce((acc: any, job: any) => {
      const status = (job && job.status) ? String(job.status).toUpperCase() : 'NOT_STARTED';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0 });

    return [
      { name: "Not Started", value: statusCounts.NOT_STARTED || 0, fill: getStatusColorTheme("NOT_STARTED")?.hex || "#6B7280" },
      { name: "In Progress", value: statusCounts.IN_PROGRESS || 0, fill: getStatusColorTheme("IN_PROGRESS")?.hex || "#2563EB" },
      { name: "Completed", value: statusCounts.COMPLETED || 0, fill: getStatusColorTheme("COMPLETED")?.hex || "#16A34A" }
    ];
  }, [jobs]);`
);

fs.writeFileSync(partnerFile, partnerCode, 'utf8');
console.log('✅ Updated partner dashboard with bulletproof safety guards!');

// =========================================================================
// 2. FIX EXECUTIVE DASHBOARD (app/(executive)/executive/dashboard/page.tsx)
// =========================================================================
const execFile = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard/app/(executive)/executive/dashboard/page.tsx';
let execCode = fs.readFileSync(execFile, 'utf8');

execCode = execCode.replace(
  `  const fUps = followUpsData?.followUps || [];
  const esc = escalationsData?.escalations || [];
  const lds = leadsData?.leads || [];
  const wLds = websiteLeadsData?.leads || [];`,
  `  const fUps = Array.isArray(followUpsData?.followUps) ? followUpsData.followUps : (Array.isArray(followUpsData) ? followUpsData : []);
  const esc = Array.isArray(escalationsData?.escalations) ? escalationsData.escalations : (Array.isArray(escalationsData) ? escalationsData : []);
  const lds = Array.isArray(leadsData?.leads) ? leadsData.leads : (Array.isArray(leadsData) ? leadsData : []);
  const wLds = Array.isArray(websiteLeadsData?.leads) ? websiteLeadsData.leads : (Array.isArray(websiteLeadsData) ? websiteLeadsData : []);`
);

fs.writeFileSync(execFile, execCode, 'utf8');
console.log('✅ Updated executive dashboard with bulletproof safety guards!');

// =========================================================================
// 3. FIX ACCOUNTS DASHBOARD (app/(accounts)/accounts/dashboard/page.tsx)
// =========================================================================
const accountsFile = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard/app/(accounts)/accounts/dashboard/page.tsx';
let accountsCode = fs.readFileSync(accountsFile, 'utf8');

accountsCode = accountsCode.replace(
  `  const refunds = refundsData?.refunds || [];
  const settlements = settlementsData?.settlements || [];`,
  `  const refunds = Array.isArray(refundsData?.refunds) ? refundsData.refunds : (Array.isArray(refundsData) ? refundsData : []);
  const settlements = Array.isArray(settlementsData?.settlements) ? settlementsData.settlements : (Array.isArray(settlementsData) ? settlementsData : []);`
);

fs.writeFileSync(accountsFile, accountsCode, 'utf8');
console.log('✅ Updated accounts dashboard with bulletproof safety guards!');

// =========================================================================
// 4. FIX SUPER ADMIN DASHBOARD (app/(admin)/admin/dashboard/page.tsx)
// =========================================================================
const adminFile = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard/app/(admin)/admin/dashboard/page.tsx';
let adminCode = fs.readFileSync(adminFile, 'utf8');

adminCode = adminCode.replace(
  `  const recentUsers = usersData?.users || [];`,
  `  const recentUsers = Array.isArray(usersData?.users) ? usersData.users : (Array.isArray(usersData) ? usersData : []);`
);

fs.writeFileSync(adminFile, adminCode, 'utf8');
console.log('✅ Updated admin dashboard with bulletproof safety guards!');

console.log('\nAll 4 Dashboard files patched with bulletproof safety guards successfully!');
