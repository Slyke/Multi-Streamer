const Settings = ({ env, logger, version }) => {
  const path = require('path');

  logger.info(`Settings loaded. env: '${env}', AppVersion: '${version}'`);

  const retr = {
    cors: {
      origins: ["localhost", "127.0.0.1", "localhost:3080", "127.0.0.1:3080", "localhost:3000"],
      headers: ["Content-Type" ,"Origin", "Accept"]
    },
    paths: {
      httpsCredentials: path.join(__dirname, '../keys/'),
      userTokenCredential: path.join(__dirname, '../secrets/'),
    }
  };
  return retr;
}

module.exports = Settings;
