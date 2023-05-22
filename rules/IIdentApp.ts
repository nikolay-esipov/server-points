import {IUser} from "./IServerConfig";

interface IGetUserByToken {
    (token: string | undefined): Promise<IUser | false>,
}

export {IGetUserByToken}