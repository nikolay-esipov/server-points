
const {file_names} = require('./fs_lite');
const path = require("path");
let db


async function plug_app(config) {
    let app_names = await file_names(config.path_to_app_dir),
        app;
    config.app = {};
    if (Array.isArray(app_names)) {
        app_names.forEach(name => {
            app = require(path.join(config.path_to_app_dir, name));
            let _name = path.parse(name)?.name;
            if (app && _name) {
                if (typeof app === 'function') config.app[_name] = app(config);
                else config.app[_name] = app;
            }
        });
    }
    config.app.ident = (require('./identify'))(config);
}

function resolve_urls(urls) {
    urls.forEach(url => {
        url.value = url.value.trim().replace(/\/$/, '');
    })
}

async function get_config_async(config) {
    db = config.db;
    config.users = await db.get_users();
    config.token_name = '_usr_f8';
    await plug_app(config);
    resolve_urls(config.urls);
    return config;
}

module.exports = get_config_async;