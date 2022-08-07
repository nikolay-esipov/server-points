const get_token = require("get_token_char");
const crypto = require('crypto');
const {raw} = require("express");
const RotaryCaptcha = require('../../rotary_captcha');
const captcha = new RotaryCaptcha();

const store_bot = {}

let users,
    token_name,
    db;


function _check_answer_antibot(id_task, answer) {
    console.log(id_task, answer);
    return captcha.check_task(id_task, answer);
}

//  hash_password(password) --> sha256(password + secret_key)
async function hash_password(password) {
    if (typeof password !== 'string' || !password.length) {
        console.warn(`hash_password(): bad arg password = ${password}`);
        return;
    }
    let key = 'dLdK8Lf0KOrLKj77jhKKMaqZqAdsWplMghDkmE';
    return crypto
        .createHmac('sha256', key)
        .update(password)
        .digest('hex');
}

async function _check_password(email, password) {
    password = await hash_password(password);
    let user_id = await db.check_email_password(email, password);
    console.log(user_id, 37);
    if (user_id) {
        let new_token = get_token();
        for (let i = 0; i < users.length; i++) {
            let user = users[i];
            if (user_id === user.id) {
                user.token = new_token;
                return {user_id, new_token}
            }
        }
    }
    return false
}

function _is_email_busy(email) {
    if (typeof email !== "string") return false;
    //return await db.is_email_busy();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
}

function _check_format_email(email) {
    if (typeof email === "string") {
        return email.toLowerCase();
    }
    return false;
}

// check_user_token(token) --> {user_id, asses_level} | false
async function check_user_token(token) {
    if (!Array.from(users)) return;
    let res = false;
    users.some(user => {
        if (user.token === token) {
            res = {user_id: user.id, asses_level: user.asses_level}
            return true
        }
    });
    return res
}

async function add_user(new_user) {
    let {id} = await db.register_user(new_user);
    if (id) {
        new_user.id = id;
        users.push(new_user);
        return id
    }
    return false
}

function error_valid_register_data(email, password) {
    return false
}

function include_url(config) {
    config.urls = [
        {
            value: '/ident',
            app: true
        },
        {
            value: '/get_captcha',
            app: true
        },
        {
            value: '/ident/_is_user',
            app: true,
            access_level: 0
        },
        {
            value: '/ident/_hash_password',
            app: true,
            access_level: 0
        },
        {
            value: '/ident/_get_token',
            app: true,
            access_level: 0
        },
        {
            value: '/ident/_local_register_user',
            app: true,
            access_level: 0
        },
    ].concat(config.urls)
}

function get_incomming_data(client) {
    let data = false;
    let {body, query, fields, method_html} = client;

    if (method_html.toLowerCase() === 'get') data = query;
    else if (method_html.toLowerCase() === 'post') {
        if (Object.values(body).length) data = body;
        data = fields
    }
    return data;
}

class Ident {
    constructor(config) {
        users = config.users;
        db = config.db;
        token_name = config.token_name;
        include_url(config);
    }

    async get_captcha() {
        let task = await captcha.create_task()
        return JSON.stringify(task);
    }

    _hash_password = hash_password;

    async _is_user(client) {
        let {cookie, send} = client;
        if (cookie && cookie[token_name]) {  // return {user_id, asses_level} | false
            return await check_user_token(cookie[token_name]);
        }
        return false;
    }

    async is_user(client) {
        let {send} = client;
        let res = await this._is_user(client);
        if (res) {
            send(200, 'auth', 'auth', false);
            return;
        }
        send(401, 'not_auth', 'not_auth', false);
    }

    async _get_token(user_id) {
        for (let i = 0; i < users.length; i++) {
            let user = users[i];
            if (user_id === user.id) {
                return user.token;
            }
        }
        return  false
    }

    async _local_register_user(client) {
        let {send, method_html} = client;
        let data = get_incomming_data(client);
        if (!data) {
            console.warn(`html method incorrect ${method_html}`);
            send(401, 'not_date_for_register', 'not_date_for_register', false);
            return false;
        }
        if (!data.password || !data.email) {
            console.warn('email && password undefined');
            send(401, 'not_all_filled', 'not_all_filled', false);
            return false;
        }
        let {email, password, id_task_antibot, answer_antibot, nickname} = data;

        if (!_check_answer_antibot(id_task_antibot, answer_antibot)) {
            send(401, 'check_bot_error', 'check_bot_error', false);
            return false;
        }

        if (_is_email_busy(email)) {
            send(401, 'email_taken', 'email_taken', false)
            return false;
        }

        email = _check_format_email(email)
        if (!email) {
            send(401, 'bad_email_format', 'bad_email_format', false)
            return false;
        }
        password = await hash_password(password);
        if (!password) {
            send(401, 'data_incorrect', 'data_incorrect', false); //send(401, 'bad_password_for_register', 'bad_password_for_register', false)
            return false;
        }
        let new_user = {
            email,
            password,
            token: get_token(),
            asses_level: 3,
            nickname
        };
        if (
            !new_user ||
            !new_user.email ||
            !new_user.password ||
            !new_user.token ||
            !new_user.nickname ||
            !new_user.asses_level
        ) {
            send(401, 'data_incorrect', 'data_incorrect', false);
        }
        let id = await add_user(new_user);
        if (id) return id;
        send(500, 'no_solution_found_during_registration', 'no_solution_found_during_registration', false);
        return false;
    }

    async register_user(client) {
        let {send} = client;
        let id = await this._local_register_user(client);
        if (id) send(200, 'successful_registration', 'successful_registration', false);
    }

    async log_out(client) {
        let {send, res} = client;
        res.cookie([token_name], 'none', {
            expires: new Date(Date.now() - 1000),
            httpOnly: true
        });
        send(200, 'log_out', 'log_out', false); //(code, message, data, send_agent)
    }

    async auth_user(client) {
        let {send, res, method_html} = client;
        let data = get_incomming_data(client);
        if (!data) {
            console.warn(`html method incorrect ${method_html}`);
            return send(401, 'not_date_for_register', 'not_date_for_register', false);
        }
        let {email, password, id_task_antibot, answer_antibot} = data;
        if (!_check_answer_antibot(id_task_antibot, answer_antibot)) {
            send(401, 'check_bot_error', 'check_bot_error', false);
            return;
        }
        email = _check_format_email(email)
        if (!email) {
            send(401, 'bad_email_format', 'bad_email_format', false)
            return false;
        }
        let {user_id, new_token} = await _check_password(email, password); // {user_id, new_token} | false
        if (user_id) {
            let upd = await db.update_user_field('token', new_token, user_id);
            if (upd) {
                res.cookie([token_name], new_token, {
                    expires: new Date(Date.now() + 2592e+9),
                    httpOnly: true
                });
                client.send(200, 'successful_registration', 'successful_registration', false); //(code, message, data, send_agent)
            }
        }
        send(401, 'data_incorrect', 'data_incorrect', false);
    }

    async is_email_busy(client) {
        let data = get_incomming_data(client);
        let {send} = client;
        if (!data) {
            console.warn(`html method incorrect ${method_html}`);
            return send(401, 'not_date_for_register');
        }
        let {email} = data;

        if (_is_email_busy(email)) {
            send(401, 'email_taken')
            return;
        }
        return 'ok'
    }
}

module.exports = function (config) {
    return new Ident(config)
}

