const axios = require('axios');
const cheerio = require('cheerio');
const ProductData = require('../Models/productData');
const AppConstants = require('../Constants/app.constant');

function valid(ele) {
    return ele !== null && ele !== undefined && ele !== "#" && ele !== "";
}

const fetchAmazon = (searchTerm, page) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                let resList = [];
                
                searchTerm = searchTerm.split(' ').join('%20');
                const options = {
                    timeout: 1000 * 30,
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "*/*",
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
                        "Cookie": "session-id=261-2208572-3098713; i18n-prefs=INR; ubid-acbin=258-3699615-6989161; session-token=sH1fyGTvMvwwmoT8ciavHZhQarqHpmJlpfQ1NGqizQ6UqxiYS0YGPdqlW/ujvGBx44W5zkLCJfnv9rt7JJIcx3TAJFyTKimcMKLr9IYA3P3Sotre60IVdBrUfp6sYq859fbQ7S211BdmOjc3g71f+uxyR/AX9n8aWo0CaKnZWpgsRxWaZkn1KutQD5h67hFy; visitCount=1; session-id-time=2082787201l; csm-hit=tb:N63VB3Q59QZE4J2X4PDF+s-DDWDFSND186JVZZSYMJX|1636041950936&t:1636041950937&adb:adblk_no"
                    }
                };
                
                let httpRes = await axios.get(AppConstants.AMAZON_URL(searchTerm, page), options);
                let idCount = 0;

                if (typeof httpRes.data === "string") {
                    let res = httpRes.data.replace(/&&&/g, ",");
                    res = res.substring(0, res.lastIndexOf(','));
                    res = JSON.parse(`[${res}]`);

                    res.forEach(element => {
                        if (element.length >= 3 && element[1].includes("search-result-")) {
                            const $ = cheerio.load(element[2].html);
                            if (!$('div.s-result-item').attr('class').includes('AdHolder')) {
                                let link = $('a.a-link-normal').first().attr('href');
                                if (valid(link)) {
                                    let rating = $('i.a-icon-star-small span').first().text();
                                    if (valid(rating)) {
                                        rating = parseFloat(rating.split(' ')[0]);
                                        let price = $('span.a-price-whole').first().text();
                                        if (valid(price)) {
                                            price = parseInt(price.replace(/,/g, ""));
                                            let title = $('span.a-text-normal').first().text();
                                            if (valid(title)) {
                                                let ratingCount = $('a.a-link-normal span.a-size-base').first().text();
                                                if (valid(ratingCount)) {
                                                    ratingCount = ratingCount.replace(/,/g, "");
                                                    if (/^[0-9]+$/.test(ratingCount)) {
                                                        ratingCount = parseInt(ratingCount);
                                                        let imageSrc = $('a.a-link-normal img').attr('srcset');
                                                        if (valid(imageSrc)) {
                                                            imageSrc = imageSrc.slice(imageSrc.indexOf('2.5x') + 6, imageSrc.indexOf('3x') - 1).trim();
                                                            if (!imageSrc.startsWith("https")) {
                                                                imageSrc = "https" + imageSrc;
                                                            }
                                                        } else {
                                                            imageSrc = "";
                                                        }
                                                        let resItem = new ProductData();
                                                        resItem.id = "amazon" + idCount++;
                                                        resItem.website = "Amazon";
                                                        resItem.link = "https://www.amazon.in" + link;
                                                        resItem.imageSrc = imageSrc;
                                                        resItem.name = title;
                                                        resItem.title = title;
                                                        resItem.brand = $('span.a-size-base-plus').text();
                                                        resItem.price = price;
                                                        resItem.rating = parseFloat(rating.toFixed(1));
                                                        resItem.ratingCount = ratingCount;
                                                        resItem.images = [imageSrc];
                                                        resList.push(resItem);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
                console.log("Amazon -- Done");
                resolve(resList);
            } catch (err) {
                reject(err);
            }
        })()
    });
};

module.exports = fetchAmazon;