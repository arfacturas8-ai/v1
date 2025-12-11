import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, Clock } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface PollOption {
  id: string;
  text: string;
}

interface PollDuration {
  value: number;
  label: string;
  unit: 'minutes' | 'hours' | 'days';
}

const pollDurations: PollDuration[] = [
  { value: 5, label: '5 minutes', unit: 'minutes' },
  { value: 30, label: '30 minutes', unit: 'minutes' },
  { value: 1, label: '1 hour', unit: 'hours' },
  { value: 6, label: '6 hours', unit: 'hours' },
  { value: 1, label: '1 day', unit: 'days' },
  { value: 3, label: '3 days', unit: 'days' },
  { value: 7, label: '7 days', unit: 'days' },
];

export default function CreatePollPage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ]);
  const [selectedDuration, setSelectedDuration] = useState<PollDuration>(pollDurations[5]); // 3 days default
  const [isCreating, setIsCreating] = useState(false);

  const handleAddOption = () => {
    if (options.length < 4) {
      const newId = (Math.max(...options.map((o) => parseInt(o.id))) + 1).toString();
      setOptions([...options, { id: newId, text: '' }]);
    }
  };

  const handleRemoveOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((o) => o.id !== id));
    }
  };

  const handleOptionChange = (id: string, text: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const handleCreate = async () => {
    if (!canCreate) return;

    setIsCreating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsCreating(false);
    navigate(-1);
  };

  const canCreate =
    question.trim().length > 0 &&
    options.filter((o) => o.text.trim().length > 0).length >= 2;

  const characterCount = (text: string, max: number) => {
    return `${text.length}/${max}`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: colors.bg.primary,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing[4],
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <button
              onClick={() => navigate(-1)}
              aria-label="Cancel"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={20} color={colors.text.primary} />
            </button>
            <h1
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              Create a poll
            </h1>
          </div>

          <button
            onClick={handleCreate}
            disabled={!canCreate || isCreating}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: '24px',
              border: 'none',
              backgroundColor: canCreate && !isCreating ? colors.brand.primary : colors.bg.tertiary,
              color: canCreate && !isCreating ? 'white' : colors.text.tertiary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: canCreate && !isCreating ? 'pointer' : 'not-allowed',
              transition: 'all 150ms ease-out',
            }}
          >
            Create
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: spacing[4] }}>
        {/* Question */}
        <div style={{ marginBottom: spacing[4] }}>
          <label
            style={{
              display: 'block',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.secondary,
              marginBottom: spacing[2],
            }}
          >
            Poll question
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              maxLength={100}
              autoFocus
              style={{
                width: '100%',
                padding: spacing[3],
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '12px',
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border.default;
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: spacing[3],
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: typography.fontSize.xs,
                color: colors.text.tertiary,
              }}
            >
              {characterCount(question, 100)}
            </span>
          </div>
        </div>

        {/* Options */}
        <div style={{ marginBottom: spacing[4] }}>
          <label
            style={{
              display: 'block',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.secondary,
              marginBottom: spacing[2],
            }}
          >
            Poll options
          </label>

          {options.map((option, index) => (
            <div
              key={option.id}
              style={{
                position: 'relative',
                marginBottom: spacing[3],
              }}
            >
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => handleOptionChange(option.id, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  maxLength={25}
                  style={{
                    width: '100%',
                    padding: spacing[3],
                    paddingRight: options.length > 2 ? '48px' : spacing[3],
                    backgroundColor: colors.bg.secondary,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: '12px',
                    color: colors.text.primary,
                    fontSize: typography.fontSize.base,
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.brand.primary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border.default;
                  }}
                />
                {options.length > 2 && (
                  <button
                    onClick={() => handleRemoveOption(option.id)}
                    style={{
                      position: 'absolute',
                      right: spacing[2],
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'background-color 150ms ease-out',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.semantic.error + '20';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={16} color={colors.semantic.error} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add option button */}
          {options.length < 4 && (
            <button
              onClick={handleAddOption}
              style={{
                width: '100%',
                padding: spacing[3],
                borderRadius: '12px',
                border: `2px dashed ${colors.border.default}`,
                backgroundColor: 'transparent',
                color: colors.brand.primary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[2],
                transition: 'all 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
                e.currentTarget.style.backgroundColor = colors.brand.primary + '10';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border.default;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Plus size={16} />
              Add option ({options.length}/4)
            </button>
          )}
        </div>

        {/* Duration */}
        <div style={{ marginBottom: spacing[4] }}>
          <label
            style={{
              display: 'block',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.secondary,
              marginBottom: spacing[2],
            }}
          >
            Poll duration
          </label>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: spacing[2],
            }}
          >
            {pollDurations.map((duration) => (
              <button
                key={`${duration.value}-${duration.unit}`}
                onClick={() => setSelectedDuration(duration)}
                style={{
                  padding: spacing[3],
                  borderRadius: '12px',
                  border: `2px solid ${
                    selectedDuration === duration ? colors.brand.primary : colors.border.default
                  }`,
                  backgroundColor:
                    selectedDuration === duration ? colors.brand.primary + '10' : colors.bg.secondary,
                  color: selectedDuration === duration ? colors.brand.primary : colors.text.primary,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[2],
                }}
                onMouseEnter={(e) => {
                  if (selectedDuration !== duration) {
                    e.currentTarget.style.borderColor = colors.brand.primary + '80';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedDuration !== duration) {
                    e.currentTarget.style.borderColor = colors.border.default;
                  }
                }}
              >
                {selectedDuration === duration && <Clock size={14} />}
                {duration.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info banner */}
        <div
          style={{
            padding: spacing[4],
            backgroundColor: colors.semantic.info + '10',
            borderRadius: '12px',
            border: `1px solid ${colors.border.default}`,
          }}
        >
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              margin: 0,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            Your poll will be visible to everyone who can see your post. You can add 2-4 options, and
            it will automatically close after the selected duration.
          </p>
        </div>
      </div>
    </div>
  );
}
