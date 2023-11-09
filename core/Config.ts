import {readdirSync} from "fs";

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
    devRoutersRgExp
    pathToApps
    pathToRootDir
    getUserByToken

    constructor(config: IUserConfig) {

        this.port = config.port
        this.accessAreas = config.accessAreas
        this.pathToApps = config.pathToApps
        this.devRoutersRgExp = config.devRoutersRgExp
        this.getUserByToken = config.getUserByToken
        this.pathToRootDir = config.pathToRootDir
    }

    public static createConfig(userConfig: IUserConfig): IConfig {
        userConfig.port = userConfig.port || +process.env.PORT || 3033;
        const config = new Config(userConfig);
        config.init();
        return config
    }

    public init() {
        this.createUrls();
        this.addAppList()
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
                    if (url.app === true) {
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
    private appIsInclude(appName: string): boolean {
        for (let url in this.urls) {
            let item = this.urls[url];
            if (item.app?.appName === appName) return true
        }
        return false
    }

    private addAppList() {
        const appNames = readdirSync(this.pathToApps);
        for (const appName of appNames) {
            const {ext, name} = path.parse(appName);
            if (ext === '.js' && this.appIsInclude(name)) {
                this.apps[name] = require(path.join(this.pathToApps, appName));
            }
        }
    }
}

export = Config


