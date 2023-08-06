declare function require(name: string): any;
declare const process: {env: {PORT: string | number}}

import {IUserConfig, IConfig, IConfigUrls} from "../rules/IServerConfig";
import {readdir} from 'fs/promises';
import path from "path";

class Config implements IConfig {
    urls: { [url: string]: IConfigUrls; } = {}
    port
    apps: {[app: string]: {}} = {}
    accessAreas
    pathToApps
    pathToRootDir
    getUserByToken
    tokenName

    constructor(config: IUserConfig) {

        this.port = config.port
        this.accessAreas = config.accessAreas
        this.pathToApps = config.pathToApps
        this.getUserByToken = config.getUserByToken
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

    private createUrls() {
        for (const area of this.accessAreas) {
            area.urls.forEach(url => {
                let accessLevel: number | "free" | 'close' = 'close';
                if (typeof area.accessLevel === "number" &&
                    (!isNaN(area.accessLevel)) ||
                    area.accessLevel === 'free'
                ) {
                    accessLevel = area.accessLevel
                }
                // @ts-ignore
                let urlValue = url.value || url;
                this.urls[urlValue] = {
                    // @ts-ignore
                    maxFileSize: url.maxFileSize || false,
                    accessLevel,
                    accessLevelOnly: area.accessLevelOnly,
                }
                // @ts-ignore
                if (url.app) {
                    // @ts-ignore
                    if (!url.app.appName) {
                        // @ts-ignore
                        url.value = url.value.replace(/^\/(?=\w+)/, '');
                        // @ts-ignore
                        let [appName, methodName] = url.value.split('/');
                        this.urls[urlValue].app = {
                            appName,
                            methodName,
                        }
                    } else {
                        // @ts-ignore
                        this.urls[urlValue].app = url.app;
                    }
                }
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


