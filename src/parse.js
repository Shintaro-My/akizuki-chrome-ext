import { abortableFetch } from './abortableFetch.js'

const Decode_ShiftJis_Dom = buf => {
    const t = new TextDecoder('shift-jis').decode(buf);
    return (new DOMParser()).parseFromString(t, 'text/html');
};

const Blob2Base64 = blob => new Promise(res => {
    const reader = new FileReader;
    reader.onload = () => res(reader.result);
    reader.readAsDataURL(blob);
});

const ZenkakuFig = {
    '．': '.',
    '～': '~',
    '－': '-',
    '　': ' '
};
const ZenkakuFigReg = new RegExp('(' + Object.keys(ZenkakuFig).join('|') + ')', 'g');

export const checkValidItemId = id => id.match(/^[MKPBRSICT]-\d{5}$/);

export const AkizukiPrice = class {
    constructor(str) {
        this.ary = [...str.matchAll(/(\d+)[\s\S]+?￥([\d,]+)/g)]
            .map(a => a.slice(1)
                .map(n => Number(n.replace(/,/g, ''))))
            .reverse();
    }
    calc(n) {
        for(const x of this.ary) {
            if(x[0] <= n) return n * x[1];
        }
        return 0;
    }
};

export const ParseItemFromRawRequest = async (id, catalog_arrayBuffer, icon_base64, info_arraybuffer) => {
    const result = {};
    const catalog_dom = Decode_ShiftJis_Dom(catalog_arrayBuffer);
    const spec = catalog_dom.querySelector('.goodsspec_');
    const h6 = catalog_dom.querySelector('.cart_table h6');
    if(spec) {
        result.name = spec.querySelector('.name1_').innerText;
        const _cart = spec.querySelector('.cart_');
        const _price = [..._cart.children]
            .filter(e => e.nodeName == 'P')
            .map(e => e.innerText.trim().replace(/\s+/g, ' '))
            .join('\n');
        result.price = _price;
    }
    else if(h6) {
        result.name = h6.innerText;
        result.price = catalog_dom.querySelector('.order_g > table td').innerText
            .replace(/\s+/g, ' ');
    }
    else {
        return null;
    }

    result.name = result.name
        .replace(/\s+/g, ' ')
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))// 全角英数字 -> 半角英数字
        .replace(ZenkakuFigReg, s => ZenkakuFig[s])
    result.price = result.price.replace(/合計[\s\S]+$/, '').trim();

    const info_dom = Decode_ShiftJis_Dom(info_arraybuffer);

    const stock = [...info_dom.querySelectorAll('tr:not([align])')]
        .map(tr => {
            const obj = {};
            const tds = tr.querySelectorAll('td');
            obj.name = tds[0].innerText.trim();
            obj.limit = tds[1].innerText.trim();
            obj.location = tds[2].innerText.trim();
            return obj;
    });
    
    result.id = id;
    result.icon = icon_base64;
    result.count = 1;

    result.stock = stock.reduce((p, v) => {
        if(v.name == '秋葉原店') {
            v.cabinet = v.location.match(/\s(\d{2})/)?.[1] || null;
        }
        p[v.name] = v;
        return p;
    }, {});

    return result;
}

export const ParseItem = async id => {
    if(!checkValidItemId(id)) return null;
    const reqs = [
        `https://akizukidenshi.com/catalog/g/g${id}/`,
        `https://akizukidenshi.com/img/goods/S/${id}.jpg`,
        `https://akizukidenshi.com/catalog/goods/warehouseinfo.aspx?goods=${id}`
    ].map(abortableFetch);
    if(await reqs[0].valid() && reqs[0].status != 404) {
        return await ParseItemFromRawRequest(
            id,
            await reqs[0].arrayBuffer(),
            await Blob2Base64(await reqs[1].blob()),
            await reqs[2].arrayBuffer()
        );
    } else {
        for(const req of reqs) {
            try {
                req.abort();
            }catch(e){}
        }
    }
    return null;
};

/*
export const ParseItem = async id => {
    if(!checkValidItemId(id)) return null;
    const catalog = await fetch(`https://akizukidenshi.com/catalog/g/g${id}/`);
    if(catalog.status == 404) return null;

    const result = {};
    const catalog_dom = Decode_ShiftJis_Dom(await catalog.arrayBuffer());
    const spec = catalog_dom.querySelector('.goodsspec_');
    const h6 = catalog_dom.querySelector('.cart_table h6');
    if(spec) {
        result.name = spec.querySelector('.name1_').innerText;
        const _cart = spec.querySelector('.cart_');
        const _price = [..._cart.children]
            .filter(e => e.nodeName == 'P')
            .map(e => e.innerText.trim().replace(/\s+/g, ' '))
            .join('\n');
        result.price = _price;
    }
    else if(h6) {
        result.name = h6.innerText;
        result.price = catalog_dom.querySelector('.order_g > table td').innerText
            .replace(/\s+/g, ' ');
    }
    else {
        return null;
    }

    result.name = result.name
        .replace(/\s+/g, ' ')
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))// 全角英数字 -> 半角英数字
        .replace(ZenkakuFigReg, s => ZenkakuFig[s])
    result.price = result.price.replace(/合計[\s\S]+$/, '').trim();

    const icon = await fetch(`https://akizukidenshi.com/img/goods/S/${id}.jpg`);
    const icon_base64 = await Blob2Base64(await icon.blob());
    
    const info = await fetch(`https://akizukidenshi.com/catalog/goods/warehouseinfo.aspx?goods=${id}`);
    const info_dom = Decode_ShiftJis_Dom(await info.arrayBuffer());

    const stock = [...info_dom.querySelectorAll('tr:not([align])')]
        .map(tr => {
            const obj = {};
            const tds = tr.querySelectorAll('td');
            obj.name = tds[0].innerText.trim();
            obj.limit = tds[1].innerText.trim();
            obj.location = tds[2].innerText.trim();
            return obj;
    });
    
    result.id = id;
    result.icon = icon_base64;
    result.count = 1;

    result.stock = stock.reduce((p, v) => {
        if(v.name == '秋葉原店') {
            v.cabinet = v.location.match(/\s(\d{2})/)?.[1] || null;
        }
        p[v.name] = v;
        return p;
    }, {});

    return result;
};*/