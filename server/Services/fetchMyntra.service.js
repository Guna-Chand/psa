const axios = require('axios');
const AppConstants = require('../Constants/app.constant');
const ProductData = require('../Models/productData');
const cheerio = require('cheerio');

function valid(ele) {
    return ele !== null && ele !== undefined && ele !== "#" && ele !== "";
}

function exist(ele) {
    return ele !== null && ele !== undefined;
}

function findData(html) {
    try {
        const $ = cheerio.load(html);
        let scripts = $('script').filter(function () {
            return ($(this).html().indexOf('window.__myx =') > -1);
        });
        if (scripts.length > 0) {
            let data = $(scripts[0]).html();
            data = data.replace("window.__myx =", "");
            if (data.endsWith(";"))
                data = data.substring(0, data.lastIndexOf(";"));
            return JSON.parse(data);
        } else return null;
    } catch (err) {
        console.log(err);
        return null;
    }
}

const fetchMyntra = (searchTerm, page, isMyntraSearchable) => {
    return new Promise((resolve, reject) => {
        (async () => {
            if (isMyntraSearchable){
                try {
                    let resList = [];
                    
                    searchTerm = searchTerm.split(' ').join('-');
                    const options = {
                        timeout: 1000 * 30,
                        "headers": {
                            "accept": "*/*",
                            "accept-language": "en-GB,en;q=0.9",
                            "content-type": "application/json",
                            "x-meta-app": "channel=web",
                            "x-myntraweb": "Yes",
                            "x-requested-with": "browser",
                            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36 FKUA/website/42/website/Desktop"
                        }
                    };
                    let httpRes = await axios.get(AppConstants.MYNTRA_URL(searchTerm, page), options);
                    let data = findData(httpRes.data);

                    let idCount = 0;

                    if (data !== null) {
                        if (exist(data.searchData)) {
                            if (exist(data.searchData.results)) {
                                if (exist(data.searchData.results.products)) {
                                    let dataList = data.searchData.results.products;
                                    dataList.forEach(item => {
                                        if (item.ratingCount !== 0){
                                            let images = [];
                                            item.images.forEach(image => {
                                                if (valid(image.src))
                                                    images.push(image.src);
                                            });
    
                                            let resItem = new ProductData();
                                            resItem.id = "myntra" + idCount++;
                                            resItem.website = "Myntra";
                                            resItem.link = "https://myntra.com/" + item.landingPageUrl;
                                            resItem.imageSrc = images[0];
                                            resItem.name = item.productName;
                                            resItem.title = item.productName;
                                            resItem.brand = item.brand;
                                            resItem.price = item.price;
                                            resItem.rating = parseFloat(item.rating.toFixed(1));
                                            resItem.ratingCount = item.ratingCount;
                                            resItem.images = [...new Set(images)];
                                            resList.push(resItem);
                                        }
                                    });
                                }
                            }
                        }
                    }
                    console.log("Myntra -- Done");
                    resolve(resList);
                } catch (err) {
                    reject(err);
                }
            } else reject("Myntra -- Denied");
        })()
    });
};

module.exports = fetchMyntra;