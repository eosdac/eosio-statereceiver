declare function _exports({ eosApi, types, type, data, options }: {
    eosApi: EosApi;
    types: any;
    type: string;
    data: any;
    options: {
        deserializeTraces: boolean;
        actionSet: Set<string>;
    };
}): Promise<any>;
export = _exports;
export type EosApi = import('eosjs').Api;
//# sourceMappingURL=deserialize-deep.d.ts.map