export const expiredS3ObjectsQueue = new sst.aws.Queue('ExpiredS3Objects', {
  transform: {
    queue: {
      receiveWaitTimeSeconds: 20,
      delaySeconds: 15 * 60,
    },
  },
});
