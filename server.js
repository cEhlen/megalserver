var watch = require('watch')
  , bunyan = require('bunyan')
  , config = require('./config')
  , http = require('http')
  , fs = require('fs');

var log = bunyan.createLogger({name: 'megal-server'});

log.info('Watching directory ' + config.watchDir);
watch.createMonitor(config.watchDir, function (monitor) {
  monitor.on('created', function (f, stat) {
    if(config.megaLRegExp.test(f)) {
      log.info('Megamodel added. Start processing.');
    }
  });
});

var simpleTemplate = function (data, callback) {
  var html = data.replace("---[[TREEVIEW]]---", "<ul><li>test.foo</li><li>hallo</li></ul>");
  callback(html);
};

http.createServer(function (req, res) {
  fs.readFile('templates/main.html', {encoding: 'utf8'}, function (err, data) {
    if(err) {
      res.writeHead(500);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    simpleTemplate(data, function (test) {
      res.end(test);
    });
  });
}).listen(8001);