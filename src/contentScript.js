import { addItem } from './util.js';

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
        await addItem(id);
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
