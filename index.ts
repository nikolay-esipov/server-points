import {createServer, IncomingMessage, ServerResponse} from "http";
import {IConfig, IUserConfig} from "./rules/IServerConfig";
import {IDevServer, IApp, IMiddlewares, IWebpackConfig} from "./rules/IDevServer";

declare function require(name: string): any;

const {createConfig} = require("./core/Config");
import Client = require("./core/Client");

const {setConfig} = Client

async function startServer(userConfig: IUserConfig): Promise<void> {
    const config = await createConfig(userConfig);
    setConfig(config);
    const server = createServer((request: IncomingMessage, response:  ServerResponse) => {
        const client = new Client(request, response);
        client.init()
    });
    server.listen(config.port);
}

function addUseClientDev(app: IApp, config: IConfig) {
    const {devRoutersRgExp} = config;
    app.use(async function (request, response, next) {
        let client = new Client(request, response);
        await client.checkUrl();
        await client.matchUrl();
        if (devRoutersRgExp && devRoutersRgExp.some(route => route.test(<string>client.originalUrl))) {
            await client.init();
        } else next();
    })
}

async function addClientToDevServer(webpackConfig: IWebpackConfig, config: IConfig): Promise<IWebpackConfig>{
    config = await createConfig(config);
    let app;
    if (webpackConfig.onBeforeSetupMiddleware) {
        webpackConfig.onBeforeSetupMiddleware = function (devServer: IDevServer) {
            app = devServer.app;
            addUseClientDev(app, config);
        }
    }
    else if (webpackConfig.setupMiddlewares) {
        webpackConfig.setupMiddlewares = function (middlewares: IMiddlewares, devServer: IDevServer) {
            app = devServer.app;
            addUseClientDev(app, config);
        };
    }
    else if (webpackConfig.before) {
        webpackConfig.before = function (app: IApp, server: {}, compiler: {}) {
            addUseClientDev(app, config);
        }
    }
    return webpackConfig
}

export = {
    addClientToDevServer,
    startServer,
}

