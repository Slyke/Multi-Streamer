const fs = require('fs');
const YoutubeController = require('./youtube/youtubeController');

const startYoutube = async ({
  streamCountPolicy = 3
  credentials,
  token
}) => {
  try {
    const youtubeController = YoutubeController({
      logger: console,
      credentials,
      token
    });

    const initRes = await youtubeController.init();
    const channelRes = await youtubeController.getChannel({ oauth2Client: initRes.oauth2Client });
    const countryCode = channelRes.data.items[0].snippet.country;

    const liveStreamDetails = youtubeController.createStreamDetailResource({
      title: 'testStreamTitle',
      description: 'testStreamDescription'
    },
    {
      status: {
        privacyStatus: 'private'
      }
    });

    let videoStream;
    let policyOutcome = -1;

    const [categoryIds, activeBroadcastsResponse, upcomingBroadcastsResponse] = await Promise.all([
      youtubeController.getCategoryIds({ oauth2Client: initRes.oauth2Client, regionCode: countryCode }),
      youtubeController.getLiveBroadcasts({ oauth2Client: initRes.oauth2Client, broadcastStatus: 'active' }),
      youtubeController.getLiveBroadcasts({ oauth2Client: initRes.oauth2Client, broadcastStatus: 'upcoming' })
    ]);

    const activeBroadcasts = activeBroadcastsResponse.data.items;
    const upcomingBroadcasts = upcomingBroadcastsResponse.data.items;

    // If there's a stream already created or running, then use it
    if (streamCountPolicy === 1) {
      if ((activeBroadcasts.length + upcomingBroadcasts.length) === 1) {
        if (activeBroadcasts.length === 1) {
          videoStream = activeBroadcasts[0];
          policyOutcome = 2;
        }

        if (upcomingBroadcasts.length === 1) {
          videoStream = upcomingBroadcasts[0];
          policyOutcome = 3;
        }
      } else if ((activeBroadcasts.length + upcomingBroadcasts.length) === 0) {
        policyOutcome = 1;
        videoStream = await youtubeController.createBroadcast({ oauth2Client: initRes.oauth2Client, streamResource: liveStreamDetails });
      } else {
        return new Error(`Too many streams already exist. Please end them so that at most 1 is running. streamCountPolicy: ${streamCountPolicy}, activeBroadcast Count: ${activeBroadcasts.length}, upcomingBroadcasts Count: ${upcomingBroadcasts.length}`);
        return 0;
      }
    } else if (streamCountPolicy === 2) { // Do not reattach, create if none exist.
      if ((activeBroadcasts.length + upcomingBroadcasts.length) > 0) {
        return new Error(`Too many streams already exist. Please end them so that at most 1 is running. streamCountPolicy: ${streamCountPolicy}, activeBroadcast Count: ${activeBroadcasts.length}, upcomingBroadcasts Count: ${upcomingBroadcasts.length}`);
      } else {
        policyOutcome = 1;
        videoStream = await youtubeController.createBroadcast({ oauth2Client: initRes.oauth2Client, streamResource: liveStreamDetails });
      }
    } else if (streamCountPolicy === 3) { // End all current streams and delete all up coming streams, create new stream.
      const completeVideoPromises = [];
      activeBroadcasts.forEach((activeBroadcast) => {
        completeVideoPromises.push(youtubeController.transitionVideo({ oauth2Client: initRes.oauth2Client, videoId: activeBroadcast.id, newStatus: 'complete' }));
        policyOutcome = 4;
      });
      upcomingBroadcasts.forEach((upcomingBroadcast) => {
        completeVideoPromises.push(youtubeController.deleteVideo({ oauth2Client: initRes.oauth2Client, videoId: upcomingBroadcast.id }));
        policyOutcome = 4;
      });

      await Promise.all(completeVideoPromises);
      videoStream = await youtubeController.createBroadcast({ oauth2Client: initRes.oauth2Client, streamResource: liveStreamDetails });
    } else if (streamCountPolicy === 4) { // Reattach to most recent active or upcoming stream, or create new.
      if ((activeBroadcasts.length + upcomingBroadcasts.length) > 0) {
        if (activeBroadcasts.length > 0) {
          videoStream = activeBroadcasts[0];
          policyOutcome = 2;
        } else if (upcomingBroadcasts.length > 0) {
          videoStream = upcomingBroadcasts[0];
          policyOutcome = 3;
        }
      } else if ((activeBroadcasts.length + upcomingBroadcasts.length) === 0) {
        policyOutcome = 1;
        videoStream = await youtubeController.createBroadcast({ oauth2Client: initRes.oauth2Client, streamResource: liveStreamDetails });
      }
    }

    const categoryId = youtubeController.getCategoryByName({ categoryList: categoryIds?.data?.items, categoryName: 'Gaming' });

    videoStream.snippet.categoryId = categoryId.id;
    videoStream = await youtubeController.updateVideo({ oauth2Client: initRes.oauth2Client, videoResource: videoStream });
    return {
      videoStream,
      categoryId,
      policyOutcome
    };
  } catch(err) {
    throw err;
  }
};

module.exports = {
  startYoutube
};

