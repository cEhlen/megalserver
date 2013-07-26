var watch = require('watch')
  , bunyan = require('bunyan')
  , config = require('./config')
  , http = require('http')
  , fs = require('fs')
  , path = require('path');

function treeSync (root) {
  var s = fs.lstatSync(root);
  s.name = root;
  if (!s.isDirectory()) return s;
  var children = fs.readdirSync(root);
  s.children = [];
  for (var i = 0, l = children.length; i < l; i ++) {
    var child = treeSync(path.join(root, children[i]));
    child.name = children[i];
    child.path = path.join(root, children[i]);
    s.children.push(child);
  }
  return s;
}


var log = bunyan.createLogger({name: 'megal-server'});

log.info('Watching directory ' + config.watchDir);
watch.createMonitor(config.watchDir, function (monitor) {
  monitor.on('created', function (f, stat) {
    if(config.megaLRegExp.test(f)) {
      log.info('Megamodel added. Start processing.');
    }
  });
});

var recursiveTreeview = function (obj, path, id) {
  var text = '';
  if(obj.children && obj.children.length > 0) {
    if(id === 0) {
      text += '<li><input type="checkbox" checked="checked" id="item-' + id + '">';
    } else {
      text += '<li><input type="checkbox" id="item-' + id + '">';
    }
    text += '<label for="item-' + id + '">' + obj.name + "</label><ul>";
    for (var i = 0; i < obj.children.length; i++) {
      text += recursiveTreeview(obj.children[i], path + '/' + obj.name, ++id);
    };
    text += '</ul></li>';
  } else {
    text += '<li><a href="#" data-path="/files' + path + '/' + obj.name + '">'+obj.name+'</a></li>'
  }
  return text;
}

var simpleTemplate = function (data, callback) {
  var rawJSON = treeSync(config.watchDir);
  var tree = recursiveTreeview(rawJSON, '', 0);
  var html = data.replace("---[[TREEVIEW]]---", tree);
  callback(html);
  
};

var filesRoute = /\/files\/(.*)/;

http.createServer(function (req, res) {
  if(req.url === '/') {
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
  } else if (filesRoute.test(req.url)) {
    var path = filesRoute.exec(req.url);
    fs.readFile('./' + path[1], {encoding: 'utf8'}, function (err, data) {
      if(err) {
        res.writeHead(500);
        res.end(JSON.stringify(err));
        return;
      }
      res.writeHead(200);
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('404');
  }
}).listen(8001);