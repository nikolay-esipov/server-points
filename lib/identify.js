const get_token = require("get_token_char");

const store_bot = {}

function get_task() {
    let answer = get_token(10);
    return {answer, task: answer}
}

//function get_orig_id() {
//    let date  = new Date(Date.now());
//    return date.getMinutes() + '' + date.getSeconds()+ date.getMilliseconds()
//}

let users_list,
    token_name,
    db;

function include_url(config) {
    config.urls = [
        {
            value: '/exist_user',
            app: true
        },
        {
            value: '/register_user',
            app: true
        },
        {
            value: '/is_auth',
            app: true
        },
        {
            value: '/ident',
            app: true
        }].concat(config.urls)
}

function check_valid_register_data(user) {
    return (user.email && user.password)
}

module.exports = class {
    constructor(config) {
        users_list = config.users;
        db = config.db;
        token_name = config.token_name;
        include_url(config);
    }

    check_answer_antibot(id_task, answer) {
        return store_bot[id_task] && store_bot[id_task] === answer;
    }

    get_antibot_task(user_id, req, res, apps) {
        let id = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        let {answer, task} = get_task()
        store_bot[id] = answer;
        setTimeout(_ => {
            delete store_bot[id]
        }, 360000)
        return JSON.stringify({id, task})
    }


    is_taken_email(user_id, req, res, apps) {
        return {
            message: users_list.some(user => user.email === req.body.email),
        }
    }

    async register_user(user_id, req, res, apps) {
        let new_user = req.body;
        let {email, password, anti_bot_phrase, id_task} = new_user;
        if (this.is_taken_email(user_id, req, res, apps) || !check_valid_register_data(new_user)) return false;
        new_user.token = get_token();
        new_user.user_level = 3;
        let id = await db.register_user(new_user);
        if (id) {
            new_user.id = id;
            users_list.push(new_user);
            return true
        }
        return false
    }


    async auth_user(user_id, req, res, apps) {
        for (let i = 0; i < users_list.length; i++) {
            let user = users_list[i];
            if (user.email === req.body.email && user.password === req.body.password) {
                let new_token = get_token();
                let result = await db.update_user_field({
                    field: 'token',
                    value: new_token,
                    user_id: user.id
                });
                if (result) {
                    user.token = new_token;
                    res.cookie([token_name], new_token, {
                        expires: new Date(Date.now() + 26784e+5),
                        httpOnly: true
                    });
                    return true;
                }
            }
        }
        return false;
    }

    async is_auth(user, req, res) {
        return !!(user && user.id);
    }
}