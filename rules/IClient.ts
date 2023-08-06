import {accessValues, IConfigUrls, IUser} from "./IServerConfig";
import IHTTPResponse from "./IHTTPResponse";
import {ServerResponse, IncomingMessage} from "http";

interface IClient {
    req: IncomingMessage;
    res: ServerResponse;
    protocol: string | string[] | undefined;
    fullUrl: string;
    identUrl: IConfigUrls;
    hostName: string | undefined;
    redirect?: string;
    body: string | undefined | {[fieldName: string]: string};
    originalUrl: string | undefined ;
    contentType: string | undefined;
    method: string | undefined;
    ip: string | string[] | undefined;
    params: {};
    cookie: {};
    fields: {
        [fieldName: string]: string
    }[];
    files: {};
    user: IUser | false;
    methodApp?: {
        appName: string,
        methodName: string,
    },

    accessLevel?: accessValues,
    accessLevelOnly?: accessValues,
    sendJson(HTTPResponse: IHTTPResponse): void;
    sendStatus(HTTPResponse: IHTTPResponse): void;
    sendText(HTTPResponse: IHTTPResponse): void;
    sendFile(filePath: string): void;
}

export = IClient;