# d2l-beaker
[![NPM version][npm-image]][npm-url]
[![Build status][ci-image]][ci-url]
[![Dependency Status][dependencies-image]][dependencies-url]

A driver for Google Puppeteer to collect client-side performance metrics.

## Installation

Install `d2l-beaker`.
```shell
npm i d2l-beaker -g
```

## Usage

### Basic Setup

While `d2l-beaker` supports a few CLI arguments, is relies on a config file to specify details about the target site and measurements to be taken.  Specify this configuration in a JS module, such as `perf.config.js` or this [sample config](https://github.com/Brightspace/d2l-beaker/blob/master/sample.conf.js).

```js
module.exports = {
  "applicationKey": "your-app",
  "caching": true,
  "headless": false,
  "samplesPerTarget": 10,
  "measurements": ["first-paint", "first-contentful-paint"],
  "properties": [],
  "target": {
    "site": "https://yourapp.com",
    "login": {
      "url": "/login",
      "user": {"selector": "#userName", "value": "test-user"},
      "password": {"selector": "#password", "value": "test-password"},
      "submit": {"selector": "#loginButton"}
    },
    "targets": [
      {"name": "target1", "url": "/some-relative-url-1"},
      {"name": "target2", "url": "/some-relative-url-2"},
      {"name": "target3", "url": "/some-relative-url-3"}
    ]
  }
};
```

Once this configuration has been defined, `d2l-beaker` can go to task by running the CLI.

```shell
measure --configjs perf.config.js
```

It will produce some JSON that summarizes the samples taken for each target - the std. mean (95%).  All measurements are reported in milliseconds as per [PerformanceEntry](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEntry).

```json
{
  "application-key":"your-app",
  "target-site":"https://yourapp.com",
  "target-url":"/some-relative-url-1",
  "target-name":"target1",
  "browser":"Chrome/67.0.3372.0",
  "caching":true,
  "timestamp":"2018-03-23 15:47:56.182",
  "properties":[],
  "measurements":[
    {"name":"first-paint","entryType":"paint","startTime":0,"duration":940},
    {"name":"first-contentful-paint","entryType":"paint","startTime":0,"duration":940}
  ]
}
```

### CLI Options

The CLI supports a number of options to enable re-using configuration, or to avoid saving sensitive user/password info.

```shell
measure --user some-user --pwd some-password --configjs perf.config.js
```

* `--configjs`          Configuration JS module (**required**)
* `--applicationKey`    Key for application
* `--caching`           Whether to enable caching
* `--headless`          Whether to run headless
* `--samplesPerTarget`  Number of times to measure each page
* `--targetSite`        Target site to measure targets
* `--user`              Username to login
* `--pwd`               Password to login

### Login Info

The login page info (url, user & password selectors and values, and submit button selector) can be configured.

```js
module.exports = {
  "target": {
    "login": {
      "url": "/login",
      "user": {"selector": "#userName", "value": "test-user"},
      "password": {"selector": "#password", "value": "test-password"},
      "submit": {"selector": "#loginButton"}
    }
  }
};
```

Alternatively, the user and password can be specified as environment variables.

```js
module.exports = {
  "target": {
    "login": {
      "url": "/login",
      "user": {"selector": "#userName", "value": "{{TEST-USER-VAR}}"},
      "password": {"selector": "#password", "value": "{{TEST-PASSWORD-VAR}}"},
      "submit": {"selector": "#loginButton"}
    }
  }
};
```

### More Measurements

Need to extract different measurements?  No problem, as long it's a mark, paint, or measure entry available via the [browser performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance/getEntries), it can be extracted and recorded. It is also possible to specify measurements to be gathered per-target.

Note: if your measurement name ends with a `*`, the extractor will look for any measures that match, but it won't wait for them beyond page load. If there is a specific measure that may be delayed, list is explicitly and list it only for targets where it's expected.

```js
module.exports = {
  "measurements": ["some-measure", "yourapp.*"],
  "target": {
    "targets": [
      {"name": "target1", "url": "/some-relative-url-1", "measurements": ["some-other-measure"]},
      {"name": "target2", "url": "/some-relative-url-2"},
      {"name": "target3", "url": "/some-relative-url-3"}
    ]
  }
};
```

### Properties

`d2l-beaker` supports extracting properties along with its measurements. The following example shows how an `app-version` and a `polymer-version` property could be extracted. Note: the property provider may be `async` if needed.

```js
module.exports = {
  "properties": [
    {
      "key": "app-version",
      "provider": () => {
        return return document.documentElement.getAttribute('data-app-version');
      }
    },
    {
      "key": "polymer-version",
      "provider": () => {
        return Polymer.version;
      }
    }
  ]
};
```

The extracted properties will be included in the JSON output.

```json
{
  "application-key":"your-app",
  "target-site":"https://yourapp.com",
  "target-url":"/some-relative-url-1",
  "target-name":"target1",
  "browser":"Chrome/67.0.3372.0",
  "caching":true,
  "timestamp":"2018-03-23 15:47:56.182",
  "properties":[
    {"name":"app-version","value":"10.8.1"},
    {"name":"polymer-version","value":"2.5.0"}
  ],
  "measurements":[
    {"name":"first-paint","entryType":"paint","startTime":0,"duration":940},
    {"name":"first-contentful-paint","entryType":"paint","startTime":0,"duration":940}
  ]
}
```

### Upload

Optionally automatically upload results to your favorite S3 bucket via configuration.

```js
module.exports = {
  "upload": {
    "key": "S3",
    "target": "some.bucket/some-folder",
    "region": "us-east-1",
    "creds": {
      "accessKeyId": "some-id",
      "secretAccessKey": "some-secret-key"
    }
  }
};
```

Or using environment variables...

```js
module.exports = {
  "upload": {
    "key": "S3",
    "target": "some.bucket/some-folder",
    "region": "us-east-1",
    "creds": {
      "accessKeyId": "{{SOME-ID-VAR}}",
      "secretAccessKey": "{{SOME-SECRET-KEY-VAR}}"
    }
  }
};
```

**Note: keep your secret keys secret!**

## Contributing

Contributions are welcome, please submit a pull request!

### Code Style

This repository is configured with [EditorConfig](http://editorconfig.org) rules and contributions should make use of them.

[npm-url]: https://npmjs.org/package/d2l-beaker
[npm-image]: https://img.shields.io/npm/v/d2l-beaker.svg
[ci-image]: https://travis-ci.org/Brightspace/d2l-beaker.svg?branch=master
[ci-url]: https://travis-ci.org/Brightspace/d2l-beaker
[dependencies-url]: https://david-dm.org/brightspace/d2l-beaker
[dependencies-image]: https://img.shields.io/david/Brightspace/d2l-beaker.svg
