const axios = require('axios');
const cheerio = require('cheerio');
const AppConstants = require('../Constants/app.constant');

function valid(ele) {
    return ele !== null && ele !== undefined && ele !== "#" && ele !== "";
}

const getImage = (searchTerm) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                let imageSrc = "";
                let imageCaptureFlag = false;

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

                let httpRes = await axios.get(AppConstants.AMAZON_URL(searchTerm, 1), options);

                if (typeof httpRes.data === "string") {
                    let res = httpRes.data.replace(/&&&/g, ",");
                    res = res.substring(0, res.lastIndexOf(','));
                    res = JSON.parse(`[${res}]`);

                    for (const element of res) {
                        if (!imageCaptureFlag){
                            if (element.length >= 3 && element[1].includes("search-result-")) {
                                const $ = cheerio.load(element[2].html);
                                if (!$('div.s-result-item').attr('class').includes('AdHolder')) {
                                    let imageTagSrc = $('a.a-link-normal img').attr('srcset');
                                    if (valid(imageTagSrc)) {
                                        imageSrc = imageTagSrc.slice(imageTagSrc.indexOf('2.5x') + 6, imageTagSrc.indexOf('3x') - 1).trim();
                                        if (!imageSrc.startsWith("https")) {
                                            imageSrc = "https" + imageSrc;
                                        }
                                        imageCaptureFlag = true;
                                    }
                                }
                            }
                        } else break;
                    }

                }
                resolve(imageSrc);
            } catch (err) {
                reject(err);
            }
        })()
    });
};

module.exports = getImage;