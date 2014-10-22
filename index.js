var tar = require('tar-fs');
var zlib = require('zlib');
var rimraf = require('rimraf');
var Uploader = require('s3-streaming-upload').Uploader;
var pathUtils = require('path');

var liveBackupFailedError = new Error('liveBackup failed');
var levelInstanceNotReadyError = new Error('leveldb instance is not ready');
var awsConfigRequiredError = new Error('AWS config required (accessKey, secretKey, bucket)');

module.exports = function(db) {
  /**
   * Backup database and upload tar.gz archive to S3
   *
   * @param {string} backupName Backup name
   * @param {string} opts.accessKey AWS access key
   * @param {string} opts.secretKey AWS secret key
   * @param {string} opts.bucket AWS bucket name
   * @param {function} cb Callback function
   */
  return function(backupName, opts, cb) {
    if (!db.db || !db.db.liveBackup) {
      return cb(levelInstanceNotReadyError);
    }

    if (!db.location) {
      return cb(levelInstanceNotReadyError);
    }

    if (!opts || !opts.accessKey || !opts.secretKey || !opts.bucket) {
      return cb(awsConfigRequiredError);
    }

    var location = db.location;
    var backupDirName = 'backup-' + backupName;
    var backupLocation = pathUtils.resolve(location, backupDirName);
    var archive = backupDirName + '.tar.gz';

    function removeBackup(cb) {
      rimraf(backupLocation, function(err) {
        if (err === Object(err)) {
          console.log('rimraf error', err.stack);
        }

        return cb(err);
      });
    }

    db.db.liveBackup(backupName, function(err) {
      if (err) return cb(err);

      var gzip = zlib.createGzip();

      var upload = new Uploader({
        accessKey: opts.accessKey,
        secretKey: opts.secretKey,
        bucket: opts.bucket,
        objectName: archive,
        stream: tar.pack(backupLocation).pipe(gzip)
      });

      upload.on('completed', function(err, res) {
        removeBackup(function() {
          if (err) return cb(err);
          return cb(null, { uploaded: archive });
        });
      });

      upload.on('failed', function(err) {
        removeBackup(function() {
          return cb(err);
        });
      });
    });
  };
};
