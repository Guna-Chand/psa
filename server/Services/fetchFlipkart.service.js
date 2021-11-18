const axios = require('axios');
const AppConstants = require('../Constants/app.constant');
const ProductData = require('../Models/productData');

function valid(ele) {
    return ele !== null && ele !== undefined && ele !== "#" && ele !== "";
}

function exist(ele) {
    return ele !== null && ele !== undefined;
}

const fetchFlipkart = (searchTerm, page) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                let resList = [];
                
                searchTerm = searchTerm.split(' ').join('%20');
                let payload = {
                    "pageUri": "/search?q=" + searchTerm,
                    "pageContext": {
                        "fetchSeoData": true,
                        "paginatedFetch": false,
                        "pageNumber": page
                    },
                    "requestContext": {
                        "type": "BROWSE_PAGE"
                    }
                }
                const options = {
                    timeout: 1000 * 30,
                    headers: {
                        "Content-Type": "application/json",
                        "X-User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36 FKUA/website/42/website/Desktop",
                        "Cookie": "T=TI163603957647300293277403307584179734236360128609608311466750272562; Network-Type=4g; AMCVS_17EB401053DAF4840A490D4C%40AdobeOrg=1; SN=VID0BF2826DC454713B2C937F81E9A8870.TOKF49B332B58794EE8B16FB4DF179B3528.1636040180.LO; AMCV_17EB401053DAF4840A490D4C%40AdobeOrg=-227196251%7CMCIDTS%7C18936%7CMCMID%7C72866336682627543210383610789697999414%7CMCAID%7CNONE%7CMCOPTOUT-1636047384s%7CNONE; S=d1t13Pz81P2M/BXc/DBkAPxRQJUeV7O/J2IK7nHlDtfAgu9nWu/xp2yNeENeuyKYy3PS1JKVempQR1ttDVt4O4JYGtw=="
                    }
                };
                let httpRes = await axios.post(AppConstants.FLIPKART_URL, payload, options);
                let res = httpRes.data;

                let idCount = 0;

                if (res && res.STATUS_CODE === 200 && res.RESPONSE && res.RESPONSE.slots) {
                    let slots = res.RESPONSE.slots;
                    slots.forEach(element => {
                        if (element.widget && element.widget.type === "PRODUCT_SUMMARY") {
                            let products = element.widget.data.products;
                            // to eliminate duplicate products
                            let tempArr = [];
                            products.forEach(product => {
                                if (!exist(product.adInfo)) {
                                    let details = product.productInfo.value;
                                    if (details.availability.MessageIntent === "positive" && details.rating.count !== 0 && !tempArr.includes(details.baseUrl)) {
                                        let images = [];
                                        details.media.images.forEach(image => {
                                            if (valid(image.url))
                                                images.push(image.url.replace("{@width}", "1664").replace("{@height}", "1664").replace("{@quality}", "70"));
                                        });
                                        
                                        let resItem = new ProductData();
                                        resItem.id = "flip" + idCount++;
                                        resItem.website = "Flipkart";
                                        resItem.link = "https://flipkart.com" + details.baseUrl;
                                        resItem.imageSrc = images[0];
                                        resItem.name = details.titles.title;
                                        resItem.title = details.titles.title;
                                        resItem.brand = details.productBrand;
                                        resItem.price = details.pricing.finalPrice.value;
                                        resItem.rating = parseFloat(details.rating.average.toFixed(1));
                                        resItem.ratingCount = details.rating.count;
                                        resItem.images = [...new Set(images)];
                                        resList.push(resItem);

                                        tempArr.push(details.baseUrl);
                                    }
                                }
                            });
                        }
                    });
                }
                console.log("FlipKart -- Done");
                resolve(resList);
            } catch (err) {
                reject(err);
            }
        })()
    });
};

module.exports = fetchFlipkart;