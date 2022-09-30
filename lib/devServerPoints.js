

module.exports = function (devServer) {
    let {app} = devServer;
    //app.use(formidable());
    app.use(cookieParser());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(async function (request, response, next) {
        let client = new this (request, response);
        await client.init();
        if (client.method_app || /^\/(assets|games|users)\/.*/.test(client.url_value)) {
            client.send();
        }
        else if (client.user) next();
        else client._401();
    });
}