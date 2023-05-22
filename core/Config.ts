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
    pathToRootDir
    redirects?: [
        {
            origin: string | string[]
            target: string
        }
    ]
    getUserByToken
    tokenName

    constructor(config: IUserConfig) {

        this.port = config.port
        this.accessAreas = config.accessAreas
        this.pathToApps = config.pathToApps
        this.getUserByToken = config.getUserByToken
        this.tokenName = config.tokenName
        this.pathToRootDir = config.pathToRootDir
        this.redirects = config.redirects
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

/*    private getRedirectsPath(configUrl: string): string[] | '' {
        let currUrl: string | boolean = false;
        let regUrl = new RegExp(`^${configUrl}.*`, 'i');
        if (this.redirects && this.redirects.length) {
            for (const redirect of this.redirects) {
                if(regUrl.test(redirect.origin) && (!currUrl || redirect.origin.length > currUrl.length)) {
                    currUrl = configUrl;
                }
            }
        }
        return ''
    }*/

    private createUrls() {
        for (const area of this.accessAreas) {
            area.urls.forEach(url => {
                let accessLevel = 'close';
                // @ts-ignore
                if (typeof area.accessLevel === "number" &&
                    (!isNaN(area.accessLevel)) ||
                    area.accessLevel === 'free'
                ) {
                    // @ts-ignore
                    accessLevel = area.accessLevel
                }
                // @ts-ignore
                let urlValue = url.value || url;
                this.urls[urlValue] = {
                    // @ts-ignore
                    maxFileSize: url.maxFileSize || false,
                    // @ts-ignore
                    accessLevel,
                    accessLevelOnly: area.accessLevelOnly,
                    // @ts-ignore
                    redirect: url.redirect,
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


