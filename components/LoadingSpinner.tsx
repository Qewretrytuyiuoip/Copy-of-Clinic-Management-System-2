import React from 'react';

const LoadingSpinner: React.FC<{ className?: string }> = ({ className = 'h-8 w-8' }) => (
    <div className={`animate-spin rounded-full border-4 border-primary border-t-transparent ${className}`} role="status">
        <span className="sr-only">Loading...</span>
    </div>
);

export const CenteredLoadingSpinner: React.FC<{ containerClassName?: string }> = ({ containerClassName = 'py-16' }) => (
    <div className={`flex justify-center items-center ${containerClassName}`}>
        <LoadingSpinner />
    </div>
);

export default LoadingSpinner;
