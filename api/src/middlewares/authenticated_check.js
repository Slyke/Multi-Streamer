const jwt = require('jsonwebtoken');

const validateJwtCheck = ({ userToken, httpsCredentials, logger } = {}) => {
  try {
    const decoded = jwt.verify(userToken, httpsCredentials.cert);
    if (decoded.userId > 0 && decoded?.username?.length > 2) {
      if (decoded.mfaRequired && !decoded.mfaValidated) {
        return false;
      }
      return true;
    }
    return false;
  } catch(err) {
    return false;
  }
};

module.exports = validateJwtCheck;
