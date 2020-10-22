const createError = (httpCode, message) => {
  const error = new Error();
  error.message = message;
  error.code = httpCode;
  Error.captureStackTrace(error);
  return error;  
};

const getError = ({httpCode, message}) => {
  return createError(httpCode, message);
};

module.exports = {
  getError,
  createError,
  INVALID_PARAMETER: {
    httpCode: 422,
    message: 'Invalid parameter.'
  },
  INVALID_ETHEREUM_ADDRESS: {
    httpCode: 422,
    message: 'Invalid ethereum address.'
  },
  INVALID_SIGNATURE: {
    httpCode: 422,
    message: 'Invalid signature.'
  }
};
