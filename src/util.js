import { ParseItem } from "./parse.js";


export const getItemList = () => new Promise(r => {
    chrome.storage.local.get(['__akizuki_my_item_list'], items => r([...(items['__akizuki_my_item_list'] || [])]));
});

export const changeItemList = async callback => {
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

export const addItem = async id => {
    const newlist = await changeItemList(async list => {
        const same = list.find(item => item.id == id);
        const newitem = await ParseItem(id);
        return same || !newitem
          ? list
          : [...list, newitem];
    });
    return newlist;
};

export const reloadItemList = async (progress_callback = n => {}) => changeItemList(async list => {
    let n = 1;
    progress_callback(0);
    const newlist = await Promise.all(list.map(async item => {
        const reloadedItem = await ParseItem(item.id);
        progress_callback(n++ / list.length);
        if(!reloadedItem) return null;
        return {...reloadedItem, count: item.count};
    }))
    console.log(newlist)
    return newlist.filter(v => v);
});
