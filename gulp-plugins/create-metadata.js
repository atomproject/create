'use strict';

// TODO: extract innerHTML also

var promisify = require('promisify-node');
var readFile = promisify(require('fs').readFile);
let cheerio = require('cheerio');
let through = require('through2');
let PluginError = require('gulp-util').PluginError;
let hydrolysis = require('hydrolysis');

let PLUGIN_NAME = 'create-metadata';

function toCamelCase(dash) {
  return dash.replace(/-([a-z])/g, function(m) {
    return m[1].toUpperCase();
  });
}

function createMetadata(file, enc, cb) {
  let json = JSON.parse(file.contents);
  let elements = json.elements.map(el => {
    el.demoFilePath = `bower_components/${el.name}/demo/index.html`;
    el.propertyFilePath = `bower_components/${el.name}/property.json`;

    return el;
  });

  elements.push({
    name: 't-form',
    demoFilePath: 'app/elements/t-stage.html',
    propertyFilePath: 'bower_components/t-form/property.json'
  });

  elements.push({
    name: 't-page',
    demoFilePath: 'app/elements/t-stage.html',
    propertyFilePath: 'bower_components/t-page/property.json'
  });

  let elementsPromise = elements.map(el => {
    let propertyPromise = readFile(el.propertyFilePath, enc)
      .then(pf => JSON.parse(pf));

    let demoPromise = readFile(el.demoFilePath, enc)
      .then(df => {
        let $ = cheerio.load(df);
        let parsedElement = $(el.name)[0];
        let innerHTML = $(el.name).html() || '';
        let attributes = {};

        if (!parsedElement) {
          throw `No component found in demo file ${el.demoFilePath}`;
        }

        Object.keys(parsedElement.attribs || {}).forEach(function(attr) {
          attr = toCamelCase(attr);
          attributes[attr] = parsedElement.attribs[attr];
        });

        return {
          name: el.name,
          innerHTML: innerHTML,
          attributes: attributes
        };
      });

    let bowerDepsPromise = readFile(`bower.json`)
      .then(bower => {
        bower = JSON.parse(bower || '{}');

        return Object.assign({}, bower.dependencies, bower.devDependencies);
      });

    let hydroPromise = hydrolysis.Analyzer.analyze(el.demoFilePath);

    let depsPromise = Promise.all([hydroPromise, bowerDepsPromise])
      .then(values => {
        let hydro = values.shift();
        let bowerDeps = values.shift();
        let docs = hydro.parsedDocuments || {};
        let scripts = hydro.parsedScripts || {};

        function parse(type, relPath) {
          relPath = relPath.replace('bower_components/', '');
          let pkg = relPath.match(/^[^\/]+/);
          let install = bowerDeps[pkg];

          if (install && !/[/#]/.test(install)) {
            install = `${pkg}#${install}`;
          }

          if (!pkg) {
            return Promise.reject(`Bad path in demo file: ${relPath}`);
          }

          return {
            pkg: pkg[0],
            relPath: relPath,
            install: install,
            type: type
          };
        }

        function filter(dep) {
          return !/index\.html/.test(dep.relPath);
        }

        docs = Object.keys(docs)
          .map(parse.bind(null, 'link'))
          .filter(filter);

        scripts = Object.keys(scripts)
          .map(parse.bind(null, 'script'))
          .filter(filter)
          .filter(function(script) {
            return script && script.pkg !== 'webcomponentsjs';
          });

        return [].concat(scripts, docs);
      })
      .catch(() => []);

    return Promise.all([propertyPromise, demoPromise, depsPromise]);
  });

  Promise.all(elementsPromise)
    .then(elements => {
      let metadata = {};

      elements.forEach(el => {
        let property = el[0];
        let demo = el[1];
        let deps = el[2];

        metadata[demo.name] = {
          property: property,
          innerHTML: demo.innerHTML,
          attributes: demo.attributes,
          dependencies: deps
        };
      });

      return metadata;
    })
    .then(metadata => {
      // we don't want innerHTML and dependencies for builders
      metadata['t-form'].innerHTML = metadata['t-page'].innerHTML = '';
      metadata['t-form'].dependencies = [];
      metadata['t-page'].dependencies = [];

      file.path = file.path.replace('-manifest', '');
      file.contents = new Buffer(JSON.stringify(metadata, null, 4));

      cb(null, file);
    })
    .catch(err => this.emit('error', new PluginError(PLUGIN_NAME, err)));
}

module.exports = function() {
  return through.obj(function (file, enc, cb) {
    if (file.isBuffer()) {
      createMetadata(file, enc, cb);
    }
    else if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
    }
  });
};
