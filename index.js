const path = require("path");
const {promises: Fs} = require('fs');
const get_token = require('get_token_char');
const get_config = require('./resolve.config');

async function exists(path) {
    try {
        await Fs.access(path)
        return true
    } catch {
        return false
    }
}

let main_dir, // config
    error_pages_dir, // config
    users, //db
    urls, // config | db
    app, // config
    db,  // config
    token_name // config

function check_valid_register_data(user) {
    return (user.login && user.password)
}


function exist_user(user_id, req) {
    return users.some(user => user.login === req.body.login)
}

function add_to_app(app) {

    app.exist_user = exist_user;

    app.register_user = async function (user_id, req) {
        let new_user = req.body;
        if (app.exist_user(user_id, req) || !check_valid_register_data(new_user)) return false;
        let [id, level] = await db.register_user(new_user);
        new_user.user_id = id;
        new_user.user_id = level || 2;
        users.push(new_user);
    }

    app.auth_user = async function (user_id, req) {
        for (let i = 0; i < users.length; i++) {
            let user = users[i];
            if (user.login === req.body.login && user.password === req.body.password) {
                let new_token = get_token();
                user.token = new_token;
                await db.write_token_user(user.user_id, new_token);
                this.set_token();
            }
        }
    }

    urls = [
        {
            value: '/exist_user',
        },
        {
            value: '/register_user',
        },
        {
            value: '/auth_user',
        }].concat(urls)
}

class Client {
    static async set_config(options) {
        let data = await get_config(options);
        main_dir = data.main_dir;
        error_pages_dir = data.error_pages_dir;
        app = data.app;
        db = data.db;
        urls = data.urls;
        users = data.users;
        token_name = data.token_name;
        add_to_app(app);
    }

    constructor(request, response) {
        this.req = request
        this.res = response
        this.user_id = null;
        this.target_path = null;
        this.method = null;
        this.url_level = null;
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
        let curr_url = ''
        for (let i = 0; i < urls.length; i++) {
            let url = urls[i];
            let re = new RegExp(`^${url.value}(?:\/\\w+)*(?:\\?[_a-zA-Z0-9/=&]*|(?:\.js|\.json|\.css|\.html|\.jpg|\.jpeg|\.png|\.webp|\.svg|\.gif))$`); // /? / /local/sf.js

            if (re.test(this.req.originalUrl) && url.value.length > curr_url.length) {
                this.url_value = this.req.originalUrl;
                curr_url = url.value;
                this.url_level = url.access_level || null;
            }
        }
        return curr_url && curr_url.length;
    }

    async resolve_url() {
        if (this._check_url() && this.match_url()) {
            this.method = (this.url_value.match(/\/(\w+)\?/) || [null, null])[1];
            if (typeof this.url_level === 'number') {
                this.status_code = 401;
                await this._check_user()
            } else {
                this.status_code = 200;
            }
            await this.send();
        } else {
            this.status_code = 404;
            await this.send()
        }
    }

    _check_user() {
        let token;
        if (!this.cookie[token_name]) return;
        else token = this.cookie[token_name];
        for (let i = 0; i < users.length; i++) {
            let user = users[i];
            if (user.token === token && user.level <= this.url_level) {
                this.user_id = user.user_id;
                this.status_code = 200;
            }
        }
    }

    _log() {
        console.log(this.status_code + '++++++status_code');
        console.log(this.method + '++++++method');
        console.log(this.url_value + '++++++url_value');
        console.log(this.target_path + '++++++target_path');
        console.log(this.send_handler + '++++++send_handler');
        console.log((this.req.originalUrl + '++++++originalUrl'));
    }

    file_path_resolve() {
        if (this.method && this.status_code === 200) {
            this.send_handler = this._call_app;
        } else this.send_handler = this._send_file;
        this.target_path = {
            200: path.join(main_dir, this.url_value),
            401: path.join(error_pages_dir, '/401.html'), // страница авторизации
            404: path.join(error_pages_dir, '/404.html'),
        };
        this.target_path = this.target_path[this.status_code];
        this._log()
    }

    async _call_app(id_user) {
        let res = await app[this.method](id_user, this.req);
        if (Array.isArray(res)) {
            this._send_file(res);
            return;
        }
        this.res.send(res);
    }

    async _send_file(_path) {
        let lp = _path || this.target_path
        let res = await exists(lp);
        if (res) this.res.sendFile(lp);
        else {
            this.status_code = 404;
            this.file_path_resolve()
        }
    }

    async send() {
        this.file_path_resolve();
        this.res.status(this.status_code);
        await this.send_handler(this.user_id, this.query)
    }

    set_token(token) {
        this.res.cookie(token_name, token, {
            expires: new Date(Date.now() + 26784e+5),
            httpOnly: true
        });
    }

    _check_url() {
        let re_type = new RegExp('\/[_a-zA-Z0-9]+\/?$', 'i');
        if (re_type.test(this.req.originalUrl)) {
            this.req.originalUrl = this.req.originalUrl.replace(/\/$/, '')
            this.req.originalUrl += '/index.html'
        }
        let re = new RegExp('^(?:\/[_a-zA-Z0-9]+)+(?:(?:\\?[_a-zA-Z0-9/=&]*)|(?:.js|.json|.css|.html|.jpg|.jpeg|.png|.webp|.svg|.gif))$', 'i');
        return re.test(this.req.originalUrl);
    }
}

module.exports = Client