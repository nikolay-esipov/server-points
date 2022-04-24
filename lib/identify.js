const get_token = require("get_token_char");

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
    
    is_taken_email(user_id, req, res) {
        return users_list.some(user => user.email === req.body.email)
    }

    async register_user(user_id, req, res) {
        let new_user = req.body;
        if (this.is_taken_email(user_id, req, res) || !check_valid_register_data(new_user)) return false;
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


    async auth_user(user_id, req, res) {
        for (let i = 0; i < users_list.length; i++) {
            let user = users_list[i];
            if (user.email === req.body.email && user.password === req.body.password) {
                let new_token = get_token();
                user.token = new_token;
                await db.update_user_field([token_name], new_token, user.id);
                res.cookie([token_name], new_token, {
                    expires: new Date(Date.now() + 26784e+5),
                    httpOnly: true
                });
            }
        }
    }

    async is_auth (user, req, res) {
        return !!(user && user.id);
    }
}