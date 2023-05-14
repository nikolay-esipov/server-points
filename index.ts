// @ts-ignore
import {ClientRequest, createServer, IncomingMessage} from "http";
import {IConfig, IUserConfig} from "./rules/IServerConfig";
import {IDevServer, IApp, IMiddlewares, IWebpackConfig} from "./rules/IDevServer";
// @ts-ignore
import {createConfig} from "./core/Config";
import Client = require("./core/Client");

const {setConfig} = Client
// @ts-ignore
import {IGetLevelAccessByToken} from "./rules/IIdentApp";

async function startServer(userConfig: IUserConfig): Promise<void> {
    const config = await createConfig(userConfig);
    setConfig(config);
    const server = createServer((request: ClientRequest, response: IncomingMessage) => {
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
        if (devRoutersRgExp && devRoutersRgExp.some(route => route.test(client.originalUrl))) {
            await client.init();
        } else next();
    })
}

function addClientToDevServer(webpackConfig: IWebpackConfig, config: IConfig) {
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
    } else return
}


export = {
    addClientToDevServer,
    startServer,
}