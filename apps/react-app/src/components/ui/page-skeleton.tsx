import { cn } from '../../lib/utils';

interface PageSkeletonProps {
  className?: string;
}

export function PageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div className={cn(' space-y-4 p-4', className)}>
      {/* Header skeleton */}
      <div className='space-y-2'>
        <div className='h-8 bg-muted rounded w-1/3'></div>
        <div className='h-4 bg-muted rounded w-1/2'></div>
      </div>
      
      {/* Content skeleton */}
      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='space-y-2'>
              <div className='h-32 bg-muted rounded'></div>
              <div className='h-4 bg-muted rounded w-3/4'></div>
              <div className='h-4 bg-muted rounded w-1/2'></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Loading text */}
      <div className='text-center text-muted-foreground'>
        <div className='inline-flex items-center space-x-2'>
          <svg className=' h-4 w-4' viewBox='0 0 24 24'>
            <circle 
              className='opacity-25' 
              cx='12' 
              cy='12' 
              r='10' 
              stroke='currentColor' 
              strokeWidth='4'
              fill='none'
            />
            <path 
              className='opacity-75' 
              fill='currentColor' 
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
          <span></span>
        </div>
      </div>
    </div>
  );
}