declare const __dirname: any;
import {IUserConfig} from "./rules/IServerConfig";
// @ts-ignore
import path from "path";

enum accessLevels {
    'superAdmin'= 0,
    'admin'= 1,
    'user'= 2,
    'free'= 'free',
    'close'= 'close',
}


const Config: IUserConfig = {
    pathToApps: path.join(__dirname, './test/apps'),
    pathToRootDir: path.join(__dirname, './test'),
    async getUserByToken(token: string | undefined) {
        if (token && token.length>10) {
            return {
                level: 2,
                id: 17
            };
        }
        return false
    },
    tokenName: 'auth',
    accessAreas: [
        {
            accessLevel: accessLevels.superAdmin,
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
            accessLevel: accessLevels.admin,
            urls: [
                {
                    value: '/mpkeys/set_wb',
                    app: true
                },
            ]
        },
        {
            accessLevelOnly: accessLevels.admin,
            urls: []
        },
        {
            accessLevel: accessLevels.user,
            urls: [
                {
                    value: '/may_api/set_admin',
                    app: true
                },
            ]
        },
        {
            accessLevel: accessLevels.free,
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