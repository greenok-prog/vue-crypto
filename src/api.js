const API_KEY = 'e080d93c64c06c1c734cc1fd41bf3f60b00b7d4d929834f9f0e1732cfe0a92f6'

const tickersHandlers = new Map();
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`)
const AGGREGATE_INDEX = '5'

socket.addEventListener('message', (e) => {
    const { TYPE: type, FROMSYMBOL: currency, PRICE: newPrice } = JSON.parse(e.data)
    if (type !== AGGREGATE_INDEX || newPrice === undefined) {
        return
    } else {
        const handlers = tickersHandlers.get(currency) ?? []
        handlers.forEach(fn => fn(newPrice))
    }

})


function sendToWebSocket(message) {
    const stringifiedMessage = JSON.stringify(message)
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMessage)
        return
    }
    socket.addEventListener('open', () => {
        socket.send(stringifiedMessage)
    }, { once: true })

}
function subscribeToTickerOnWs(ticker) {
    sendToWebSocket({
        "action": "SubAdd",
        "subs": [`5~CCCAGG~${ticker}~USD`]
    })
}
function unsubscribeFromTickeronWs(ticker) {
    sendToWebSocket({
        "action": "SubRemove",
        "subs": [`5~CCCAGG~${ticker}~USD`]
    })
}

export const subscribeToTicker = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...subscribers, cb]);
    subscribeToTickerOnWs(ticker);

}

export const unsubscribeFromTicker = ticker => {
    tickersHandlers.delete(ticker)
    unsubscribeFromTickeronWs(ticker)
}

