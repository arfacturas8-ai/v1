export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>CRYB Test Page</h1>
      <p>If you can see this, the frontend is working!</p>
      <p>Current time: {new Date().toISOString()}</p>
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>System Status</h2>
        <ul>
          <li>✅ Next.js is compiling and running</li>
          <li>✅ React is rendering components</li>
          <li>🔧 Testing basic functionality</li>
        </ul>
      </div>
    </div>
  );
}