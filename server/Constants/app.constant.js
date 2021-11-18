
const constants = {
    CONN_STR: process.env.CONN_STR_PSA,
    PORT: process.env.PORT || 5100,
    NODE_ENV: process.env.NODE_ENV,
    FLIPKART_URL: "https://2.rome.api.flipkart.com/api/4/page/fetch",
    AMAZON_URL: (searchTerm, page) => { return `https://www.amazon.in/s/query?k=${searchTerm}&page=${page}` },
    MYNTRA_URL: (searchTerm, page) => { return `https://www.myntra.com/${searchTerm}?p=${page}` }
}

module.exports = constants;