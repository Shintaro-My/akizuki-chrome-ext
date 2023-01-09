import { abortableFetch, abortableFetchList } from './abortableFetch.js'

const idreg = /\/catalog\/g\/g([MKPBRSICT]-\d{5})/;


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
        const req = chrome.tabs.sendMessage(tab.id,
            {
                name: 'add_item',
                payload: { id },
            }
        );
        req.catch(console.log);
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