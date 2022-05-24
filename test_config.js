const path = require("path");
const {db} = require('./app_run'); //db: type instance - levers-db --> $ npm install levers-db;
                                   // Экземпляр квери билдера levers-db.
const options = {
    main_dir: path.join(__dirname, './dist'), // main project directory. Use full path - __dirname, 'current_dir'
    path_to_error_agent: path.join(__dirname, '/src/assets/pages_errors'), // directory with error pages: 404.html, 401.html, ..., .
    urls: [
        {
            value: '/',
        },
        {
            value: '/public',
        },
        {
            value: '/get_test_info_all',
        },
        {
            value: '/get_test_info_user',
            access_level: 2
        },
        {
            value: '/get_test_info_admin',
            access_level: 1
        },
    ],
    path_to_app_dir: path.join(__dirname, './apps'),
    db
}


module.exports = options