const path = require("path");
const get_config = require('./lib/resolve.config');
const {exists_file} = require('./lib/fs_lite');


function _log() {
    console.log('\n');
    console.log(this.req.originalUrl + '++++++originalUrl');
    console.log(this.status_code + '++++++status_code');
    console.log(this.method + '++++++method');
    console.log(this.url_value + '++++++url_value');
    console.log(this.target_path + '++++++target_path');
    console.log('\n');
}

let reEx_check_syntax_url = new RegExp('^(?:\/[a-zA-Z0-9-_]+)*(?:\/[a-zA-Z0-9-#_.]+)+(?:\\?[_a-zA-Z0-9=&]*|$)$');
let reEx_is_dir = new RegExp('(?:\/[_a-zA-Z0-9-]+\/?$)|(?:^\/$)');
let reEx_bad = new RegExp('\\.{2,}', 'gi');


let main_dir, // config
    error_pages_dir, // config
    users, //db
    urls, // config | db
    app, // config
    token_name // config,

class Client {
    static async set_config(configuration) {
        let data = await get_config(configuration);
        main_dir = data.main_dir;
        error_pages_dir = data.error_pages_dir;
        app = data.app;
        urls = data.urls;
        users = data.users;
        token_name = data.token_name;
    }

    constructor(request, response) {
        this.req = request
        this.res = response
        this.user = null;
        this.target_path = null;
        this.method_result = null;
        this.method = null;
        this.url_level = null;
        this.url_level_only = null;
        this.url_value = '';
        this.status_code = null;
        this.cookie = request.cookies;
        this.body = request.body;
        this.query = request.query;
    }

    async init() {
        await this.resolve_url(urls);
    }

    match_url() {
        let curr_url = false
        for (let i = 0; i < urls.length; i++) {
            let url = urls[i];
            let re = new RegExp(`^${url.value}(?:\/|\\?|$).*`);
            if (re.test(this.url_value) && (curr_url === false || url.value.length > curr_url.length)) {
                curr_url = url.value;
                this.method = url.app;
                this.url_level = url.access_level || null;
                this.url_level_only = url.access_level_only || null;
            }
        }

        return curr_url !== false;
    }

    async resolve_url() {
        if (this._check_url() && this.match_url()) {
            this.status_code = 200;
            if (typeof this.url_level === 'number') await this._check_user();
        } else {
            this.status_code = 404;
        }
        await this.file_path_resolve()
    }

    async file_path_resolve() {
        if (this.method && this.status_code === 200) {
            let [app_name, method_name] = this.url_value.match(/[a-zA-Z0-9-_]+(?=\?|\/)/gi);
            if (app[app_name] && typeof app[app_name][method_name] === 'function') {
                this.method_result = await app[app_name][method_name](this.user, this.req, this.res) + '';
                return
            } else this.status_code = 404;
        }
        this.target_path = {
            200: path.join(main_dir, this.url_value),
            401: path.join(error_pages_dir, '/401.html'), // страница авторизации
            404: path.join(error_pages_dir, '/404.html'),
        }[this.status_code];

        let res = await exists_file(this.target_path);
        if (!res) {
            this.status_code = 404;
            await this.file_path_resolve()
        }
    }

    _check_user() {
        let token;
        if (!this.cookie[token_name]) {
            this.status_code = 401;
            return;
        } else token = this.cookie[token_name];
        for (let i = 0; i < users.length; i++) {
            let user = users[i];
            if (!this.url_level_only) this.url_level_only = user.level;
            if (user.token === token && user.level <= this.url_level && user.level === this.url_level_only) {
                this.user = user;
                this.status_code = 200;
                return;
            }
        }
        this.status_code = 401;
    }

    deep_resolve_method() {
        let path_app = this.url_value.match(/[a-zA-Z0-9-_]+(?=\?|\/)/gi)
        if (path_app && path_app.length) {
            this.method = app[path_app[0]]
            for (let i = 1; i < path_app.length; i++) {
                if (this.method && this.method[path_app[i]]) this.method = this.method[path_app[i]];
                else this.method = null;
            }
        }
        this.send_handler = this._call_app;
    }

    send() {
        this.res.status(this.status_code);
        if (this.target_path) {
            this.res.sendFile(this.target_path);
            return
        }
        if (typeof this.method_result === 'string') {
            this.res.send(this.method_result + '');
            return
        }
        this.res.status(404);
        this.res.send('Not Found ')
    }

    _check_url() {
        if (reEx_is_dir.test(this.req.originalUrl)) {
            this.url_value = this.req.originalUrl.replace(/\/$/, '');
            this.url_value += '/index.html'
        } else {
            this.url_value = this.req.originalUrl;
        }
        return reEx_check_syntax_url.test(this.url_value)// && !reEx_bad.test(this.url_value);
    }
}

module.exports = Client