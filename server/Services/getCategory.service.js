const axios = require('axios');
const AppConstants = require('../Constants/app.constant');

const getCategory = (searchTerm) => {
    try {
        searchTerm = searchTerm.split(' ').join('%20');
        let payload = {
            "pageUri": "/search?q=" + searchTerm,
            "pageContext": {
                "fetchSeoData": true,
                "paginatedFetch": false,
                "pageNumber": 1
            },
            "requestContext": {
                "type": "BROWSE_PAGE"
            }
        }
        const options = {
            headers: {
                "Content-Type": "application/json",
                "X-User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36 FKUA/website/42/website/Desktop",
                "Cookie": "T=TI163603957647300293277403307584179734236360128609608311466750272562; Network-Type=4g; AMCVS_17EB401053DAF4840A490D4C%40AdobeOrg=1; SN=VID0BF2826DC454713B2C937F81E9A8870.TOKF49B332B58794EE8B16FB4DF179B3528.1636040180.LO; AMCV_17EB401053DAF4840A490D4C%40AdobeOrg=-227196251%7CMCIDTS%7C18936%7CMCMID%7C72866336682627543210383610789697999414%7CMCAID%7CNONE%7CMCOPTOUT-1636047384s%7CNONE; S=d1t13Pz81P2M/BXc/DBkAPxRQJUeV7O/J2IK7nHlDtfAgu9nWu/xp2yNeENeuyKYy3PS1JKVempQR1ttDVt4O4JYGtw=="
            }
        };
        return axios.post(AppConstants.FLIPKART_URL, payload, options)
            .then(httpRes => {
                let res = httpRes.data;

                let category = [];

                if (res && res.STATUS_CODE === 200 && res.RESPONSE && res.RESPONSE.slots) {
                    let slots = res.RESPONSE.slots;
                    slots.forEach(element => {
                        if (element.widget && element.widget.type === "FILTERS") {
                            element.widget.data.filters.facetResponse.parentMetaInfoList.forEach(cat => {
                                category.push(cat.title);
                            });
                        }
                    });
                }
                return category;
            }).catch(catErr => {
                console.log(catErr);
                return [];
            })
    } catch (err) {
        console.log(err);
        return []
    }
};

module.exports = getCategory;