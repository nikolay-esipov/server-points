const get_token = require("get_token_char");
const crypto = require('crypto');
const store_bot = {}
let users,
    token_name,
    db;


function _get_antibot_task() {
    let answer = get_token(10);
    return {answer, task: answer}
}

function _check_answer_antibot(id_task, answer) {
    return store_bot[id_task] && store_bot[id_task] === answer;
}

//  _resolve_password(password) --> sha256(password + secret_key)
async function _resolve_password(password) {
    let key = 'dLdK8Lf0KOrLKj77jhKKMaqZqAdsWplMghDkmE';
    return crypto
        .createHmac('sha256', key)
        .update(password)
        .digest('hex');
}

async function _check_password(email, password) {
    password = await _resolve_password(password);
    if (email && password) {
        for (let i = 0; i < users.length; i++) {
            let user = users[i];
            if (user.email === email && user.password === password) {
                let new_token = get_token();
                user.token = new_token;
                return {user_id: user.id, new_token}
            }
        }
    }
    return false
}

function _is_email_busy(opts) {
    let {req} = opts;
    return {
        message: users.some(user => user.email === req.body.email),
    }
}

// check_user_token(token) --> {user_id, user_level} | false
async function check_user_token(token) { 
    let res = false;
    users.some(user => {
        if (user.token === token) {
            res = {user_id: user.id, user_level: user.level}
            return true
        }
    });
    return res
}

async function add_user(new_user) {
    let id = await db.register_user(new_user);
    if (id) {
        new_user.id = id;
        users.push(new_user);
        return true
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
            value: '/ident/is_user',
            app: true,
            access_level: 0
        },
    ].concat(config.urls)
}


class Ident {
    constructor(config) {
        users = config.users;
        db = config.db;
        token_name = config.token_name;
        include_url(config);
    }

    async get_antibot_task(opts) {
        let {user, req, res, apps} = opts
        let id = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        let {answer, task} = _get_antibot_task()
        store_bot[id] = answer;
        setTimeout(_ => {
            delete store_bot[id]
        }, 360000)
        return JSON.stringify({id, task})
    }

    async is_user(opts) {
        let {req} = opts;
        return await check_user_token(req.cookie[token_name]); // {user_id, user_level} | false
    }

    async register_user(opts) {
        let {req, res} = opts;
        let {email, password, id_task_antibot, answer_antibot} = req.body;

        if (!_check_answer_antibot(id_task_antibot, answer_antibot)) {
            res.status(401);
            res.statusMessage = 'check_bot_error';
            res.send('check_bot_error');
            return;
        }
        let message = error_valid_register_data(email, password);
        if (message) {
            res.status(401);
            res.statusMessage = message;
            res.send(message);
            return;
        }
        if (_is_email_busy(opts)) {
            res.status(401);
            res.statusMessage = 'email_taken';
            res.send('email_taken');
            return;
        }
        password = await _resolve_password(password);
        let new_user = {
            email,
            password,
            token: get_token(),
            user_level: 3,
        };
        if(await add_user(new_user)) return;
        res.status(401);
        res.statusMessage = 'error_db';
        res.send('error_db');
    }

    async auth_user(opts) {
        let {req, res} = opts;
        let {email, password, id_task_antibot, answer_antibot} = req.body;
        if (!_check_answer_antibot(id_task_antibot, answer_antibot)) {
            res.status(401);
            res.statusMessage = 'check_bot_error';
            res.send('check_bot_error');
            return;
        }
        let {user_id, new_token} = await _check_password(email, password); // {user_id, new_token} | false
        if (user_id) {
            let upd = await db.update_user_field({
                field: 'token',
                value: new_token,
                user_id: user_id
            });
            if (upd) {
                res.cookie([token_name], new_token, {
                    expires: new Date(Date.now() + 2592e+9),
                    httpOnly: true
                });
                return 'logged!';
            }
        }
        res.status(401);
        res.statusMessage = 'auth_error';
        res.send('bad email or password');
    }
}

module.exports = config => {
    return new Ident(config)
}