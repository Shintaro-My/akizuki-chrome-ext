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
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _abortableFetch_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./abortableFetch.js */ "./src/abortableFetch.js");


const idreg = /\/catalog\/g\/g([MKPBRSICT]-\d{5})\//;


chrome.runtime.onInstalled.addListener(({}) => {
    chrome.storage.local.set({ ['__akizuki_current_item_id']: '' });
    //chrome.storage.local.set({ ['__akizuki_my_item_list']: [] });
});


chrome.contextMenus.create({
    id: '__akizuki_right_click',
    title: 'リンク先を買い物リストに追加する',
    contexts: ['link'],
}, () => chrome.runtime.lastError);
chrome.contextMenus.onClicked.addListener(async item => {
    console.log(item);
    if(item.menuItemId == '__akizuki_right_click') {

        const id = item.linkUrl.match(idreg)?.[1];
        if(!id) return null;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id,
            {
                name: 'add_item',
                payload: { id },
            }
          );
    }
});

const callback = x => {
    chrome.tabs.get(x?.tabId || x, tab => {
        const { url } = tab;
        const _id = url.match(idreg)?.[1];
        chrome.storage.local.set({
            '__akizuki_current_item_id': _id || ''
        });
    })
    /*
    chrome.tabs.query({ active: true, currentWindow: true }, tab => {
        if(!tab.length) return;
    });
    */
};

chrome.tabs.onActivated.addListener(callback);
chrome.tabs.onUpdated.addListener(callback);
//chrome.windows.onFocusChanged.addListener(callback);
})();

/******/ })()
;
//# sourceMappingURL=background.js.map