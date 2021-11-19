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
                            "accept": "application/json",
                            "accept-language": "en-GB,en;q=0.9",
                            "content-type": "application/json",
                            "sec-fetch-dest": "empty",
                            "sec-fetch-mode": "cors",
                            "sec-fetch-site": "same-origin",
                            "sec-gpc": "1",
                            "x-meta-app": "channel=web",
                            "x-myntraweb": "Yes",
                            "x-requested-with": "browser",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
                            "cookie": "akaas_myntra_SegmentationLabel=1639902590~rv=2~id=4147cbfe1713f26be9e3e53c8b46fcf1~rn=PWA; _abck=4DDEC1A5187E10D37D862B32E6CDEA29~-1~YAAQnlM2F72gQTB9AQAAsO1QNwabhjKenVmKADVNIDfjXW3y2+jmNjRw6rW676E4Xjp0jYiQKwMjWztXhgjzYjmOn3Vi/VfWedLAiMAssWtd/WvPg1qXRXyAFDKxzgN1V1MlXvWQ+nb6zOcl/s+fYRKM8W+d8PpoUBMWyEBcG1hMWleA3o5cii5DJYgZVkqy5A48ll5+Q1qXpKSSW5NWqQw7UM6polQ6tUnp52p8SZEYRvdj4mQPGPIeu46IW+2lzDEoMnsfq1FLqOFuMTrfNBnBTj30DFyh9mqHj9XzitXQBIDfzyeuDrh54g1OmRhr027BLPhTbtK4AqjZ7epBFnMU1gusFJrtlWyKGO7f6nE=~-1~-1~-1",
                            "Referer": "https://www.myntra.com/",
                            "Referrer-Policy": "strict-origin-when-cross-origin"
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