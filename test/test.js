process.env.NODE_ENV = 'test';

var fs = require('fs');
var expect = require('chai').expect;
var pathUtils = require('path');
var mockery = require('mockery');
mockery.registerSubstitute('streaming-s3', pathUtils.resolve(__dirname, './mocks/streamingS3'));
mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
});

var backupHyper = require('../index');

function backupPathFromName(name) {
  return pathUtils.resolve(__dirname, 'backup-' + name);
}

/**
 * DB instance that is possible to backup
 */
var dbLiveBackupOk = {
  db: {
    liveBackup: function(name, cb) {
      var backupPath = backupPathFromName(name);
      fs.mkdirSync(backupPath);
      fs.writeFileSync(pathUtils.resolve(backupPath, 'f1.tmp'), 'abc');
      return cb(null);
    }
  },
  location: __dirname
};

/**
 * DB instance that is NOT possible to backup
 */
var dbLiveBackupFail = {
  db: {
    liveBackup: function(name, cb) {
      return cb(new Error('liveBackup failed'));
    }
  },
  location: __dirname
};

describe('Backup', function() {
  var backupName = 'testname';
  var backupPath = backupPathFromName(backupName);

  it('should be able to use valid keys to upload backup when backup succeeded', function(done) {
    backupHyper(dbLiveBackupOk)(backupName, {
      accessKey: 'VALID',
      secretKey: '-',
      bucket: '-'
    }, function(err, result) {
      expect(err).to.not.exist;
      expect(fs.existsSync(backupPath)).to.equal(false);
      expect(result).to.be.an('object');
      expect(result).to.include.keys(['uploaded']);
      expect(result.uploaded).to.equal('backup-' + backupName + '.tar.gz');
      done();
    });
  });

  it('should not be able to use invalid keys to upload backup when backup succeeded', function(done) {
    backupHyper(dbLiveBackupOk)(backupName, {
      accessKey: 'INVALID',
      secretKey: '-',
      bucket: '-'
    }, function(err, result) {
      expect(err).to.exist;
      expect(err.message).to.equal('upload failed');
      expect(fs.existsSync(backupPath)).to.equal(false);
      done();
    });
  });

  it('should not be able to upload data when AWS bucket is missing', function(done) {
    backupHyper(dbLiveBackupOk)(backupName, {
      accessKey: 'INVALID',
      secretKey: '-'
    }, function(err, result) {
      expect(err).to.exist;
      expect(err.message).to.contain('AWS config required');
      expect(fs.existsSync(backupPath)).to.equal(false);
      done();
    });
  });

  it('should not be able to upload data when liveBackup failed', function(done) {
    backupHyper(dbLiveBackupFail)('testname', {
      accessKey: 'VALID',
      secretKey: '-',
      bucket: '-'
    }, function(err, result) {
      expect(err).to.exist;
      expect(err.message).to.equal('liveBackup failed');
      expect(fs.existsSync(backupPath)).to.equal(false);
      done();
    });
  });
});
