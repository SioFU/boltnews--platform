import React from 'react';
import { ErrorType, handleError } from '../utils/errorHandler';
import { getCurrentEnv } from '../utils/envConfig';

const ErrorTest: React.FC = () => {
  // 测试验证错误
  const testValidationError = () => {
    handleError({
      type: ErrorType.VALIDATION_ERROR,
      message: 'Custom validation error message',
      originalError: new Error('Detailed validation error info'),
      component: 'ErrorTest'
    });
  };

  // 测试权限错误
  const testPermissionError = () => {
    handleError({
      type: ErrorType.PERMISSION_DENIED,
      message: 'Custom permission denied message',
      originalError: { code: '42501', details: 'Sensitive permission details' },
      component: 'ErrorTest'
    });
  };

  // 测试网络错误
  const testNetworkError = () => {
    handleError({
      type: ErrorType.NETWORK_ERROR,
      message: 'Custom network error message',
      originalError: new Error('Detailed network error info'),
      component: 'ErrorTest'
    });
  };

  // 测试未知错误
  const testUnknownError = () => {
    handleError({
      type: ErrorType.UNKNOWN_ERROR,
      message: 'Something went wrong',
      originalError: { 
        sensitive: 'Sensitive data', 
        stack: 'Error stack trace' 
      },
      component: 'ErrorTest'
    });
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-white">
        Error Handler Test (Current Environment: {getCurrentEnv()})
      </h2>
      
      <div className="space-y-4">
        <button
          onClick={testValidationError}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
        >
          Test Validation Error
        </button>

        <button
          onClick={testPermissionError}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full"
        >
          Test Permission Error
        </button>

        <button
          onClick={testNetworkError}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 w-full"
        >
          Test Network Error
        </button>

        <button
          onClick={testUnknownError}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 w-full"
        >
          Test Unknown Error
        </button>
      </div>

      <div className="mt-4 p-4 bg-gray-700 rounded text-white">
        <p className="text-sm">Instructions:</p>
        <ul className="list-disc pl-5 text-sm">
          <li>Click buttons to trigger different types of errors</li>
          <li>Check browser console for detailed error logs</li>
          <li>Notice how error messages differ in different environments</li>
          <li>Development mode shows more details</li>
          <li>Production mode masks sensitive information</li>
        </ul>
      </div>
    </div>
  );
};

export default ErrorTest;
