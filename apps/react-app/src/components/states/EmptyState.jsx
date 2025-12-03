import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'Try adjusting your filters or create a new item',
  actionLabel,
  onAction
}) => {
  return (
    <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px',
  textAlign: 'center'
}} role="status">
      <Icon style={{
  height: '80px',
  width: '80px',
  color: '#A0A0A0'
}} aria-hidden="true" />
      <h3 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>{title}</h3>
      <p style={{
  color: '#A0A0A0'
}}>{description}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '12px',
  paddingBottom: '12px',
  borderRadius: '12px',
  fontWeight: '500'
}}
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};




export default EmptyState
