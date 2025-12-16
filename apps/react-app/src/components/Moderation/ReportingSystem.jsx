import React, { useState, useEffect } from 'react';

const ReportingSystem = ({ isOpen, onClose, contentId, contentType, reportedUserId }) => {
  const [reportData, setReportData] = useState({
    category: '',
    subcategory: '',
    description: '',
    evidence_urls: [],
  });
  const [loading, setLoading] = useState(false);
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');

  const reportCategories = {
    'harassment': {
      label: 'Harassment & Bullying',
      subcategories: [
        'targeted_harassment',
        'cyberbullying',
        'doxxing',
        'stalking',
        'impersonation'
      ]
    },
    'hate_speech': {
      label: 'Hate Speech',
      subcategories: [
        'racial_discrimination',
        'religious_intolerance',
        'gender_discrimination',
        'sexuality_discrimination',
        'disability_discrimination'
      ]
    },
    'violence': {
      label: 'Violence & Threats',
      subcategories: [
        'threats_of_violence',
        'graphic_violence',
        'self_harm_content',
        'dangerous_organizations',
        'terrorism'
      ]
    },
    'sexual_content': {
      label: 'Sexual Content',
      subcategories: [
        'explicit_sexual_content',
        'non_consensual_content',
        'sexual_exploitation',
        'inappropriate_sexual_behavior'
      ]
    },
    'spam': {
      label: 'Spam & Scams',
      subcategories: [
        'repetitive_content',
        'commercial_spam',
        'phishing_scams',
        'fake_engagement',
        'malicious_links'
      ]
    },
    'misinformation': {
      label: 'Misinformation',
      subcategories: [
        'false_information',
        'conspiracy_theories',
        'medical_misinformation',
        'election_interference',
        'deepfakes'
      ]
    },
    'copyright': {
      label: 'Copyright Violation',
      subcategories: [
        'unauthorized_content',
        'trademark_infringement',
        'plagiarism',
        'dmca_violation'
      ]
    },
    'privacy': {
      label: 'Privacy Violation',
      subcategories: [
        'personal_information',
        'private_content',
        'unauthorized_photos',
        'location_sharing'
      ]
    },
    'other': {
      label: 'Other',
      subcategories: [
        'terms_violation',
        'community_guidelines',
        'technical_issue',
        'other_concern'
      ]
    }
  };

  const subcategoryLabels = {
    'targeted_harassment': 'Targeted Harassment',
    'cyberbullying': 'Cyberbullying',
    'doxxing': 'Doxxing/Personal Info Sharing',
    'stalking': 'Stalking',
    'impersonation': 'Impersonation',
    'racial_discrimination': 'Racial Discrimination',
    'religious_intolerance': 'Religious Intolerance',
    'gender_discrimination': 'Gender Discrimination',
    'sexuality_discrimination': 'Sexuality/LGBTQ+ Discrimination',
    'disability_discrimination': 'Disability Discrimination',
    'threats_of_violence': 'Threats of Violence',
    'graphic_violence': 'Graphic Violence',
    'self_harm_content': 'Self-Harm Content',
    'dangerous_organizations': 'Dangerous Organizations',
    'terrorism': 'Terrorism/Extremism',
    'explicit_sexual_content': 'Explicit Sexual Content',
    'non_consensual_content': 'Non-Consensual Content',
    'sexual_exploitation': 'Sexual Exploitation',
    'inappropriate_sexual_behavior': 'Inappropriate Sexual Behavior',
    'repetitive_content': 'Repetitive/Duplicate Content',
    'commercial_spam': 'Commercial Spam',
    'phishing_scams': 'Phishing/Scams',
    'fake_engagement': 'Fake Engagement',
    'malicious_links': 'Malicious Links',
    'false_information': 'False Information',
    'conspiracy_theories': 'Conspiracy Theories',
    'medical_misinformation': 'Medical Misinformation',
    'election_interference': 'Election Interference',
    'deepfakes': 'Deepfakes/Manipulated Media',
    'unauthorized_content': 'Unauthorized Content Use',
    'trademark_infringement': 'Trademark Infringement',
    'plagiarism': 'Plagiarism',
    'dmca_violation': 'DMCA Violation',
    'personal_information': 'Personal Information Exposure',
    'private_content': 'Private Content Sharing',
    'unauthorized_photos': 'Unauthorized Photos/Videos',
    'location_sharing': 'Unauthorized Location Sharing',
    'terms_violation': 'Terms of Service Violation',
    'community_guidelines': 'Community Guidelines Violation',
    'technical_issue': 'Technical Issue',
    'other_concern': 'Other Concern'
  };

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setReportData({
        category: '',
        subcategory: '',
        description: '',
        evidence_urls: [],
      });
      setNewEvidenceUrl('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/moderation/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          content_id: contentId,
          content_type: contentType,
          category: reportData.category,
          subcategory: reportData.subcategory,
          description: reportData.description,
          evidence_urls: reportData.evidence_urls,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Report submitted successfully. Thank you for helping keep our community safe.');
        onClose();
      } else {
        const error = await response.json();
        alert(`Failed to submit report: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addEvidenceUrl = () => {
    if (newEvidenceUrl.trim() && !reportData.evidence_urls.includes(newEvidenceUrl.trim())) {
      setReportData(prev => ({
        ...prev,
        evidence_urls: [...prev.evidence_urls, newEvidenceUrl.trim()]
      }));
      setNewEvidenceUrl('');
    }
  };

  const removeEvidenceUrl = (index) => {
    setReportData(prev => ({
      ...prev,
      evidence_urls: prev.evidence_urls.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div style={{background: "var(--bg-primary)"}} className="fixed inset-0 /50 flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-[var(--border-subtle)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-subtle)] sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] m-0">Report Content</h2>
          <button
            className="bg-none border-none text-2xl text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What type of issue are you reporting?</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(reportCategories).map(([key, category]) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                    reportData.category === key
                      ? 'border-[#58a6ff] bg-[#58a6ff]/10'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[#58a6ff]/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={key}
                    checked={reportData.category === key}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      category: e.target.value,
                      subcategory: ''
                    }))}
                    required
                    className="hidden"
                  />
                  <span className="text-[var(--text-primary)] font-medium">{category.label}</span>
                </label>
              ))}
            </div>
          </div>

          {reportData.category && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">More specifically, what is the issue?</h3>
              <div className="space-y-2">
                {reportCategories[reportData.category].subcategories.map(subcategory => (
                  <label
                    key={subcategory}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      reportData.subcategory === subcategory
                        ? 'border-[#58a6ff] bg-[#58a6ff]/10'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[#58a6ff]/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="subcategory"
                      value={subcategory}
                      checked={reportData.subcategory === subcategory}
                      onChange={(e) => setReportData(prev => ({
                        ...prev,
                        subcategory: e.target.value
                      }))}
                      className="hidden"
                    />
                    <span className="text-[var(--text-primary)]">{subcategoryLabels[subcategory]}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label htmlFor="description">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Please provide additional details *</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Help us understand the issue by providing specific details about what you observed.
              </p>
            </label>
            <textarea
              id="description"
              value={reportData.description}
              onChange={(e) => setReportData(prev => ({
                ...prev,
                description: e.target.value
              }))}
              placeholder="Describe the specific behavior or content that violates our community guidelines..."
              required
              minLength={10}
              maxLength={1000}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]/20"
            />
            <div className="text-xs text-[var(--text-secondary)] mt-1 text-right">
              {reportData.description.length}/1000 characters
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Evidence (Optional)</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Provide links to screenshots, archives, or other evidence that supports your report.
            </p>

            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={newEvidenceUrl}
                onChange={(e) => setNewEvidenceUrl(e.target.value)}
                placeholder="https://example.com/evidence-link"
                className="flex-1 px-4 py-2 bg-white border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]/20"
              />
              <button
                type="button"
                onClick={addEvidenceUrl}
                style={{color: "var(--text-primary)"}} className="px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-lg hover:opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                disabled={!newEvidenceUrl.trim()}
              >
                Add
              </button>
            </div>

            {reportData.evidence_urls.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Added Evidence:</h4>
                {reportData.evidence_urls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 p-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#58a6ff] hover:underline flex-1 truncate"
                    >
                      {url}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeEvidenceUrl(index)}
                      className="text-red-500 hover:text-red-400 text-lg"
                      aria-label="Remove evidence"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-700 m-0">
              <strong>Important:</strong> Filing false reports may result in action against your account.
              We take all reports seriously and will investigate appropriately.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              style={{color: "var(--text-primary)"}} className="px-6 py-3 bg-gray-600  rounded-lg hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{color: "var(--text-primary)"}} className="px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-lg hover:opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              disabled={loading || !reportData.category || !reportData.description.trim()}
            >
              {loading ? (
                <>
                  <span style={{ width: "24px", height: "24px", flexShrink: 0 }}></span>
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportingSystem;
