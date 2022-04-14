
#  customs-request

## Installation

Using npm:

```bash
$ npm install levers-db
```
## Configuration

```js
// options.js

const path = require("path");
const main_app = require('./main_app');
const {db} = require('./start_app'); //db: type instance - levers-db;

const options = {
    main_dir: path.join(__dirname, '/src/assets'), // main project directory. Use full path - __dirname, 'current_dir'
    error_pages_dir: path.join(__dirname, '/src/assets/pages_errors'), // directory with error pages: 404.html, 401.html, ..., .
    urls: [
        {
            value: '/private',
            access_level: 2
        },
        {
            value: '/private/all_user',
        },
        {
            value: '/public',
        },
        {
            value: '/public/only_user',
            access_level: 2
        },
        {
            value: '/get_test_info_all',
        },
        {
            value: '/get_test_info_user',
            access_level: 2
        },
        {
            value: '/get_test_info_admin',
            access_level: 1
        },
    ],
    app: main_app,
    db
}

module.exports = options
```

## Usage

```js

// server.js

const Client = require('customs-request');
const options = require('./options');
Client.set_config(options);

```

## License

[MIT](LICENSE)