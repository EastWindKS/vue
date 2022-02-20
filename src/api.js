const apiKey = "5581e5622195b446fa57c011b5a6b50aac60bb89f06a336e0eb268e66022a805";
const URL = "https://min-api.cryptocompare.com/data/price?";

export const getDataByName = async name => {
    return (await fetch(URL + `fsym=${name}&tsyms=USD&api_key=${apiKey}`)).json();
}