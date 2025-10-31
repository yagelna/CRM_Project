export default function NoAccessCard({ title = "You do not have access", text = "You do not have the necessary permissions to view this content. Please contact your administrator if you believe this is an error." }) {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
      <div className="card shadow-sm" style={{ maxWidth: 520 }}>
        <div className="card-body">
          <h5 className="card-title mb-2">{title}</h5>
          <p className="card-text text-muted mb-3">{text}</p>
          <a href="/dashboard" className="btn btn-primary">Go to Homepage</a>
        </div>
      </div>
    </div>
  );
}