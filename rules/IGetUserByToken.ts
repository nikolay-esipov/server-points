import {IUser} from "./IServerConfig";
import {IncomingHttpHeaders} from "http";

export default interface IGetUserByToken {
    (headers: IncomingHttpHeaders): Promise<IUser | false>,
}