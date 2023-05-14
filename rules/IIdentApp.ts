
interface IGetLevelAccessByToken {
    (token: string | undefined): Promise<number | false>,
}

export {IGetLevelAccessByToken}