const path = require("path");
const get_config = require('./lib/resolve.config');
const {get_html_container_error_agent, set_path_to_error_agent} = require('./lib/error_req_client');
const {exists_file} = require('./lib/fs_lite');

function _log() {
    console.log('\n');
    console.log(this.req.originalUrl + '++++++originalUrl');
    console.log(this.status_code + '++++++status_code');
    console.log(this.method_app + '++++++method');
    console.log(this.url_value + '++++++url_value');
    console.log(this.target_path + '++++++target_path');
    console.log(JSON.stringify(urls) + '++++++urls');
    console.log(JSON.stringify(users) + '++++++users');
    console.log('\n');
}

let reEx_check_syntax_url = new RegExp('^(?:\/[а-яА-Яa-zA-Z0-9-_%]+)*(?:\/[а-яА-Яa-zA-Z0-9-#_.%]+)+(?:\\?[_а-яА-Яa-zA-Z0-9=&%]*|$)$');
let reEx_is_dir = new RegExp('(?:\/[_а-яА-Яa-zA-Z0-9-]+\/?$)|(?:^\/$)');
let reEx_bad = new RegExp('\\.{2,}', 'gi');


let main_dir, // config
    users, //db
    urls, // config | db
    app, // config
    token_name // config,

class Client {
    static async set_config(configuration) {
        let data = await get_config(configuration);
        set_path_to_error_agent(data.path_to_error_agent)
        main_dir = data.main_dir;
        app = data.app;
        urls = data.urls;
        users = data.users;
        token_name = data.token_name;
    }

    constructor(request, response) {
        this.req = request
        this.res = response
        this.user = null;
        this.ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
        this.target_path = null;
        this.result = null;
        this.method_app = null;
        this.url_level = null;
        this.url_level_only = null;
        this.url_value = '';
        this.status_code = 200;
        this.status_message = 'ok';
        this.cookie = request.cookies;
        this.body = request.body;
        this.query = request.query;
        this.send_handler = function () {
            if (this.status_code !== 200) this.result = get_html_container_error_agent.call(this);
            this.res.send(this.result)
        };
    }

    async init() {
        (
            this._check_url() &&
            this._match_url() &&
            await this._check_user() &&
            await this._check_method() &&
            await this._check_file_path()
        )
    }

    _check_url() {
        if (reEx_is_dir.test(this.req.originalUrl)) {
            this.url_value = this.req.originalUrl.replace(/\/$/, '');
            this.url_value += '/index.html'
        } else {
            this.url_value = this.req.originalUrl;
        }
        if (!reEx_check_syntax_url.test(this.url_value) || reEx_bad.test(this.url_value)) {
            this._wmc('syntax error', 400);
            return false
        }
        return true;
    }

    _match_url() {
        let curr_url = false
        for (let i = 0; i < urls.length; i++) {
            let url = urls[i];
            let re = new RegExp(`^${url.value}(?:\/|\\?|$).*`, 'i');
            if (re.test(this.url_value) && (curr_url === false || url.value.length > curr_url.length)) {
                curr_url = url.value;
                this.method_app = url.app;
                this.url_level = url.access_level;
                this.url_level_only = url.access_level_only || null;
                console.log(curr_url + '=============')
            }
        }

        if (curr_url === false) {
            this._wmc('url not found', 404);
            return false
        }
        return true;
    }

    async _check_user() {
        if (typeof this.url_level !== 'number') return true;
        let user = await app.ident.is_user({
            cookie: this.cookie,
        });
        if (!user) {
            this._wmc('Not authorized', 401);
            return false
        }
        let {user_id, user_level} = user;
        if (!this.url_level_only) this.url_level_only = user.level;
        if (user_level <= this.url_level && user_level === this.url_level_only) {
            this.user = {user_id, user_level};
            return true;
        }
        this._wmc('user level invalid', 401);
        return false
    }

    async _check_method() {
        if (this.method_app) {
            let [app_name, method_name] = this.url_value.match(/[а-яА-Яa-zA-Z0-9-_%]+(?=\?|\/)/gi);
            if (app[app_name] && typeof app[app_name][method_name] === 'function') {
                try {
                    this.result = await app[app_name][method_name]({
                        user: this.user,
                        req: this.req,
                        res: this.res,
                        body: this.body,
                        query: this.query,
                        url_level: this.url_level,
                        url_level_only: this.url_level_only,
                        url_value: this.url_value,
                        send: function (code, message, data) {
                            this.status_code = code;
                            this.status_message = message
                            this.result = data
                            this.send()
                        }.bind(this),
                        apps: app
                    }) + '';
                } catch (e) {
                    console.log(e);
                    this._wmc('method error', 404);
                }
            } else {
                this._wmc(`method not found`, 404);
            }
            return false;
        }
        return true
    }

    async _check_file_path() {
        let res = await exists_file(path.join(main_dir, this.url_value));
        if (res) {
            this.target_path = path.join(main_dir, this.url_value);
            this.send_handler = function () {
                this.res.sendFile(this.target_path);
            }
            return;
        }
        this._wmc('file not found', 404);
    }

    deep_resolve_method() {
        let path_app = this.url_value.match(/[a-zA-Z0-9-_]+(?=\?|\/)/gi)
        if (path_app && path_app.length) {
            this.method_app = app[path_app[0]]
            for (let i = 1; i < path_app.length; i++) {
                if (this.method_app && this.method_app[path_app[i]]) this.method_app = this.method_app[path_app[i]];
                else this.method_app = null;
            }
        }
        this.send_handler = this._call_app;
    }

    send() {
        if (this.res.writableEnded) return;
        this._smc(this.status_code, this.status_message);
        this.send_handler()
    }

    _wmc(message, code) {
        this.status_code = code;
        this.status_message = message;
    }

    _smc(code, message) {
        this.res.status(this.status_code);
        this.res.statusMessage = this.status_message;
    }

}

module.exports = Client