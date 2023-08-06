import IClient from "./IClient";
import IGetUserByToken from "./IGetUserByToken";

type accessValues = 'free' | 'close' | number;

interface IAccessLevels {
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
    level: number,
    id: number,
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
    noIndexHtml?: boolean,
    accessAreas: IAccessAreas[],
    pathToApps: string,
    getUserByToken: IGetUserByToken,
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
    IAccessLevels,
    accessValues
}
