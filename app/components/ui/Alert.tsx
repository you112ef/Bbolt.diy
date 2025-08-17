import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
  className = ''
}) => {
  const alertStyles = {
    success: {
      container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      icon: 'i-ph:check-circle text-green-500'
    },
    error: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      icon: 'i-ph:x-circle text-red-500'
    },
    warning: {
      container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: 'i-ph:warning text-yellow-500'
    },
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'i-ph:info text-blue-500'
    }
  };

  const style = alertStyles[type];

  return (
    <div className={`p-4 border rounded-lg ${style.container} ${className}`}>
      <div className="flex items-start">
        <div className={`${style.icon} text-lg flex-shrink-0 mt-0.5`} />
        <div className="flex-1 ml-3">
          {title && (
            <h3 className={`text-sm font-medium ${style.text} mb-1`}>
              {title}
            </h3>
          )}
          <p className={`text-sm ${style.text}`}>
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 text-sm ${style.text} hover:opacity-75 transition-opacity`}
          >
            <div className="i-ph:x text-lg" />
          </button>
        )}
      </div>
    </div>
  );
};