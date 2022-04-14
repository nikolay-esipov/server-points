let db,
    users;

const db_controller = {
    async write_token_user(user_id, new_token) {
        return await db.update_cell('users', 'token', new_token, 'id', user_id);
    },

    async register_user(new_user) {
        return await db.add_row('users', [new_user.email, new_user.password, null, 2]);
    },
}

async function get_users() {
    users = await db.get_table('users');
    users = users.rows;
}

async function get_config_async(options) {
    db = options.db
    await get_users();
    options.users = users;
    options.db = db_controller;
    options.token_name = '_usr_f8';

    return options;
}

module.exports = get_config_async;