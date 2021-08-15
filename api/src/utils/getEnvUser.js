const crypto = require('crypto');

const doubleHash = (inputString) => {
  const hash1 = crypto.createHash('sha256').update(inputString).digest('hex');
  return crypto.createHash('sha256').update(hash1).digest('hex');
};

const getEnvAdmin = () => {
  try {
    const username = process?.env?.ADMIN_USER;
    const password = process?.env?.ADMIN_PASSWORD;
    const hashedPassword = process?.env?.ADMIN_HASHED_PASSWORD || doubleHash(password);
    const mfaPsk = process?.env?.ADMIN_MFA_PSK;
    return {
      userId: 1,
      username,
      hashedPassword,
      permissions: ['admin', 'all'],
      type: 'system',
      mfaPsk
    };
  } catch(err) {
    return false;
  }
};

module.exports = getEnvAdmin;
