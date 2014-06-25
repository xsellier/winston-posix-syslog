var util    = require('util')
  , winston = require('winston')
  , posix   = require('posix')
  , common  = require('winston/lib/winston/common');

var syslogLevels = {
  debug  : 'debug',
  info   : 'info',
  notice : 'notice',
  warn   : 'warning',
  error  : 'err',
  crit   : 'crit',
  alert  : 'alert'
};

var PosixSyslog = exports.PosixSyslog = function (options) {
  winston.Transport.call(this, options);

  options          = options || {};

  this.timestamp   = typeof options.timestamp !== 'undefined' ? options.timestamp : false;
  this.prettyPrint = options.prettyPrint || false;
  this.label       = options.label       || null;
  this.identity    = options.identity    || process.title;
  this.facility    = options.facility    || 'local0';

  this.openLogOptions = {
    cons   : options.cons   || true,
    ndelay : options.ndelay || true,
    pid    : options.pid    || true,
    nowait : options.nowait || true,
    odelay : options.odelay || false
  }
};

util.inherits(PosixSyslog, winston.Transport);

winston.transports.PosixSyslog = PosixSyslog;

PosixSyslog.prototype.name = 'posixSyslog';

PosixSyslog.prototype.log = function (level, msg, meta, callback) {
  var self   = this
    , output = common.log({
      message     : msg,
      meta        : meta,
      colorize    : false,
      json        : false,
      level       : level,
      message     : msg,
      meta        : meta,
      stringify   : this.stringify,
      timestamp   : this.timestamp,
      prettyPrint : this.prettyPrint,
      raw         : this.raw,
      label       : this.label
    });

  // We ignore any incompatible levels
  if (level in syslogLevels) {
    posix.openlog(self.identity, self.openLogOptions, self.facility);
    posix.setlogmask(self.getMasks());
    posix.syslog(syslogLevels[level], output);
    posix.closelog();
    self.emit('logged');
  }

  callback(null, true);
};

PosixSyslog.prototype.getMasks = function() {
  var masks = {};

  for (var level in syslogLevels) {
    var mask = syslogLevels[level];
    masks[mask] = true;
  }

  return masks;
};