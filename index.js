var tar = require('tar-fs');
var rimraf = require('rimraf');
var Uploader = require('s3-streaming-upload').Uploader;
var pathUtils = require('path');

var liveBackupFailedError = new Error('liveBackup failed');
var levelInstanceNotReadyError = new Error('leveldb instance is not ready');
var awsConfigRequiredError = new Error('AWS config required (accessKey, secretKey, bucket)');

module.exports = function(db) {
  /**
   * Backup database and upload tar archive to S3
   *
   * @param {string} backupName Backup name
   * @param {string} awsConfig.accessKey AWS access key
   * @param {string} awsConfig.secretKey AWS secret key
   * @param {string} awsConfig.bucket AWS bucket name
   * @param {function} cb Callback function
   */
  return function(backupName, awsConfig, cb) {
    if (!db.db || !db.db.liveBackup) {
      return cb(levelInstanceNotReadyError);
    }

    if (!db.location) {
      return cb(levelInstanceNotReadyError);
    }

    if (!awsConfig || !awsConfig.accessKey || !awsConfig.secretKey || !awsConfig.bucket) {
      return cb(awsConfigRequiredError);
    }

    var location = db.location;
    var backupDirName = 'backup-' + backupName;
    var backupLocation = pathUtils.resolve(location, backupDirName);
    var archive = backupDirName + '.tar';

    db.db.liveBackup(backupName, function(err) {
      if (err) return cb(err);

      var upload = new Uploader({
        accessKey: awsConfig.accessKey,
        secretKey: awsConfig.secretKey,
        bucket: awsConfig.bucket,
        objectName: archive,
        stream: tar.pack(backupLocation)
      });

      upload.on('completed', function(err, res) {
        if (err) return cb(err);

        rimraf(backupLocation, function(err) {
          console.log('rimraf error', err);
        });

        return cb(null, { uploaded: archive });
      });

      upload.on('failed', function(err) {
        return cb(err);
      });
    });
  };
};
