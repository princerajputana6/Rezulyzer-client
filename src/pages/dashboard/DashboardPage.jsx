import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  Users, 
  Settings,
  Clock, 
  CheckCircle,
  BarChart3,
  Calendar,
  Shield
} from 'lucide-react';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import { apiClient } from '../../services/apiClient';
import PasswordResetModal from '../../components/PasswordResetModal';

const DashboardPage = () => {
  const currentUser = useSelector(selectCurrentUser);
  const location = useLocation();
  const [stats, setStats] = useState({
    totalTests: 0,
    activeTests: 0,
    totalUsers: 0,
    systemHealth: 'Good',
    recentActivity: [],
    // company KPIs
    candidatesToday: 0,
    successRate: 0,
    upcomingInterviews: 0
  });
  const [upcomingList, setUpcomingList] = useState([]);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isCompany = currentUser?.role === 'company';

  // Check for password reset requirement from navigation state
  useEffect(() => {
    if (location.state?.passwordResetRequired) {
      console.log('Dashboard detected password reset required');
      setUserEmail(location.state.userEmail);
      setShowPasswordResetModal(true);
    }
  }, [location.state]);

  // Load KPIs based on role
  useEffect(() => {
    let mounted = true;
    async function loadKpis() {
      try {
        if (isAdmin) {
          const { data } = await apiClient.get('/analytics/kpi/admin');
          const k = data?.data || {};
          if (!mounted) return;
          setStats(prev => ({
            ...prev,
            totalTests: k.totalTests || 0,
            activeTests: k.activeTests || 0,
            totalUsers: k.totalUsers || 0,
            systemHealth: k.systemHealth || 'Good'
          }));
        } else if (isCompany) {
          const { data } = await apiClient.get('/analytics/kpi/company');
          const k = data?.data || {};
          if (!mounted) return;
          setStats(prev => ({
            ...prev,
            activeTests: k.activeTests || 0,
            candidatesToday: k.candidatesToday || 0,
            successRate: k.successRate || 0,
            upcomingInterviews: k.upcomingInterviews || 0
          }));
          // Load top upcoming interviews list for company
          try {
            const up = await apiClient.get('/interviews/upcoming?days=7&limit=5');
            if (mounted) setUpcomingList(up?.data?.data || []);
          } catch (e) {
            // ignore silently
          }
        }
      } catch (e) {
        // Silently ignore, keep defaults
        // console.error('Failed to load KPIs', e);
      }
    }
    loadKpis();
    return () => { mounted = false; };
  }, [isAdmin, isCompany]);

  const StatCard = ({ title, value, icon: Icon, color = 'primary', trend = null, subtitle = '' }) => (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {typeof trend === 'number' && (
            <p className={`inline-flex items-center text-xs mt-2 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${trend >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {trend >= 0 ? '+' : ''}{trend}% vs last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>

      {/* Upcoming Interviews (Company) */}
      {isCompany && (
        <div className="mt-6 bg-white rounded-lg shadow-soft border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Interviews (Next 7 days)</h3>
            <Link to="/interviews" className="text-sm font-medium text-primary-600 hover:text-primary-500">View all →</Link>
          </div>
          <div className="p-6 divide-y divide-gray-100">
            {upcomingList.length === 0 && (
              <p className="text-sm text-gray-500">No upcoming interviews.</p>
            )}
            {upcomingList.map((it) => (
              <div key={it._id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{new Date(it.scheduledDate).toLocaleString()}</p>
                  <p className="text-sm text-gray-900 font-medium">{it.title || 'Interview'} · <span className="text-gray-600">{it.candidateId?.name || 'N/A'}</span></p>
                </div>
                <span className="badge badge-info capitalize">{it.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const QuickAction = ({ title, description, icon: Icon, to, color = 'primary' }) => (
    <Link
      to={to}
      className="bg-white rounded-lg shadow-soft p-6 border border-gray-200 hover:shadow-medium transition-shadow group"
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full bg-${color}-100 group-hover:bg-${color}-200 transition-colors`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {currentUser?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          {isAdmin ? 'Manage your system and test templates.' : 'Access your assigned tests and resources.'}
        </p>
      </div>

      {/* Stats Grid */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Test Templates" value={stats.totalTests} icon={FileText} color="primary" trend={12} />
            <StatCard title="Active Tests" value={stats.activeTests} icon={CheckCircle} color="success" trend={8} />
            <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="secondary" trend={15} />
            <StatCard title="System Health" value={stats.systemHealth} icon={Shield} color="success" subtitle="All services operational" />
          </div>
        </>
      )}

      {isCompany && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Active Tests" value={String(stats.activeTests)} icon={CheckCircle} color="success" trend={6} subtitle="Running now" />
          <StatCard title="Candidates Today" value={String(stats.candidatesToday)} icon={Users} color="secondary" trend={4} subtitle="New today" />
          <StatCard title="Success Rate" value={`${stats.successRate}%`} icon={BarChart3} color="primary" trend={2} subtitle="Avg overall" />
          <StatCard title="Upcoming Interviews" value={String(stats.upcomingInterviews)} icon={Calendar} color="warning" subtitle="Next 7 days" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isAdmin && (
            <>
              <QuickAction title="Test Management" description="Create and manage test templates" icon={Plus} to="/tests/create" color="primary" />
              <QuickAction title="User Management" description="Manage system users and roles" icon={Users} to="/users" color="secondary" />
              <QuickAction title="System Settings" description="Configure system preferences" icon={Settings} to="/settings" color="warning" />
            </>
          )}
          {isCompany && (
            <>
              <QuickAction title="Create Test" description="Build a new assessment" icon={Plus} to="/tests/create" color="primary" />
              <QuickAction title="Schedule Interviews" description="Plan AI interviews" icon={Calendar} to="/interviews/schedule" color="secondary" />
              <QuickAction title="Results & Analytics" description="Analyze performance" icon={BarChart3} to="/reports/tests" color="warning" />
            </>
          )}
        </div>
      </div>

      {/* Recent Activity & Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            {isAdmin && (
              <div className="mt-4">
                <Link
                  to="/activity"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  View all activity →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Test Management Overview */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{isAdmin ? 'Test Management' : isCompany ? 'Test Overview' : 'My Tests'}</h3>
          </div>
          <div className="p-6">
            {isAdmin ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">JavaScript Assessment</p>
                      <p className="text-xs text-gray-500">Template - Ready to deploy</p>
                    </div>
                  </div>
                  <span className="badge badge-success">Active</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Python Fundamentals</p>
                      <p className="text-xs text-gray-500">Template - In development</p>
                    </div>
                  </div>
                  <span className="badge badge-warning">Draft</span>
                </div>
                <div className="mt-4">
                  <Link
                    to="/tests/create"
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    Manage all tests →
                  </Link>
                </div>
              </div>
            ) : isCompany ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Open Tests</p>
                      <p className="text-xs text-gray-500">Visible to candidates</p>
                    </div>
                  </div>
                  <span className="badge badge-success">24</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Active Candidates</p>
                      <p className="text-xs text-gray-500">Participating today</p>
                    </div>
                  </div>
                  <span className="badge badge-info">89</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tests assigned yet</p>
                  <p className="text-xs text-gray-400 mt-1">Contact your administrator for test assignments</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <PasswordResetModal
          isOpen={showPasswordResetModal}
          onClose={() => setShowPasswordResetModal(false)}
          userEmail={userEmail}
        />
      )}
    </div>
  );
};

export default DashboardPage;
