// @ts-ignore
import {startServer} from '../index';
import testConfig from '../server.config';

(async _=>{
    await startServer(testConfig);
})()

