import {IGetLevelAccessByToken} from "./rules/IIdentApp";

declare const __dirname: any;
import {accessLevels, IUserConfig} from "./rules/IServerConfig";
// @ts-ignore
import path from "path";

const areas: accessLevels =  {
    'superAdmin': 0,
    'admin': 1,
    'user': 2,
    'free': 'free',
    'close': 'close',
}


const Config: IUserConfig = {
    pathToApps: path.join(__dirname, './test/apps'),
    pathToRootDir: path.join(__dirname, './test'),
    async getLevelAccessByToken(token: string | undefined) {
        if (token && token.length>10) return 2;
        return false;
    },
    tokenName: 'auth',
    accessAreas: [
        {
            accessLevel: areas.superAdmin,
            urls: [
                {
                    value: '/anypath/anysubpath',
                    app: {
                        appName: 'app4',
                        methodName: 'method2'
                    }
                },
            ]
        },
        {
            accessLevel: areas.admin,
            urls: [
                {
                    value: '/mpkeys/set_wb',
                    app: true
                },
            ]
        },
        {
            accessLevelOnly: areas.admin,
            urls: []
        },
        {
            accessLevel: areas.user,
            urls: [
                {
                    value: '/may_api/set_admin',
                    app: true
                },
            ]
        },
        {
            accessLevel: areas.free,
            urls: [
                {
                    value: '/may_api',
                    app: true
                },
                {
                    value: '/assets',
                },
            ]
        },
    ],
    port: 3000,
}

export = Config