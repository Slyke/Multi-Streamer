var serverController = ({ logger, listenInterface, listenPort, listenSport, httpsCredentials, settings, version } = {}) => {
  const express = require('express');
  const middlewares = require('./middlewares/index');
  const routes = require('./routes/index');
  const http = require('http');
  const https = require('https');

  return new Promise((resolve, reject) => {
    try {
      const server = express();

      server.on('error', (err) => {
        logger.error(err);
        return reject(err);
      });

      middlewares({ app: server, cors: settings.cors, httpsCredentials, version, logger });
      routes({ server, settings, httpsCredentials, version, logger });

      const listenInterfacesReady = [false, false];

      const httpServer = http.createServer(server);
      const httpsServer = https.createServer(httpsCredentials, server);

      httpServer.listen(listenPort, listenInterface, () => {
        logger.info(`Listening on: http://${listenInterface}:${listenPort}`);
        listenInterfacesReady[0] = true;
        if (listenInterfacesReady.every((index) => { return index === true; }))  {
          logger.info(`All interfaces ready.`);
          return resolve(server);
        }
      });

      if (httpsCredentials) {
        httpsServer.listen(listenSport, listenInterface, () => {
          logger.info(`Listening on: https://${listenInterface}:${listenSport}`);
          listenInterfacesReady[1] = true;

          if (listenInterfacesReady.every((index) => { return index === true; }))  {
            logger.info(`All interfaces ready.`);
            return resolve(server);
          }
        });
      }
    } catch(err) {
      logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  });
}

module.exports = serverController;
