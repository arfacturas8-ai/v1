import React, { useState, useEffect } from 'react';
import { Download, Users, TrendingUp, Filter, Trash2 } from 'lucide-react';

export default function BradWaitlistAdminPage() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch entries
      const entriesUrl = filter === 'all'
        ? 'https://api.cryb.ai/api/v1/brad-waitlist/entries'
        : `https://api.cryb.ai/api/v1/brad-waitlist/entries?interest=${filter}`;

      const [entriesRes, statsRes] = await Promise.all([
        fetch(entriesUrl),
        fetch('https://api.cryb.ai/api/v1/brad-waitlist/stats')
      ]);

      const entriesData = await entriesRes.json();
      const statsData = await statsRes.json();

      if (entriesData.success) {
        setEntries(entriesData.data);
      }

      if (statsData.success) {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Interest', 'Submitted At'];
    const rows = entries.map(entry => [
      entry.name,
      entry.email,
      entry.phone || '',
      entry.interest,
      new Date(entry.submittedAt).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brad-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getInterestLabel = (interest) => {
    const labels = {
      user: 'Early User',
      partner: 'Business Partner',
      developer: 'Developer/Creator',
      other: 'Other'
    };
    return labels[interest] || interest;
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      const response = await fetch(`https://api.cryb.ai/api/v1/brad-waitlist/entries/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        // Refresh data after deletion
        fetchData();
      } else {
        alert(data.error || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    }
  };

  if (loading && !stats) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      padding: '32px 16px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#000',
              marginBottom: '8px'
            }}>Brad Waitlist Admin</h1>
            <p style={{ fontSize: '15px', color: '#666' }}>
              Manage and export waitlist submissions
            </p>
          </div>

          <button
            onClick={exportToCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
            }}
          >
            <Download style={{ width: '18px', height: '18px' }} />
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              border: '1px solid rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}>
                <Users style={{ width: '20px', height: '20px', color: '#000000' }} />
                <span style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>Total Submissions</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#000' }}>
                {stats.total}
              </div>
            </div>

            {stats.byInterest.map(item => (
              <div key={item.interest} style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(0, 0, 0, 0.06)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <TrendingUp style={{ width: '20px', height: '20px', color: '#000000' }} />
                  <span style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>
                    {getInterestLabel(item.interest)}
                  </span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#000' }}>
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        <div style={{
          background: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <Filter style={{ width: '18px', height: '18px', color: '#666' }} />
          <span style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>Filter:</span>

          {['all', 'user', 'partner', 'developer', 'other'].map(filterOption => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              style={{
                padding: '8px 16px',
                background: filter === filterOption ? '#000000' : 'transparent',
                color: filter === filterOption ? 'white' : '#666',
                border: '1px solid ' + (filter === filterOption ? '#000000' : 'rgba(0, 0, 0, 0.1)'),
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {filterOption === 'all' ? 'All' : getInterestLabel(filterOption)}
            </button>
          ))}
        </div>

        {/* Entries Table */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9F9F9' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#666' }}>Name</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#666' }}>Email</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#666' }}>Phone</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#666' }}>Interest</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#666' }}>Submitted</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#666' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{
                      padding: '48px',
                      textAlign: 'center',
                      color: '#999',
                      fontSize: '15px'
                    }}>
                      No entries found
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, index) => (
                    <tr key={entry.id} style={{
                      borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                      background: index % 2 === 0 ? 'white' : '#FAFAFA'
                    }}>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: '#000' }}>{entry.name}</td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: '#000' }}>{entry.email}</td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: '#666' }}>{entry.phone || '-'}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: '#F0F0FF',
                          color: '#000000',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          {getInterestLabel(entry.interest)}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#666' }}>
                        {new Date(entry.submittedAt).toLocaleDateString()} {new Date(entry.submittedAt).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                            background: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#EF4444',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#FEE2E2';
                            e.currentTarget.style.borderColor = '#EF4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                          }}
                        >
                          <Trash2 style={{ width: '16px', height: '16px' }} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
