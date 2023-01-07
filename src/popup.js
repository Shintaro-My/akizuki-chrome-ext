import { getItemList, changeItemList, addItem, reloadItemList } from './util.js';
import { AkizukiPrice, checkValidItemId } from './parse.js';

import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/solid';
import '@fortawesome/fontawesome-free/js/regular';

import './popup.css';

let current_id;
const item_id = document.getElementById('item_id');
const add_btn = document.getElementById('add_btn');
const reload_btn = document.getElementById('reload_btn');
const reload_prog = document.getElementById('prog');
const rem_all_btn = document.getElementById('rem_all_btn');
const item_price = document.getElementById('item_price');
const table = document.querySelector('.table');
const tbody = document.getElementById('tbody');
const capture_btn = document.getElementById('capture_btn');
const canvas = document.getElementById('canvas');
const wrapper = document.getElementById('wrapper');
const ctx = canvas.getContext('2d');
const table_canvas = document.createElement('canvas');
const table_ctx = table_canvas.getContext('2d');
const pos = {'01':[0.835,0.573],'02':[0.790,0.573],'03':[0.745,0.573],'04':[0.700,0.573],'05':[0.655,0.573],'06':[0.610,0.573],'07':[0.565,0.573],'08':[0.484,0.575],'09':[0.448,0.575],'10':[0.413,0.575],'11':[0.377,0.575],'12':[0.341,0.575],'13':[0.305,0.575],'14':[0.269,0.575],'15':[0.233,0.575],'16':[0.175,0.620],'17':[0.280,0.770],'18':[0.326,0.770],'19':[0.371,0.770],'20':[0.416,0.770],'21':[0.461,0.770],'22':[0.506,0.770],'23':[0.551,0.770],'24':[0.595,0.770],'25':[0.640,0.770],'26':[0.685,0.770],'27':[0.722,0.770],'28':[0.951,0.811],'29':[0.930,0.562],'30':[0.877,0.752],'31':[0.877,0.819],'32':[0.872,0.609],'33':[0.521,0.612]};
const map = new Image();
map.src = './akiba_floormap.jpeg';

const all_btns = [add_btn, reload_btn, rem_all_btn, capture_btn];

const _disable_btns = bool => {
    for(const btn of all_btns) {
        btn.disabled = bool;
    }
};

const dl = (url, name) => {
    const a = document.createElement('a');
    a.download = name;
    a.href = url;
    a.click();
};
const date_format = new Intl.DateTimeFormat('ja', {
    year: '2-digit', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
});

const mapInitialize = () => {
    canvas.width = wrapper.offsetWidth;
    canvas.height = canvas.width * map.height / map.width;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return ctx.drawImage(map, 0, 0, canvas.width, canvas.height);
};

const circle = (posX, posY) => {
    const X = canvas.width * posX;
    const Y = canvas.height * posY;
    const arc_size = canvas.width / 65;
    ctx.beginPath();
    ctx.arc(X, Y, arc_size, 0, Math.PI * 2, true);
    ctx.strokeStyle = '#b01';
    ctx.lineWidth = 3;
    ctx.stroke();
};

const ItemList2Table = async item => {
    const { cabinet, location, limit } = item.stock['秋葉原店'];
    const tr = document.createElement('tr');
    if(item.id == current_id) {
        tr.classList.add('new');
    }
    const _td = (html) => {
        const _ = document.createElement('td');
        tr.appendChild(_);
        _.innerHTML = html || '';
        return _;
    };

    _td(`<div class="icon" style="background-image: url(${item.icon})"></div>`);
    _td(`<a href="https://akizukidenshi.com/catalog/g/g${item.id}/" target="_blank"><div>${item.id}</div><div>${item.name}</div></a>`);
    _td(item.price.replace(/(\d+)([\s\S]+?￥)([\d,]+)([^\d]+)/g, '<div><b>$1</b>$2<b>$3</b>$4</div>'));
    _td(`<div class="lim${limit == '0' ? ' none' : ''}">${limit}</div>`);
    const cnt_wrap = _td();
    _td(`<div class="${cabinet ? '' : 'non_cabinet'}">${location.replace(/(\s)(\d{2})/, '$1<b>$2</b>')}</div>`);

    const input = document.createElement('input');
    const dummy = document.createElement('div');
    dummy.innerText = item.count;
    dummy.classList.add('dummy');
    cnt_wrap.appendChild(input);
    cnt_wrap.appendChild(dummy);
    input.type = 'number';
    input.value = item.count;
    input.min = "0";
    input.addEventListener('change', async e => {
        if(item.count != e.target.value && !isNaN(e.target.value)) {
            const newlist = await changeItemList(async list => {
                const tgt = list.find(i => i.id == item.id);
                if(e.target.value == 0 || e.target.value == '') {
                    if(confirm(`${item.name}\n[${item.id}]\nをリストから削除しますか？`)) {
                        return list.filter(item => item != tgt);
                    }
                    return list;    
                }
                tgt.count = parseInt(e.target.value);
                return list;
            });
            await ItemUpdate(newlist);
        }
    });
    return { tr, cabinet };
};

const ItemUpdate = async list => {
    tbody.innerHTML = '';
    let cur_cabinet, tr_odd = true, before_tr;
    for(const { tr, cabinet } of await Promise.all(list.map(ItemList2Table))) {
        tr.classList.add('item');
        before_tr || tr.classList.add('sep_after');
        if(cur_cabinet != cabinet) {
            tr_odd = !tr_odd;
            tr.classList.add('sep_after');
            before_tr?.classList.add('sep_before');
        }
        tr.classList.add(tr_odd ? 'odd' : 'even');
        tbody.appendChild(tr);
        cur_cabinet = cabinet;
        before_tr = tr;
    }
    before_tr && before_tr.classList.add('sep_before')
    item_price.innerText = list.reduce((p, item) => {
        const ap = new AkizukiPrice(item.price);
        return p + ap.calc(item.count);
    }, 0);
    mapInitialize();
    const tgt_cabinet = list.map(item => item.stock['秋葉原店'].cabinet).filter((v, i, a) => v && a.indexOf(v) == i);
    for(const n of tgt_cabinet) {
        circle(...pos[n]);
    }
    //const bef_height = canvas.height + 0;
    //const style = await (await fetch('/popup.css')).text();
    // (ctx, dom_str, width, height, x, y)
    //canvas.height = bef_height + table.clientHeight;
    //await Dom2Canvas(ctx, style, table.outerHTML, table.clientWidth, table.clientHeight, 0, bef_height);
};

/*
*/

/* event */

window.addEventListener('load', async() => {
    chrome.storage.local.get(['__akizuki_current_item_id'], items => {
        item_id.value = items['__akizuki_current_item_id'];
        current_id = items['__akizuki_current_item_id'];
    });
    const _map = await new Promise(r => {
        if(map.complete && map.naturalHeight !== 0) {
            return r(mapInitialize());
        }
        map.onload = () => r(mapInitialize());
    });
    const list = await getItemList();
    await ItemUpdate(list);
});

add_btn.addEventListener('click', async e => {
    _disable_btns(true);
    const newlist = await addItem(item_id.value);
    await ItemUpdate(newlist);
    _disable_btns(false);
});

reload_btn.addEventListener('click', async e => {
    _disable_btns(true);
    const reloadedlist = await reloadItemList(n => {
        reload_prog.value = n;
    });
    await ItemUpdate(reloadedlist);
    _disable_btns(false);
});

rem_all_btn.addEventListener('click', async e => {
    if(confirm('リストの中身を全て削除しますか？')) {
        _disable_btns(true);
        const newlist = await changeItemList(async list => []);
        await ItemUpdate(newlist);
        _disable_btns(false);
    }
});

capture_btn.addEventListener('click', async e => {
    _disable_btns(true);
    document.body.classList.remove('active');

    var table_dom = new DOMParser().parseFromString(table.outerHTML, 'text/html');
    for(const i of table_dom.querySelectorAll('input')) i.remove();

    const [w, h] = [table.offsetWidth, table.offsetHeight + 40];
    const style = await fetch('popup.css');
    const dom = `
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
        <foreignObject requiredExtensions="http://www.w3.org/1999/xhtml" width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
                <style type="text/css">
                    ${await style.text()}
                </style>
                ${table_dom.body.innerHTML}
            </div>
        </foreignObject>
    </svg>
    `;


    document.body.appendChild(table_canvas);

    table_canvas.width = w;
    table_canvas.height = h + 20;

    table_ctx.clearRect(0, 0, table_canvas.width, table_canvas.height);
    table_ctx.fillStyle = "#fff";
    table_ctx.fillRect(0, 0, table_canvas.width, table_canvas.height);

    const base64 = `data:image/svg+xml,${encodeURIComponent(dom)}`;
    const img = new Image();
    img.src = base64;
    await new Promise(r => {
        img.addEventListener('load', e => {
            r(table_ctx.drawImage(img, 0, 0, w, w * img.height / img.width));
        });
    });
    
     document.body.appendChild(img);
    
    document.body.classList.add('active');
    table_canvas.remove();

    // dl
    const timestamp = date_format.format(new Date);
    const _map = canvas.toDataURL('image/jpeg');
    const _table = table_canvas.toDataURL('image/jpeg');
    dl(_map, `akizuki_map (${timestamp}).jpg`);
    dl(_table, `akizuki_cart (${timestamp}).jpg`);
    _disable_btns(false);
});

item_id.addEventListener('input', e => {
    const { value } = e.target;
    if(checkValidItemId(value)) {
        current_id = value;
    }
});

chrome.storage.onChanged.addListener(storage => {
    const id = storage['__akizuki_current_item_id'];
    if(id && id.newValue) {
        item_id.value = id.newValue;
        current_id = id.newValue;
    }
});