
const AbortableFetchObject = class {
    constructor(_con, _fetch) {
        this._con = _con;
        this._fetch = _fetch;
        this._status = null;
        _fetch.then(r => {
            this._status = r.status
        })
    }
    abort() {
        this._con.abort();
    }
    get status() {
        return this._status;
    }
    async _request() {
        return (await this._fetch).clone();
    }
    async valid() {
        await this._fetch;
        return this;
    }
}
for(const m of ['text', 'json', 'blob', 'arrayBuffer', 'formData']) {
    AbortableFetchObject.prototype[m] = async function() {
        return await (await this._request())[m]();
    };
};

export const abortableFetch = (url, opt={}) => {
    const con = new AbortController();
    return new AbortableFetchObject(con, fetch(url, {...opt, signal: con.signal}));
};

export const abortableFetchList = async (...af) => {
    return await Promise.all(af.map(f => f._request()));
};