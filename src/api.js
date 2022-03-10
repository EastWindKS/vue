const apiKey = "5581e5622195b446fa57c011b5a6b50aac60bb89f06a336e0eb268e66022a805";
const URL = "https://min-api.cryptocompare.com/data/";
const USD = "USD";
const tickersHandlers = new Map();

const loadTickers = async () => {

    if (tickersHandlers.size === 0) {
        return;
    }

    await fetch(URL + `pricemulti?fsyms=${[...tickersHandlers.keys()].join(",")}&tsyms=USD&api_key=${apiKey}`)
        .then(r => r.json())
        .then(r => {
            const updatedPrices = Object.fromEntries(Object.entries(r).map(([key, value]) => [key, value[USD]]));
            Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
                const handlers = tickersHandlers.get(currency) ?? [];
                handlers.forEach(fn => fn(newPrice));
            });
        });
};

export const getCoinsList = async () => {
    return (await fetch(URL + "all/coinlist?summary=true")).json();
};

export const subscribeToTicker = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...subscribers, cb]);
};

export const unsubscribeFromTicker = (ticker) => {
    tickersHandlers.delete(ticker);

};

setInterval(loadTickers, 5000);
window.tickers = tickersHandlers;