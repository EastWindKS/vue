const API_KEY = "5581e5622195b446fa57c011b5a6b50aac60bb89f06a336e0eb268e66022a805";
const URL = "https://min-api.cryptocompare.com/data/";
const WS_URL = "wss://streamer.cryptocompare.com/v2";
const tickersHandlers = new Map();
const tickersErrorsHandlers = new Map();
const AGGREGATE_INDEX = "5";
const ERROR_INDEX = "500";

const webSocket = new WebSocket(
    `${WS_URL}?api_key=${API_KEY}`
);

webSocket.addEventListener("message", e => {
    const {TYPE: type, FROMSYMBOL: currency, PRICE: newPrice, TOSYMBOL: crossCurrency, PARAMETER: param} = JSON.parse(e.data);

    if (type === ERROR_INDEX && param !== undefined) {
        const {ticker, currency} = splitErrorResponse(param);

        if (currency !== "BTC") {
            subscribeToTickerOnWs(ticker, "BTC");
            return;
        } else {

            if (ticker === currency) {
                return;
            }

            const errorsHandlers = tickersErrorsHandlers.get(ticker) ?? [];

            errorsHandlers.forEach(fn => {
                fn();
            });
            return;
        }
    }


    if (type !== AGGREGATE_INDEX || newPrice === undefined) {
        return;
    }

    const handlers = tickersHandlers.get(currency) ?? [];
    handlers.forEach(fn => {
        fn(newPrice, crossCurrency)
    });
})
;


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

function splitErrorResponse(message) {
    const error = message.split('~');

    return {
        ticker: error[2],
        currency: error[3]
    };
}

function subscribeToTickerOnWs(ticker, currency) {
    sendToWebSocket({
        action: "SubAdd",
        subs: [`5~CCCAGG~${ticker}~${currency}`]
    });
}

function unsubscribeFromTickerOnWs(ticker, currency) {
    sendToWebSocket({
        action: "SubRemove",
        subs: [`5~CCCAGG~${ticker}~${currency}`]
    });
}

export const getCoinsList = async () => {
    return (await fetch(URL + "all/coinlist?summary=true")).json();
};

export const subscribeToTicker = (ticker, currency, successCallback, errorCallback) => {
    const successSubscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...successSubscribers, successCallback]);

    const errorSubscribers = tickersErrorsHandlers.get(ticker) || [];
    tickersErrorsHandlers.set(ticker, [...errorSubscribers, errorCallback]);
    subscribeToTickerOnWs(ticker, currency);
};

export const unsubscribeFromTicker = (ticker, currency) => {
    tickersHandlers.delete(ticker);
    tickersErrorsHandlers.delete(ticker);
    unsubscribeFromTickerOnWs(ticker, currency);
};