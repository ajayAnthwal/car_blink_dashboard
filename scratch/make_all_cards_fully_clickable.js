const fs = require('fs');

// =========================================================================
// 1. PARTNER DASHBOARD PAGE
// =========================================================================
const partnerDashboardPath = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard/app/(partner)/partner/dashboard/page.tsx';
let partnerContent = fs.readFileSync(partnerDashboardPath, 'utf8');

const oldPartnerCardsBlock = `      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Active Jobs</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-secondary-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.activeJobs}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/partner/jobs" className="flex items-center text-xs font-semibold text-secondary-blue hover:text-blue-700 group transition-colors">
              Manage jobs
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Completed Jobs</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.completedJobs}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/partner/jobs" className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              View history
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-primary-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">
              {stats.totalEarnings.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/partner/earnings" className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              View payouts
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Average Rating</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">
              {stats.averageRating ? stats.averageRating.toFixed(1) : "N/A"}
            </div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <div className="flex items-center text-xs font-semibold text-gray-500">
              Based on {stats.totalReviews} reviews
            </div>
          </CardFooter>
        </Card>
      </div>`;

const newPartnerCardsBlock = `      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Link href="/partner/jobs" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-blue-300 group-hover:border-blue-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">Active Jobs</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Briefcase className="w-5 h-5 text-secondary-blue" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">{stats.activeJobs}</div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-secondary-blue group-hover:text-blue-700 transition-colors">
                Manage jobs <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/partner/jobs" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-green-300 group-hover:border-green-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-green-600 transition-colors">Completed Jobs</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">{stats.completedJobs}</div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">
                View history <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/partner/earnings" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-orange-300 group-hover:border-orange-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-orange-600 transition-colors">Total Earnings</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <IndianRupee className="w-5 h-5 text-primary-orange" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">
                {stats.totalEarnings.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
              </div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">
                View payouts <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/partner/reviews" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-yellow-300 group-hover:border-yellow-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-yellow-600 transition-colors">Average Rating</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">
                {stats.averageRating ? stats.averageRating.toFixed(1) : "N/A"}
              </div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">
                Based on {stats.totalReviews} reviews <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>
      </div>`;

if (partnerContent.includes(oldPartnerCardsBlock)) {
  partnerContent = partnerContent.replace(oldPartnerCardsBlock, newPartnerCardsBlock);
  fs.writeFileSync(partnerDashboardPath, partnerContent, 'utf8');
  console.log('✅ Partner Dashboard: All cards wrapped in full links!');
} else {
  console.log('⚠️ Partner Dashboard: Target block not found.');
}

// =========================================================================
// 2. EXECUTIVE DASHBOARD PAGE
// =========================================================================
const execDashboardPath = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard/app/(executive)/executive/dashboard/page.tsx';
let execContent = fs.readFileSync(execDashboardPath, 'utf8');

const oldExecCardsBlock = `      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Leads Today</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-secondary-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.totalLeadsToday}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/executive/leads" className="flex items-center text-xs font-semibold text-secondary-blue hover:text-blue-700 group transition-colors">
              View pipeline <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Open Escalations</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.openEscalations}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/executive/escalations" className="flex items-center text-xs font-semibold text-danger hover:text-red-700 group transition-colors">
              Review issues <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Follow-ups</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.pendingFollowUps}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/executive/follow-ups/pending" className="flex items-center text-xs font-semibold text-warning hover:text-orange-600 group transition-colors">
              Take action <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>
      </div>`;

const newExecCardsBlock = `      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Link href="/executive/leads" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-blue-300 group-hover:border-blue-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">Leads Today</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Target className="w-5 h-5 text-secondary-blue" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">{stats.totalLeadsToday}</div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-secondary-blue group-hover:text-blue-700 transition-colors">
                View pipeline <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/executive/escalations" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-red-300 group-hover:border-red-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-red-600 transition-colors">Open Escalations</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">{stats.openEscalations}</div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-danger group-hover:text-red-700 transition-colors">
                Review issues <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/executive/follow-ups/pending" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-orange-300 group-hover:border-orange-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-orange-600 transition-colors">Follow-ups</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">{stats.pendingFollowUps}</div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-warning group-hover:text-orange-600 transition-colors">
                Take action <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>
      </div>`;

if (execContent.includes(oldExecCardsBlock)) {
  execContent = execContent.replace(oldExecCardsBlock, newExecCardsBlock);
  fs.writeFileSync(execDashboardPath, execContent, 'utf8');
  console.log('✅ Executive Dashboard: All cards wrapped in full links!');
} else {
  console.log('⚠️ Executive Dashboard: Target block not found.');
}

// =========================================================================
// 3. ACCOUNTS DASHBOARD PAGE
// =========================================================================
const accountsDashboardPath = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard/app/(accounts)/accounts/dashboard/page.tsx';
let accountsContent = fs.readFileSync(accountsDashboardPath, 'utf8');

const oldAccountsCardsBlock = `      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Refunds</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Undo2 className="w-5 h-5 text-primary-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.pendingRefunds}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/accounts/refunds" className="flex items-center text-xs font-semibold text-primary-orange hover:text-orange-600 group transition-colors">
              Process refunds <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Settlements</CardTitle>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <BadgeIndianRupee className="w-5 h-5 text-secondary-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">{stats.pendingSettlements}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <Link href="/accounts/settlements" className="flex items-center text-xs font-semibold text-secondary-blue hover:text-blue-700 group transition-colors">
              View settlements <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Refunds Vol.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">₹{stats.totalRefundsAmount.toLocaleString()}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <span className="text-xs font-medium text-gray-400">Total value processed</span>
          </CardFooter>
        </Card>

        <Card className="shadow-subtle border-gray-100 hover:shadow-elevated transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Settlements Vol.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 font-heading">₹{stats.totalSettlementsAmount.toLocaleString()}</div>
          </CardContent>
          <CardFooter className="pt-1 pb-4">
            <span className="text-xs font-medium text-gray-400">Total value processed</span>
          </CardFooter>
        </Card>
      </div>`;

const newAccountsCardsBlock = `      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Link href="/accounts/refunds" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-orange-300 group-hover:border-orange-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-orange-600 transition-colors">Pending Refunds</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Undo2 className="w-5 h-5 text-primary-orange" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">{stats.pendingRefunds}</div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-primary-orange group-hover:text-orange-600 transition-colors">
                Process refunds <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/accounts/settlements" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-blue-300 group-hover:border-blue-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">Pending Settlements</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <BadgeIndianRupee className="w-5 h-5 text-secondary-blue" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">{stats.pendingSettlements}</div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-secondary-blue group-hover:text-blue-700 transition-colors">
                View settlements <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/accounts/refunds" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-orange-300 group-hover:border-orange-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-orange-600 transition-colors">Total Refunds Vol.</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Undo2 className="w-5 h-5 text-primary-orange" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">₹{stats.totalRefundsAmount.toLocaleString()}</div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">
                View refund history <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/accounts/settlements" className="block group">
          <Card className="shadow-subtle border-gray-100 hover:border-blue-300 group-hover:border-blue-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors">Total Settlements Vol.</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <BadgeIndianRupee className="w-5 h-5 text-secondary-blue" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 font-heading">₹{stats.totalSettlementsAmount.toLocaleString()}</div>
            </CardContent>
            <CardFooter className="pt-1 pb-4">
              <span className="flex items-center text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition-colors">
                View settlement history <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </CardFooter>
          </Card>
        </Link>
      </div>`;

if (accountsContent.includes(oldAccountsCardsBlock)) {
  accountsContent = accountsContent.replace(oldAccountsCardsBlock, newAccountsCardsBlock);
  fs.writeFileSync(accountsDashboardPath, accountsContent, 'utf8');
  console.log('✅ Accounts Dashboard: All cards wrapped in full links!');
} else {
  console.log('⚠️ Accounts Dashboard: Target block not found.');
}

// =========================================================================
// 4. SUPER ADMIN DASHBOARD PAGE
// =========================================================================
const adminDashboardPath = 'C:/Users/ajay anthwal/Desktop/car_blink_dashboard/app/(admin)/admin/dashboard/page.tsx';
let adminContent = fs.readFileSync(adminDashboardPath, 'utf8');

const oldAdminCardsBlock = `      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
                <h3 className="text-3xl font-bold text-gray-900 font-heading">
                  {stats.totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center border border-green-100">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
                <h3 className="text-3xl font-bold text-gray-900 font-heading">{stats.totalUsers}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <Link href="/admin/users" className="mt-4 flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 group transition-colors">
              Manage users <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Active Partners</p>
                <h3 className="text-3xl font-bold text-gray-900 font-heading">{stats.activePartners}</h3>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                <Activity className="w-6 h-6 text-primary-orange" />
              </div>
            </div>
            <Link href="/admin/partners" className="mt-4 flex items-center text-xs font-semibold text-primary-orange hover:text-orange-700 group transition-colors">
              View partners <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Monthly Growth</p>
                <h3 className="text-3xl font-bold text-gray-900 font-heading">
                  {stats.growthRate > 0 ? '+' : ''}{stats.growthRate}%
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>`;

const newAdminCardsBlock = `      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/admin/finance" className="block group">
          <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:border-green-300 group-hover:border-green-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1 group-hover:text-green-600 transition-colors">Total Revenue</p>
                  <h3 className="text-3xl font-bold text-gray-900 font-heading">
                    {stats.totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center border border-green-100 group-hover:bg-green-100 transition-colors">
                  <IndianRupee className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-green-600 group-hover:text-green-800 transition-colors">
                View financial reports <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users" className="block group">
          <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:border-blue-300 group-hover:border-blue-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1 group-hover:text-blue-600 transition-colors">Total Users</p>
                  <h3 className="text-3xl font-bold text-gray-900 font-heading">{stats.totalUsers}</h3>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-blue-600 group-hover:text-blue-800 transition-colors">
                Manage users <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/partners" className="block group">
          <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:border-orange-300 group-hover:border-orange-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1 group-hover:text-orange-600 transition-colors">Active Partners</p>
                  <h3 className="text-3xl font-bold text-gray-900 font-heading">{stats.activePartners}</h3>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 group-hover:bg-orange-100 transition-colors">
                  <Activity className="w-6 h-6 text-primary-orange" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-primary-orange group-hover:text-orange-700 transition-colors">
                View partners <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/finance" className="block group">
          <Card className="bg-white/80 backdrop-blur-md shadow-sm border-white/40 hover:border-purple-300 group-hover:border-purple-400 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1 group-hover:text-purple-600 transition-colors">Monthly Growth</p>
                  <h3 className="text-3xl font-bold text-gray-900 font-heading">
                    {stats.growthRate > 0 ? '+' : ''}{stats.growthRate}%
                  </h3>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100 group-hover:bg-purple-100 transition-colors">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-purple-600 group-hover:text-purple-800 transition-colors">
                View growth analytics <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>`;

if (adminContent.includes(oldAdminCardsBlock)) {
  adminContent = adminContent.replace(oldAdminCardsBlock, newAdminCardsBlock);
  fs.writeFileSync(adminDashboardPath, adminContent, 'utf8');
  console.log('✅ Super Admin Dashboard: All cards wrapped in full links!');
} else {
  console.log('⚠️ Super Admin Dashboard: Target block not found.');
}

console.log('\n============================================================');
console.log('COMPLETED: All 4 Dashboards (Partner, Executive, Accounts, Super Admin) updated!');
console.log('============================================================');
