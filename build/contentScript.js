/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/abortableFetch.js":
/*!*******************************!*\
  !*** ./src/abortableFetch.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "abortableFetch": () => (/* binding */ abortableFetch),
/* harmony export */   "abortableFetchList": () => (/* binding */ abortableFetchList)
/* harmony export */ });

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

const abortableFetch = (url, opt={}) => {
    const con = new AbortController();
    return new AbortableFetchObject(con, fetch(url, {...opt, signal: con.signal}));
};

const abortableFetchList = async (...af) => {
    return await Promise.all(af.map(f => f._request()));
};

/***/ }),

/***/ "./src/parse.js":
/*!**********************!*\
  !*** ./src/parse.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AkizukiPrice": () => (/* binding */ AkizukiPrice),
/* harmony export */   "ParseItem": () => (/* binding */ ParseItem),
/* harmony export */   "ParseItemFromRawRequest": () => (/* binding */ ParseItemFromRawRequest),
/* harmony export */   "checkValidItemId": () => (/* binding */ checkValidItemId)
/* harmony export */ });
/* harmony import */ var _abortableFetch_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abortableFetch.js */ "./src/abortableFetch.js");


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
    '－': '-'
};
const ZenkakuFigReg = new RegExp('(' + Object.keys(ZenkakuFig).join('|') + ')', 'g');

const checkValidItemId = id => id.match(/^[MKPBRSICT]-\d{5}$/);

const AkizukiPrice = class {
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

const ParseItemFromRawRequest = async (id, catalog_arrayBuffer, icon_base64, info_arraybuffer) => {
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

const ParseItem = async id => {
    if(!checkValidItemId(id)) return null;
    const reqs = [
        `https://akizukidenshi.com/catalog/g/g${id}/`,
        `https://akizukidenshi.com/img/goods/S/${id}.jpg`,
        `https://akizukidenshi.com/catalog/goods/warehouseinfo.aspx?goods=${id}`
    ].map(_abortableFetch_js__WEBPACK_IMPORTED_MODULE_0__.abortableFetch);
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

/***/ }),

/***/ "./src/util.js":
/*!*********************!*\
  !*** ./src/util.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "addItem": () => (/* binding */ addItem),
/* harmony export */   "changeItemList": () => (/* binding */ changeItemList),
/* harmony export */   "getItemList": () => (/* binding */ getItemList),
/* harmony export */   "reloadItemList": () => (/* binding */ reloadItemList)
/* harmony export */ });
/* harmony import */ var _parse_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./parse.js */ "./src/parse.js");



const getItemList = () => new Promise(r => {
    chrome.storage.local.get(['__akizuki_my_item_list'], items => r([...(items['__akizuki_my_item_list'] || [])]));
});

const changeItemList = async callback => {
    const list = await getItemList();
    const newlist = await callback(list);
    return await new Promise(r => {
        chrome.storage.local.set({
            '__akizuki_my_item_list': newlist
                .sort((a, b) => Number(a.stock['秋葉原店'].cabinet) - Number(b.stock['秋葉原店'].cabinet))
        }, async () => {
            r(await getItemList());
        });
    });
};

const addItem = async id => {
    const newlist = await changeItemList(async list => {
        const same = list.find(item => item.id == id);
        const newitem = await (0,_parse_js__WEBPACK_IMPORTED_MODULE_0__.ParseItem)(id);
        return same || !newitem
          ? list
          : [...list, newitem];
    });
    return newlist;
};

const reloadItemList = async (progress_callback = n => {}) => changeItemList(async list => {
    let n = 1;
    progress_callback(0);
    const newlist = await Promise.all(list.map(async item => {
        const reloadedItem = await (0,_parse_js__WEBPACK_IMPORTED_MODULE_0__.ParseItem)(item.id);
        progress_callback(n++ / list.length);
        if(!reloadedItem) return null;
        return {...reloadedItem, count: item.count};
    }))
    console.log(newlist)
    return newlist.filter(v => v);
});


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!******************************!*\
  !*** ./src/contentScript.js ***!
  \******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util.js */ "./src/util.js");


const style = document.createElement('style');
style.innerHTML = `
.__akizuki_info_box {
    animation: __akizuki_info_box_close_animation .35s ease-in 1s forwards;
    position: fixed;
    pointer-events: none;
    user-select: none;
    top: 1em;
    left: 0;
    right: 0;
    margin: 0 auto;
    background: #ffcc99;
    border: 1px solid #aaa;
    box-shadow: 0 0 3px #fff, 0 0 6px #fff, 0 0 9px #fff;
    color: #733;
    font-size: 1.5em;
    opacity: 1;
    padding: .5em;
    text-align: center;
    width: 35%;
    max-width: 190px;
}
@keyframes __akizuki_info_box_close_animation {
  0%,30% { opacity: 1; }
  100%   { opacity: 0; }
}
`;
document.head.appendChild(style);

const info = document.createElement('div');
info.classList.add('__akizuki_info_box', '__akizuki_close', '__akizuki_init');

// Listen for message
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if(request.name == 'add_item') {
        const { id } = request.payload;
        await (0,_util_js__WEBPACK_IMPORTED_MODULE_0__.addItem)(id);
        console.log(id);
        info.remove();
        info.innerHTML = `${id}を追加`;
        document.body.appendChild(info);
    }

  // Send an empty response
  // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
  //sendResponse({});
  //return true;
});

})();

/******/ })()
;
//# sourceMappingURL=contentScript.js.map