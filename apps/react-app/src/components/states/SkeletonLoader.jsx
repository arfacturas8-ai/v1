import React from 'react';
export const SkeletonLoader = ({
  variant = 'text',
  count = 1,
  className = ''
}) => {
  const variants = {
    text: 'h-4 w-full rounded',
    title: 'h-8 w-3/4 rounded',
    avatar: 'h-12 w-12 rounded-full',
    thumbnail: 'h-32 w-full rounded-lg',
    card: 'h-64 w-full rounded-lg'
  };

  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading content">
      {items.map((i) => (
        <div
          key={i}
          style={{
  background: 'rgba(22, 27, 34, 0.6)'
}}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  padding: '24px'
}} role="status" aria-label="Loading card">
      <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
        <SkeletonLoader variant="avatar" />
        <div style={{
  flex: '1'
}}>
          <SkeletonLoader variant="title" />
          <SkeletonLoader variant="text" count={2} />
        </div>
      </div>
      <SkeletonLoader variant="thumbnail" />
    </div>
  );
};




export default SkeletonLoader
