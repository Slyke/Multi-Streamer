const YoutubeController = ({ credentials, token, version, logger }) => {
  const { google } = require('googleapis');
  const YoutubeAuthoriseService = require('./youtubeAuthoriseService');

  const retr = {};

  let oauthClient = {};
  let youtubeAuthoriseService = {};

  retr.init = () => {
    logger.debug('YoutubeController:init()');
    return new Promise(async (resolve, reject) => {
      try {
        youtubeAuthoriseService = YoutubeAuthoriseService({
          credentials,
          version,
          logger
        });

        if (typeof youtubeAuthoriseService === 'object') {
          youtubeAuthoriseService.init();
          oauthClient = youtubeAuthoriseService.createClient().oauth2Client;
          return youtubeAuthoriseService.authorise({ token, checkToken: false }).then((result) => {
            oauthClient = result.oauth2Client;
            return resolve(result);
          }).catch((err) => {
            if (err.reason === 'No token') {
              return youtubeAuthoriseService.generateNewToken(oauthClient).then((newGrant) => {
                console.log(`App is not authorised. Navigate to the following URL in your browser and then enter in the code you see.`);
                console.log(`URL: ${newGrant.authUrl}`);
                console.log('');
                return youtubeAuthoriseService.cliEnterGrantCode().then(({ code }) => {
                  console.log(`Code Entered: '${code}'`);
                  return youtubeAuthoriseService.grantNewToken({ oauthClient, code }).then(({ oauth2Client, token }) => {
                    oauthClient = oauth2Client;
                    console.log(`New token has been set in client.`);
                    return resolve({
                      oauth2Client,
                      token,
                      code,
                      authorisationSuccess: true
                    })
                  }).catch((err) => {
                    return reject({
                      caller: 'YoutubeController::init()',
                      reason: 'YoutubeAuthoriseService::grantNewToken() returned an error',
                      promise: 'reject',
                      err: JSON.stringify(err, Object.getOwnPropertyNames(err))
                    });
                  });
                }).catch((err) => {
                  return reject({
                    caller: 'YoutubeController::init()',
                    reason: 'YoutubeAuthoriseService::cliEnterGrantCode() failed to provide code',
                    promise: 'reject',
                    err: JSON.stringify(err, Object.getOwnPropertyNames(err))
                  });
                });
              }).catch((err) => {
                return reject({
                  caller: 'YoutubeController::init()',
                  reason: 'YoutubeAuthoriseService::generateNewToken() failed to generate grant url',
                  promise: 'reject',
                  err: JSON.stringify(err, Object.getOwnPropertyNames(err))
                });
              });
            }
            return reject({
              caller: 'YoutubeController::init()',
              reason: `Failed to authorise. token:${token ? true : false}`,
              promise: 'reject',
              err: JSON.stringify(err, Object.getOwnPropertyNames(err))
            });
          });
        }

        const err = new Error('Internal auth service failure');
        return reject({
          caller: 'YoutubeController::init()',
          reason: 'Internal auth service failure',
          promise: 'reject',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      } catch (err) {
        return reject({
          caller: 'YoutubeController::init()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  retr.createStreamDetailResource = ({ title, description }, optionals) => {
    // See:
    //   https://developers.google.com/youtube/v3/live/docs/liveBroadcasts
    if (!title || typeof(title) !== 'string') {
      throw new Error('Title needs to be set.');
    }

    if (optionals?.status?.privacyStatus && typeof(optionals?.status?.privacyStatus) === 'string') {
      const validPrivacyStatuses = [
        'private',
        'public',
        'unlisted'
      ];

      if (validPrivacyStatuses.indexOf(optionals?.status?.privacyStatus) < 0) {
        throw new Error(`privacyStatus needs to be one of '${validPrivacyStatuses.join("','")}'`);
      }
    }

    const streamResource = {
      ...optionals,
      snippet: {
        ...optionals?.snippet ?? {},
        title,
        description,
        scheduledStartTime: optionals?.snippet?.scheduledStartTime ?? (new Date()).toISOString()
      },
      status: {
        ...optionals?.status ?? {},
        privacyStatus: optionals?.status?.privacyStatus ?? 'public',
        selfDeclaredMadeForKids: optionals?.status?.selfDeclaredMadeForKids ?? false,
      },
      contentDetails: {
        ...optionals?.contentDetails ?? {},
        enableAutoStart: optionals?.contentDetails?.enableAutoStart ?? true
      }
    };

    return streamResource;
  };

  retr.getCategoryByName = ({ categoryList, categoryName, caseSensitive }) => {
    try {
      if (typeof categoryName !== 'string' || categoryName.length < 1) {
        console.debug({
          caller: 'YoutubeController::getCategoryByName()',
          err: `Invalid categoryName: '${categoryName}'`
        });
        return {};
      }

      if (Array.isArray(categoryList) !== true) {
        console.debug({
          caller: 'YoutubeController::getCategoryByName()',
          err: `Error: categoryList is not an array: ${typeof categoryList}`
        });
        return {};
      }

      if (caseSensitive) {
        for (let i = 0; i < categoryList?.length ?? 0; i++) {
          if (categoryName === categoryList[i]?.snippet?.title) {
            return categoryList[i];
          }
        }
      } else {
        for (let i = 0; i < categoryList?.length ?? 0; i++) {
          if (categoryName.toLowerCase() === categoryList[i]?.snippet?.title.toLowerCase()) {
            return categoryList[i];
          }
        }
      }
      return {};
    } catch(err) {
      console.debug({
        caller: 'YoutubeController::getCategoryByName()',
        err: JSON.stringify(err, Object.getOwnPropertyNames(err))
      });

      return {};
    }
  };

  retr.getChannel = ({ oauth2Client }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const youtubeService = google.youtube('v3');

        return youtubeService.channels.list({
            auth: oauth2Client,
            part: 'snippet,contentDetails,statistics',
            mine: true
          },
          (err, response) => {
            if (err) {
              return reject({
                caller: 'YoutubeController::getChannel()',
                promise: 'reject',
                err: JSON.stringify(err, Object.getOwnPropertyNames(new Error(JSON.stringify(err))))
              });
            }

            return resolve({
              data: (response?.data ?? {}),
              response
            });
          });
      } catch (err) {
        return reject({
          caller: 'YoutubeController::getChannel()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  retr.getLiveBroadcasts = ({ oauth2Client, broadcastStatus, broadcastTypes, maxResults }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const youtubeService = google.youtube('v3');

        const validBroadcastTypes = [
          'all',
          'event',
          'persistent',
          'broadcastTypeFilterUnspecified'
        ];

        const validBroadcastStatuses = [
          'all',
          'active',
          'upcoming',
          'completed',
          'broadcastStatusFilterUnspecified'
        ];

        return youtubeService.liveBroadcasts.list({
            auth: oauth2Client,
            maxResults: maxResults ?? 3,
            broadcastType: broadcastTypes ?? 'all',
            broadcastStatus: broadcastStatus ?? 'all', // Don't set this if 'mine: true'
            part: 'snippet,contentDetails,status',
            // mine: true
          },
          (err, response) => {
            if (err) {
              return reject({
                caller: 'YoutubeController::getLiveBroadcasts()',
                promise: 'reject',
                err: JSON.stringify(err, Object.getOwnPropertyNames(new Error(JSON.stringify(err))))
              });
            }

            return resolve({
              data: (response?.data ?? {}),
              response
            });
          });
      } catch (err) {
        return reject({
          caller: 'YoutubeController::getLiveBroadcasts()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  retr.getLiveStreams = ({ oauth2Client }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const youtubeService = google.youtube('v3');

        return youtubeService.liveStreams.list({
            auth: oauth2Client,
            part: 'snippet,contentDetails,status',
            mine: true
          },
          (err, response) => {
            if (err) {
              return reject({
                caller: 'YoutubeController::getLiveStreams()',
                promise: 'reject',
                err: JSON.stringify(err, Object.getOwnPropertyNames(new Error(JSON.stringify(err))))
              });
            }

            return resolve({
              data: (response?.data ?? {}),
              response
            });
          });
      } catch (err) {
        return reject({
          caller: 'YoutubeController::getLiveStreams()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  retr.createBroadcast = ({ oauth2Client, checkIfLive, checkIfUpcoming, streamResource }) => {
    // See:
    //   https://developers.google.com/youtube/v3/live/docs/liveBroadcasts/insert
    return new Promise(async (resolve, reject) => {
      try {
        let checkIfLivePromise = Promise.resolve(null);
        let checkIfUpcomingPromise = Promise.resolve(null);

        if (checkIfLive ?? true) {
          checkIfLivePromise = retr.getLiveBroadcasts({ oauth2Client, broadcastStatus: 'active' });
        }

        if (checkIfUpcoming ?? true) {
          checkIfUpcomingPromise = retr.getLiveBroadcasts({ oauth2Client, broadcastStatus: 'upcoming' });
        }

        return Promise.all([checkIfLivePromise, checkIfUpcomingPromise]).then(([liveResults, upcomingResults]) => {
          if ((liveResults?.data?.items?.length ?? 0) > 0) {
            const err = new Error('Already livestreaming');
            return reject({
              caller: 'YoutubeController::createBroadcast()',
              reason: `Already livestreaming. Found ${liveResults.data.items.length} liveStreams`,
              promise: 'reject',
              err: JSON.stringify(err, Object.getOwnPropertyNames(new Error(JSON.stringify(err))))
            });
          }

          if ((upcomingResults?.data?.items?.length ?? 0) > 0) {
            const err = new Error('Upcoming livestream already exists');
            return reject({
              caller: 'YoutubeController::createBroadcast()',
              reason: `Upcoming livestream already exists. Found ${upcomingResults.data.items.length} upcoming liveStreams`,
              promise: 'reject',
              err: JSON.stringify(err, Object.getOwnPropertyNames(new Error(JSON.stringify(err))))
            });
          }

          const youtubeService = google.youtube('v3');
          return youtubeService.liveBroadcasts.insert({
              auth: oauth2Client,
              part: 'id,snippet,contentDetails,status',
              mine: true,
              resource: streamResource
            },
            (err, response) => {
              if (err) {
                return reject({
                  caller: 'YoutubeController::createBroadcast()',
                  promise: 'reject',
                  err: JSON.stringify(err, Object.getOwnPropertyNames(new Error(JSON.stringify(err))))
                });
              }

              return resolve({
                data: (response?.data ?? {}),
                response
              });
            });
        });

      } catch (err) {
        return reject({
          caller: 'YoutubeController::createBroadcast()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  retr.updateVideo = ({ oauth2Client, videoResource }) => {
    // See: https://developers.google.com/youtube/v3/docs/videos/update
    return new Promise(async (resolve, reject) => {
      try {
        const youtubeService = google.youtube('v3');

        return youtubeService.videos.update({
            auth: oauth2Client,
            part: 'snippet,contentDetails,status',
            mine: true,
            resource: videoResource
          },
          (err, response) => {
            if (err) {
              return reject({
                caller: 'YoutubeController::updateVideo()',
                promise: 'reject',
                err: JSON.stringify(err, Object.getOwnPropertyNames(new Error(JSON.stringify(err))))
              });
            }

            return resolve({
              data: (response?.data ?? {}),
              response
            });
          });
      } catch (err) {
        return reject({
          caller: 'YoutubeController::updateVideo()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  retr.transitionVideo = ({ oauth2Client, videoId, newStatus }) => {
    // See: https://developers.google.com/youtube/v3/live/docs/liveBroadcasts/transition
    return new Promise(async (resolve, reject) => {
      try {
        const youtubeService = google.youtube('v3');

        return youtubeService.liveBroadcasts.transition({
            auth: oauth2Client,
            part: 'snippet,contentDetails,status',
            broadcastStatus: newStatus,
            id: videoId
          },
          (err, response) => {
            if (err) {
              return reject({
                caller: 'YoutubeController::transitionVideo()',
                promise: 'reject',
                err: JSON.stringify(err, Object.getOwnPropertyNames(new Error(JSON.stringify(err))))
              });
            }

            return resolve({
              data: (response?.data ?? {}),
              response
            });
          });
      } catch (err) {
        return reject({
          caller: 'YoutubeController::transitionVideo()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  retr.deleteVideo = ({ oauth2Client, videoId }) => {
    // See: https://developers.google.com/youtube/v3/docs/videos/delete
    return new Promise(async (resolve, reject) => {
      try {
        const youtubeService = google.youtube('v3');

        return youtubeService.videos.delete({
            auth: oauth2Client,
            id: videoId
          },
          (err, response) => {
            if (err) {
              return reject({
                caller: 'YoutubeController::deleteVideo()',
                promise: 'reject',
                err: JSON.stringify(err, Object.getOwnPropertyNames(new Error(JSON.stringify(err))))
              });
            }

            return resolve({
              data: (response?.data ?? {}),
              response
            });
          });
      } catch (err) {
        return reject({
          caller: 'YoutubeController::deleteVideo()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  retr.getCategoryIds = ({ oauth2Client, regionCode }) => {
    // See: https://developers.google.com/youtube/v3/docs/videoCategories/list
    return new Promise(async (resolve, reject) => {
      try {
        if (regionCode?.length !== 2) {
          const err = new Error('Invalid region code');
          return reject({
            caller: 'YoutubeController::getCategoryIds()',
            reason: `Invalid region code. Provided region code: '${regionCode}'`,
            promise: 'reject',
            err: JSON.stringify(err, Object.getOwnPropertyNames(new Error(JSON.stringify(err))))
          });
        }

        const youtubeService = google.youtube('v3');

        return youtubeService.videoCategories.list({
            auth: oauth2Client,
            part: 'snippet',
            regionCode
          },
          (err, response) => {
            if (err) {
              return reject({
                caller: 'YoutubeController::getCategoryIds()',
                promise: 'reject',
                err: JSON.stringify(err, Object.getOwnPropertyNames(new Error(JSON.stringify(err))))
              });
            }

            return resolve({
              data: (response?.data ?? {}),
              response
            });
          });
      } catch (err) {
        return reject({
          caller: 'YoutubeController::getCategoryIds()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  return retr;
};

module.exports = YoutubeController;
