
const db = require('./ident_db');
const config = {
    main_dir: '/home/cat_the_code/projects/streamttgames.com/dist',
    path_to_error_agent: '/erro_pages/error_agent.js',
    prefix: 'sub_service',
    client_routes: [
        '/adm',
        '/my_room',
        '/joinUs'
    ],
    urls: [
        {
            value: '/',
        },
        {
            value: '/users/img',
            app: ['tt', 'get_user_content'],
        },
        {
            value: '/assets/MivcOelGs7fChdXG3m4pptL9WTazQu',
            app: ['tt', 'set_header_key_game'],
        },
        {
            value: '/load_avatar',
            app: ['tt', 'load_avatar'],
            access_level: 3
        },
        {
            value: '/games',
            app: ['tt', 'load_game'],
            access_level: 3
        },
        {
            value: '/games/19/appmanifest.json',
        },
        {
            value: '/tt/add_days_sub',
            app: true,
            access_level: 2
        },
        {
            value: '/games/20/appmanifest.json',
        },
        {
            value: '/games/21/appmanifest.json',
        },
        {
            value: '/tt',
            app: true,
            access_level: 3
        },
        {
            value: '/tt/create_user',
            app: true,
        },
        {
            value: '/tt/get_games',
            app: true,
        },
        {
            value: '/tt/load_subscription',
            app: true,
        },
        {
            value: '/tt/load_list_users',
            app: true,
        },
        {
            value: '/tt/get_streamers_top_by_gold',
            app: true,
        },
        {
            value: '/tt/get_last_streamers',
            app: true,
        },
        {
            value: '/tt/del_days_sub',
            app: true,
            access_level: 2
        },
        {
            value: '/tt/load_list_stream_naw',
            app: true,
        },
        {
            value: '/tt/load_users',
            app: true,
        },
        {
            value: '/tt/admin_nick_name',
            app: true,
        },
        {
            value: '/tt/filter_by',
            app: true,
        },
        {
            value: '/tt/admin_change_gold',
            app: true,
            access_level: 2
        },
        {
            value: '/tt/admin_change_money',
            app: true,
            access_level: 2
        },
        {
            value: '/tt/set_password',
            app: true,
            access_level: 2
        },
        {
            value: '/tt/set_account_key',
            app: true,
            access_level: 2
        },
        {
            value: '/tt/connect_tikapi',
            app: true,
            access_level: 3
        },
        {
            value: '/adm',
            access_level: 2
        },
        {
            value: '/tt/get_list_sub',
            app: true,
        },
    ],
    path_to_app_dir: '/home/cat_the_code/projects/streamttgames.com/rest_api',
    db
}

module.exports = config
