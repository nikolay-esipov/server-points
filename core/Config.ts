declare function require(name: string): any;
declare const process: {env: {PORT: string | number}}

import {IUserConfig, IConfig, IConfigUrls} from "../rules/IServerConfig";
// @ts-ignore
import {readdir} from 'fs/promises';
// @ts-ignore
import path from "path";

class Config implements IConfig {
    // @ts-ignore
    urls: { [url: string]: IConfigUrls; } = {}
    port
    // @ts-ignore
    apps: {[app: string]: {}} = {}
    accessAreas
    pathToApps
    maxFileSize
    pathToRootDir
    getLevelAccessByToken
    tokenName

    constructor(config: IUserConfig) {

        this.port = config.port
        this.accessAreas = config.accessAreas
        this.pathToApps = config.pathToApps
        this.maxFileSize = config.maxFileSize
        this.getLevelAccessByToken = config.getLevelAccessByToken
        this.tokenName = config.tokenName
        this.pathToRootDir = config.pathToRootDir
    }

    public static async createConfig(userConfig: IUserConfig): Promise<IConfig> {
        userConfig.port = userConfig.port || +process.env.PORT || 3033;
        const config = new Config(userConfig);
        await config.init();
        return config
    }

    public async init() {
        this.createUrls();
        await this.addAppList()
    }

/*    private addIdentUrls() {
        this.urls = {
            "/ident/register": {
                app: {
                    appName: 'ident',
                    methodName: 'register',
                }
            },
            '/ident/auth': {
                app: {
                    appName: 'ident',
                    methodName: 'auth',
                }
            },
            '/ident/check_auth': {
                app: {
                    appName: 'ident',
                    methodName: 'check_auth',
                }
            },
            '/ident/check_email': {
                app: {
                    appName: 'ident',
                    methodName: 'check_email',
                }
            },
        }
        const config = this
        this.apps.ident = {
            async register(client: IClient) {
                if (client.fields) {
                    const res: IHTTPResponse = await config.identApp.register(client);
                    return client.send(res);
                }
                client.send({
                    statusCode: 400,
                    statusMessage: 'empty_fields'
                })
            },
            async auth(client: IClient) {
                if (client.fields) {
                    const res: IHTTPResponse = await config.identApp.auth(client);
                    return client.send(res);
                }
                client.send({
                    statusCode: 400,
                    statusMessage: 'empty_fields'
                })
            },
            async check_auth(client: IClient) {
                let statusCode= 400,
                    statusMessage= 'empty_fields';
                if (client.fields) {
                    const res = await config.identApp.check_auth(client);
                    if (res) {
                        statusCode = 200;
                        statusMessage = 'ok'
                    } else {
                        statusCode = 401;
                        statusMessage = 'bad_token'
                    }
                }
                return client.send({
                    statusCode,
                    statusMessage
                });
            },
        }
        if (config.identApp.check_email) {
            this.apps.ident.check_email = async function (client: IClient) {
                if (client.fields) {
                    const res: IHTTPResponse = await config.identApp.check_email(client);
                    return client.send(res);
                }
                client.send({
                    statusCode: 400,
                    statusMessage: 'empty_fields'
                })
            }
        }
    }*/
    private createUrls() {
        for (const route of this.accessAreas) {
            route.urls.forEach(url => {
                let accessLevel = 'close';
                // @ts-ignore
                if (typeof route.accessLevel === "number" &&
                    (!isNaN(route.accessLevel)) ||
                    route.accessLevel === 'free'
                ) {
                    // @ts-ignore
                    accessLevel = route.accessLevel
                }
                // @ts-ignore
                let urlValue = url.value || url;
                this.urls[urlValue] = {
                    // @ts-ignore
                    maxFileSize: url.maxFileSize || false,
                    // @ts-ignore
                    accessLevel,
                    accessLevelOnly: route.accessLevelOnly,
                }
                // @ts-ignore
                if (url.app) {
                    // @ts-ignore
                    if (!url.app.appName) {
                        // @ts-ignore
                        url.value = url.value.replace(/^\/(?=\w+)/, '');
                        // @ts-ignore
                        let [appName, methodName] = url.value.split('/');
                        // @ts-ignore
                        this.urls[urlValue].app = {
                            appName,
                            methodName,
                        }
                    } else {
                        // @ts-ignore
                        this.urls[urlValue].app = url.app;
                    }
                }
                // @ts-ignore
                console.log(url.value);
            })
        }
    }

    private async addAppList() {
        const appNames = await readdir(this.pathToApps);
        for (const appName of appNames) {
            const {ext, name} = path.parse(appName);
            if (ext === '.js') {
                this.apps[name] = require(path.join(this.pathToApps, appName));
            }
        }
    }
}

export = Config


