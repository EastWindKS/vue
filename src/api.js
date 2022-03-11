const API_KEY = "5581e5622195b446fa57c011b5a6b50aac60bb89f06a336e0eb268e66022a805";
const URL = "https://min-api.cryptocompare.com/data/";
const WS_URL = "wss://streamer.cryptocompare.com/v2";
const tickersHandlers = new Map();
const AGGREGATE_INDEX = "5";

const webSocket = new WebSocket(
    `${WS_URL}?api_key=${API_KEY}`
);

webSocket.addEventListener("message", e => {
    const { TYPE: type, FROMSYMBOL: currency, PRICE: newPrice } = JSON.parse(e.data);

    if (type !== AGGREGATE_INDEX || newPrice === undefined) {
        return;
    }

    const handlers = tickersHandlers.get(currency) ?? [];
    handlers.forEach(fn => fn(newPrice));
});


function sendToWebSocket(message) {
    const stringifyMessage = JSON.stringify(message);

    if (webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(stringifyMessage);
        return;
    }

    webSocket.addEventListener(
        "open",
        () => {
            webSocket.send(stringifyMessage);
        },
        {once: true}
    );
}

function subscribeToTickerOnWs(ticker) {
    sendToWebSocket({
        action: "SubAdd",
        subs: [`5~CCCAGG~${ticker}~USD`]
    });
}

function unsubscribeFromTickerOnWs(ticker) {
    sendToWebSocket({
        action: "SubRemove",
        subs: [`5~CCCAGG~${ticker}~USD`]
    });
}

export const getCoinsList = async () => {
    return (await fetch(URL + "all/coinlist?summary=true")).json();
};

export const subscribeToTicker = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...subscribers, cb]);
    subscribeToTickerOnWs(ticker);
};

export const unsubscribeFromTicker = (ticker) => {
    tickersHandlers.delete(ticker);
    unsubscribeFromTickerOnWs(ticker);
};
