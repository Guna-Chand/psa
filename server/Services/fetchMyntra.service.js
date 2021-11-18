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
                            "cookie": "AKA_A2=A; bm_sz=307E3E8A6F69A8C8E25B26015DA46771~YAAQbQosF93dyCt9AQAAhdsTMw2WRrbFPzOejZpLrjEVXI2cKWkgHBumS/vYCpN0duyh8mtkjYiwPb1+4+0j2E3mImW+3N6n26lk0O7t0VHjbrcyko5J2qpJQLWKCrknGln5NHSh1bKX3Zs/DtHuaQnDYawal8VkuIoaybLGlwAkbSMCbOGwr0MuuU3Ctz0aBo7xn0UtR2/Xw6bjpiqcDq9V4Jqtpop5fLM1ZFF7d//yZVJ39ksJYKBS3o12h9rKJyaBhwpfLtosH/J7+EoghCwKOBurx3cGTZ7U9c/Lbe4TJtY=~4535092~4601412; ak_bmsc=C8330D6227DE0272B815C2F607A89B40~000000000000000000000000000000~YAAQbQosF+bdyCt9AQAAXdwTMw39JOmqUGze9x835Aq2RTWOQFZsqEwX7S6/iVV14y2MIrkN2F0zvMBL0ssheY6XbYFFJEnu/4vOqat8JPz1PXbin8YK+3aBVvqlx2i3dSZ2Jy1xMQFVc2oFwi41V+I+P+gV14Wp92PV5yy6D8MM1Q4Lz8Ytwq7pXsGRyqoYTcU+oU+jN5V2HXzXpblaULy2TueUlvlsD0iW4dSy3PC/ynwtn8QfQG3t+ubhrYIqxV4KAM4xEx7FEo3Q9jbbVVUsTV3eAWE38SyiD/LoKDOz5jOhdIAbJqTVdEMg8THFvWZ8+uo58jbWrwDv84Gz1miDcbQRIE2bREqweDkKBrnLXFwhnz2vjgx+sBh/AICqdeR6aSMVTrrH7CYpkN3/qAt06xVqBSAqIYdDs67GARtLZcLdLsuLFDbdryDkn6U85EPU2rc+WMEu1cTiNZrL5/2slss3f7qcX7z3ZkY=; _mxab_=; _pv=default; dp=d; at=ZXlKaGJHY2lPaUpJVXpJMU5pSXNJbXRwWkNJNklqRWlMQ0owZVhBaU9pSktWMVFpZlEuZXlKdWFXUjRJam9pTkdKaE1EWXpaVFl0TkRnMlpDMHhNV1ZqTFdKbU5UWXRNREF3WkROaFpqSTRaVFF4SWl3aVkybGtlQ0k2SW0xNWJuUnlZUzB3TW1RM1pHVmpOUzA0WVRBd0xUUmpOelF0T1dObU55MDVaRFl5WkdKbFlUVmxOakVpTENKaGNIQk9ZVzFsSWpvaWJYbHVkSEpoSWl3aWMzUnZjbVZKWkNJNklqSXlPVGNpTENKbGVIQWlPakUyTlRJM09URTBOemtzSW1semN5STZJa2xFUlVFaWZRLnpVSHJCbGxaRnVUcnZZaFF0ZjNVUVRQVEtaUHZnWGM2eXlYZktHNzh3X0k=; bc=true; utm_track_v1=%7B%22utm_source%22%3A%22direct%22%2C%22utm_medium%22%3A%22direct%22%2C%22trackstart%22%3A1637239479%2C%22trackend%22%3A1637239539%7D; lt_timeout=1; lt_session=1; utrid=QG8AZ30eCApBQwNVc19AMCMyMzk2NDIyODM0JDI%3D.a66cf6c9580c995c7a9ea20c39234a60; bm_mi=AE333D0A295A5BA249B67C92CB642777~1ZrT/3hU/9Ci4mnHNjBKFUEx6Ipr/mA9F6QcOO5VmPLpTSFPra8rS35EWgS8A6D9v/tDvkw4maCqWTjUrq4HQYEZtolLBhyVEOWxouwN6MTGrbzYQrub6wCfDe/S1ypX71+HeKu0z3rSuMIqehqh1xWZbZbriGoLPQ6FU0N2V35hQpAC31Zi9n51xE4tQiraxamefIUjLFcv5cFnzYdvRkObqlQDzpeu8QAr/n8oxzfmUr9kjj84nJZfgnBZV5Hrb2mR5XAWbxV0lSJIC7u03g==; bm_sv=C79F3E8AF2560B82B08E5120B11EDD37~PWg9uItPpQzHOdXuaniY7vpdwQoFwBLkTxDJT4nOOpuR0CXiwIQd2WvjjpWSQ6pjNUOx9v964AM/5CMB8SFOkJ42yBdwI/pGzlqQaE2a1sBX7oGmoIda4UtZDX57hVLqJOrBP/X3yfOUlKuZUfpj4CpD+dj5JA33pZe7C2sEQNg=; akaas_myntra_SegmentationLabel=1639831480~rv=2~id=6c26d51269b62556372d2f2ebbf04a9d~rn=PWA; _abck=4DDEC1A5187E10D37D862B32E6CDEA29~-1~YAAQbQosFwfeyCt9AQAA194TMwa/xekf/9qCsLo6sDdlNuE2g47yJZoG5dCVoXItX4rsMsG6PIL72EelogSxtcjYAG/45+F5eXodiDIBb4CCAKbO2UN1NYvxEgIPKmS+b88P/un0hhCHjvaS5c4XW3xl7Bg4Vby0UKC36II/WpUF9a8xX6nI48+NoFIEmQefhlZ5u0wyDxlNxWl7cbvB0fgaZyS9EBw22k0PAvJMqGkm8WF+FrZ/Vl9jSuB63hOLBqMw83dczm67xqIUaOkZ8MUoxjm3fpJZtt7zCAWktK4YOv7DnEAYrqU/QkHkfOJ8h0B31PHxqciCnk68tv5qK3f7OrmPwL0yn6Ongd5c7O210Kdg3BPN0d+BTqFdL420zUKfFJckFfhNvg==~-1~||1-xWlaWETSaS-1-10-1000-2||~-1",
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