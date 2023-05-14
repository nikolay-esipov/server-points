import IClient from "./IClient";
import {IGetLevelAccessByToken} from "./IIdentApp";

type accessValues = 'free' | 'close' | number;

interface accessLevels {
    [accessName: string]: accessValues
}

interface IAccessAreas {
    urls: ({
        value: string,
        app?: {
            appName: string,
            methodName: string,
        } | boolean,
        maxFileSize?: number,
    } | string) [],
    accessLevel?: accessValues,
    accessLevelOnly?: accessValues,
}

interface IUser {
    token: string,
    userId: number,
}

interface IConfigUrls {
    app?: {
        appName: string,
        methodName: string,
    }
    maxFileSize?: number,
    accessLevelOnly?: accessValues,
    accessLevel?: accessValues
}

interface IUserConfig {
    port?: number,
    pathToRootDir: string,
    accessAreas: IAccessAreas[],
    pathToApps: string,
    maxFileSize?: number,
    getLevelAccessByToken: IGetLevelAccessByToken,
    tokenName: string,
    devRoutersRgExp?: RegExp[]

    beforeIdent?(client: IClient): void[],

    afterIdent?(client: IClient): void[],
}

interface IConfig extends IUserConfig {
    urls: { [url: string]: IConfigUrls },
    apps: {[app: string]: {}},
    init(): void,
}

export {
    IUserConfig,
    IAccessAreas,
    IConfig,
    IUser,
    IConfigUrls,
    accessLevels,
    accessValues
}
