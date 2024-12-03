// src/common/constants/error-codes.ts
export const ERROR_CODES = {
  // 400 Bad Request
  BAD_REQUEST: {
    code: 'E40001',
    message: 'Invalid request data',
  },
  CUSTOM_ERROR: (message: string) => ({
    code: 'E40002',
    message,
  }),

  // 401 Unauthorized
  UNAUTHORIZED: {
    code: 'E40101',
    message: 'Authentication required',
  },

  // 403 Forbidden
  FORBIDDEN: {
    code: 'E40301',
    message: 'Access denied',
  },

  // 404 Not Found
  NOT_FOUND: {
    code: 'E40401',
    message: 'Resource not found',
  },

  // 409 Conflict
  CONFLICT: {
    code: 'E40901',
    message: 'Conflict detected',
  },

  // 500 Internal Server Error
  INTERNAL_SERVER_ERROR: {
    code: 'E50001',
    message: 'Internal server error',
  },
};
