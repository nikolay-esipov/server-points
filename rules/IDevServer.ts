// @ts-ignore
import {ServerResponse, IncomingMessage} from "http";

interface IMiddlewaresConfig {
    name: string,
    path?: string,
    middleware(req: IncomingMessage, res: ServerResponse): void
}

interface IApp {
    use(request: (request: any, response: any, next: any) => void): void;
}

interface IWebpackConfig {
    setupMiddlewares?: ((middlewares: IMiddlewares, devServer: IDevServer) => void);
    onBeforeSetupMiddleware?: ((devServer: IDevServer) => void);
    before?: ((app: IApp, server: {}, compiler: {}) => void);
}

interface IMiddlewares {
    push(middlewaresConfig: IMiddlewaresConfig): void,
    unshift(middlewaresConfig: IMiddlewaresConfig): void,
}

interface IDevServer {
    app: IApp,
}

export {IDevServer, IApp, IMiddlewaresConfig, IMiddlewares, IWebpackConfig};