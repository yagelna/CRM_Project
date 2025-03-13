import { useEffect, useState } from 'react';
import axiosInstance from '../AxiosInstance';
import { Link } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';

// ====== קומפוננטות דמה ======
const StatsCardPlaceholder = ({ title, value, trend, iconBg, icon, color }) => {
  return (
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-body d-flex align-items-center justify-content-between">
        {/* אייקון/רקע צבעוני */}
        <div className={`p-2 rounded d-inline-flex align-items-center justify-content-center ${iconBg} me-3`}>
          {/* כאן אפשר לשים אייקון אמיתי או טקסט */}
          <span className={color} style={{ fontSize: '1.2rem' }}>
            {icon}
          </span>
        </div>
        {/* טקסט */}
        <div className="text-end">
          <div className="text-muted small">{title}</div>
          <h4 className="fw-bold mb-0">{value}</h4>
          <div className="text-muted small">{trend}</div>
        </div>
      </div>
    </div>
  );
};

const RFQChartPlaceholder = ({ isLoading }) => (
  <div className="card border-0 shadow-sm mb-4">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">RFQ Activity</h5>
        <div>
          <Button variant="outline-secondary" size="sm" className="me-1">7D</Button>
          <Button variant="outline-secondary" size="sm" className="me-1">30D</Button>
          <Button variant="outline-secondary" size="sm">90D</Button>
        </div>
      </div>
      <div style={{ height: '240px' }} className="d-flex align-items-center justify-content-center">
        {isLoading ? <Spinner animation="border" /> : <span>Chart goes here</span>}
      </div>
    </div>
  </div>
);

const RecentRFQsPlaceholder = ({ isLoading, rfqs }) => (
  <div className="card border-0 shadow-sm mb-4">
    <div className="card-body">
      <h5 className="mb-3">Recent RFQs</h5>
      {isLoading ? (
        <Spinner animation="border" />
      ) : (
        <table className="table mb-0">
          <thead>
            <tr>
              <th>RFQ Number</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.slice(0, 5).map(rfq => (
              <tr key={rfq.id}>
                <td><Link to={`/rfqs/${rfq.id}`}>{rfq.rfq_number}</Link></td>
                <td>{rfq.company_name}</td>
                <td>{new Date(rfq.created_date).toLocaleDateString()}</td>
                <td>{rfq.status}</td>
                <td>${rfq.total_value || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

const TopCustomersPlaceholder = ({ isLoading }) => (
  <div className="card border-0 shadow-sm mb-4">
    <div className="card-body">
      <h5>Top Customers</h5>
      {isLoading
        ? <Spinner animation="border" />
        : <p className="text-muted">Placeholder for top customers list</p>
      }
    </div>
  </div>
);
// ====== סוף קומפוננטות דמה ======

const Dashboard = () => {
  const [rfqs, setRfqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRfqs();
  }, []);

  const loadRfqs = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('api/rfqs/');
      setRfqs(response.data);
    } catch (error) {
      console.error('Error fetching rfqs: ' + error);
    }
    setIsLoading(false);
  };

  return (
    <div className="container py-4">

      {/* כותרת ראשית */}
      <div className="mb-4">
        <h1 className="fw-bold mb-1">Dashboard</h1>
        <p className="text-muted">Overview of your RFQ management system</p>
        <Link to="/rfqs">
          <Button variant="primary">View All RFQs</Button>
        </Link>
      </div>

      {/* שורת כרטיסים */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <StatsCardPlaceholder
            title="Total RFQs"
            value={rfqs.length}
            trend={`${rfqs.filter(r => r.status === 'new').length} new`}
            icon="📄"
            iconBg="bg-primary bg-opacity-10"
            color="text-primary"
          />
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <StatsCardPlaceholder
            title="In Progress"
            value={rfqs.filter(r => r.status === 'in_progress').length}
            trend="Last 30 days"
            icon="⏲"
            iconBg="bg-warning bg-opacity-10"
            color="text-warning"
          />
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <StatsCardPlaceholder
            title="Won Deals"
            value={rfqs.filter(r => r.status === 'won').length}
            trend={`$${rfqs
              .filter(r => r.status === 'won')
              .reduce((sum, rfq) => sum + (rfq.total_value || 0), 0)
              .toLocaleString()}`}
            icon="🏆"
            iconBg="bg-success bg-opacity-10"
            color="text-success"
          />
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <StatsCardPlaceholder
            title="Response Rate"
            value={`${(
              (rfqs.filter(r => ['quoted', 'won', 'lost'].includes(r.status)).length /
               (rfqs.length || 1)
              ) * 100
            ).toFixed(1)}%`}
            trend="Avg. 4.5 hours"
            icon="📈"
            iconBg="bg-secondary bg-opacity-10"
            color="text-secondary"
          />
        </div>
      </div>

      {/* הגרף + טבלה אחרונה + טופ-קסטומרס */}
      <div className="row g-4">
        <div className="col-lg-8">
          <RFQChartPlaceholder data={rfqs} isLoading={isLoading} />
          <RecentRFQsPlaceholder rfqs={rfqs} isLoading={isLoading} />
        </div>
        <div className="col-lg-4">
          <TopCustomersPlaceholder rfqs={rfqs} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;