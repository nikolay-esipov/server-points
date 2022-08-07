const path = require("path");
const get_config = require('./lib/resolve.config');
const {get_html_container_error_agent, set_path_to_error_agent} = require('./lib/error_req_client');
const {exists_file} = require('./lib/fs_lite');
const formidable = require('formidable');
const {log} = require("sharp/lib/libvips");

function get_form_data(req, maxFileSize = 50 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
        const formData = formidable({
            maxFileSize,
        });
        formData.parse(req, (err, fields, files) => {
            if (err) {
                console.log(err);
                reject(false);
                return;
            }
            resolve({fields, files})
        });

    })
}

function _log(o) {
    console.log('#######################################');
    for (const oKey in o) {
        if (
            oKey !== 'req' &&
            oKey !== 'res' &&
            typeof oKey !== 'function'
        ) {
            console.log(oKey + ' = ' + JSON.stringify(o[oKey]))
        }
    }
    console.log('#######################################');
}

let reEx_check_syntax_url = new RegExp('^(?:\/[а-яА-Яa-zA-Z0-9-_%]+)*(?:\/[а-яА-Яa-zA-Z0-9-#_.%]+)+(?:\\??.*)$');
let reEx_is_dir = new RegExp('(?:\/[_а-яА-Яa-zA-Z0-9-]+\/?$)|(?:^\/$)');
let reEx_bad = new RegExp('\\.{2,}', 'gi');

let main_dir, // config
    urls, // config | db
    app, // config
    prefix, // config
    token_name, // config,
    users, // config
    client_routes

async function method_call(users, app, name_app, name_method) {
    try {
        this.result = await app[name_app][name_method]({
            user: this.user,
            req: this.req,
            res: this.res,
            method_html: this.method_html,
            url_level: this.url_level,
            url_level_only: this.url_level_only,
            url_value: this.url_value,
            cookie: this.cookie,
            query: this.query,
            body: this.body,
            fields: this.fields,
            files: this.files,
            main_dir,
            token_name,
            users,
            apps: app,
            send: function (code, message, data, send_agent) {
                this.status_code = code;
                this.status_message = message;
                this.result = data;
                this.send_agent = send_agent || false;
                this.send()
            }.bind(this),
        });
    } catch (e) {
        console.log(e);
        this._wmc('method error', 404);
    }
}


class Client {
    static async set_config(configuration) {
        let data = await get_config(configuration);
        set_path_to_error_agent(data.path_to_error_agent)
        main_dir = data.main_dir;
        app = data.app;
        urls = data.urls;
        token_name = data.token_name;
        client_routes = data.client_routes;
        users = data.users;
        prefix = data.prefix;
    }

    static get_user_list() {
        return users;
    }

    constructor(request, response) {
        this.req = request
        this.res = response
        this.user = null;
        this.ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
        this.target_path = null;
        this.result = null;
        this.method_app = null;
        this.root_url = null;
        this.url_level = null;
        this.url_level_only = null;
        this.url_value = '';
        this.prefix = null;
        this.status_code = 200;
        this.status_message = 'ok';
        this.method_html = this.req.method;
        this.cookie = request.cookies;
        this.body = request.body;
        this.query = request.query;
        this.send_agent = false;
        this.send_handler = function () {
            if (this.status_code !== 200 && this.send_agent === true) this.result = get_html_container_error_agent.call(this);
            if (typeof this.result !== "string") {
                this.result = JSON.stringify(this.result);
            }
            this.res.send(this.result)
        };
    }

    async init() {
        (
            this._check_url() &&
            this._match_url() &&
            await this.check_form_data() &&
            await this._check_user() &&
            await this._check_method() &&
            await this._check_file_path() &&
            await this._check_clients_rotes()
        )
    }

    async check_form_data() {
        if (
            !this.req.headers["content-type"] ||
            this.req.headers["content-type"].indexOf('multipart/form-data') === -1 ||
            this.method_html.toLowerCase() !== 'post' &&
            this.method_html.toLowerCase() !== 'put'
        ) {
            return true;
        }
        let {maxFileSize} = this.root_url;
        try {
            let form = await get_form_data(this.req, maxFileSize || 50 * 1024 * 1024);
            if (form && (form.fields || form.files)) {
                this.fields = form.fields || null;
                this.files = form.files || null;
                return true
            } else {
                this._wmc('error form data', 400);
                return false
            }
        } catch (e) {
            console.log(e);
            this._wmc('error form data', 400);
            return false
        }
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
        this.url_value = this.url_value.replace(new RegExp(`^\/${prefix}`), '')
        return true;
    }

    _match_url() {
        let curr_url = false
        for (let i = 0; i < urls.length; i++) {
            let url = urls[i];
            let re = new RegExp(`^${url.value}(?:\/|\\?|$).*`, 'i');
            if (re.test(this.url_value) && (curr_url === false || url.value.length > curr_url.length)) {
                this.root_url = url;
                curr_url = url.value;
                this.method_app = url.app;
                this.url_level = url.access_level;
                this.url_level_only = url.access_level_only;
            }
        }
        if (curr_url === false) {
            this._wmc('url not found', 404);
            return false
        }
        return true;
    }

    async _check_user() {
        let user = await app.ident._is_user({
            cookie: this.cookie,
        });
        let {user_id, asses_level} = user || {};
        if (user) {
            this.user = {user_id, asses_level};
        }
        if (typeof this.url_level !== 'number') {
            this.url_level = 'authorization is not required';
            this.user = true;
            return true;
        }
        if (!user) {
            this._wmc('not_authorized', 401);
            return false
        }
        if (!this.url_level_only) this.url_level_only = asses_level;
        if (asses_level <= this.url_level && asses_level === this.url_level_only) {
            return true;
        }
        this._wmc('asses_level_invalid', 401);
        return false
    }

    async _check_method() {
        let name_app,
            name_method;
        if (this.method_app === true) {
            let res = this.url_value.match(/[а-яА-Яa-zA-Z0-9-_%]+(?=\?|\/)/gi);
            if (res &&
                res[0] &&
                res[1] &&
                app[res[0]] &&
                typeof app[res[0]][res[1]] === 'function'
            ) {
                name_app = res[0];
                name_method = res[1];
                await method_call.call(this, users, app, name_app, name_method)
                return false;
            }
            this._wmc(`method not found`, 404);
            return false;
        } else if (
            this.method_app &&
            this.method_app.length
        ) {
            name_app = this.method_app[0];
            name_method = this.method_app[1];
            await method_call.call(this, users, app, name_app, name_method)
            if (this.result && this.result.type === 'url') {
                this.url_value = this.result.url;
                this.result = null;
                return true;
            }
            console.log('[_check_method:245]: method assigned')
            return false
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
            return false;
        }
        return true;
    }

    async _check_clients_rotes() {
        if (client_routes && client_routes.indexOf(this.req.originalUrl) !== -1) {
            this.res.set({
                'X-clients-rotes': this.req.originalUrl,
            });
            this.url_value = '/index.html'
            await this._check_file_path();
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
        this._smc();
        this.send_handler()
    }

    _401() {
        this.res.sendStatus(401);
    }

    _wmc(message, code) { //_write_message_&_code
        this.status_code = code;
        this.status_message = message;
    }

    _smc() { //_set_message_&_code
        this.res.status(this.status_code);
        this.res.statusMessage = this.status_message;
    }

}

module.exports = Client