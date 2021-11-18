const axios = require('axios');
const cheerio = require('cheerio');

function getCarousalItems (html) {
    let carouselInner = ``;
    if (html !== null) {
        const $ = cheerio.load(html.data);
        $('div._1mIbUg').each((i, ele) => {

            let src = $(ele).find('img._3DIhEh').attr('src');
            let link = $(ele).find('a._2a3TMW').attr('href');
            if (src === undefined || src === "#" || src === '') {
                return;
            } else {
                src = src.replace(src.substring(35, src.indexOf("image")), "/3376/560/");
            }
            if (link === undefined || link === '#' || link === '') {
                console.log('LINK FAILED!')
                return;
            } else {
                link = 'https://www.flipkart.com' + link;
            }
            if (i === 0) {
                carouselInner += `<div class="carousel-item active yes-ads">
                            <span class="flipkartBanner"><img alt="Flipkart" class="fromFlipkartImage"></span>
                            <a href = ${link} target = "_blank" rel="noopener noreferrer">
                            <img style="width:100%" src=${src} alt="CarouselImage"/>
                            </a>
                          </div>
                          `;
            } else {
                carouselInner += `<div class="carousel-item yes-ads">
                            <span class="flipkartBanner"><img alt="Flipkart" class="fromFlipkartImage"></span>
                            <a href = ${link} target = "_blank" rel="noopener noreferrer">
                            <img style="width:100%" src=${src} alt="CarouselImage"/>
                            </a>
                          </div>
                          `;
            }

        });
    }
    if (carouselInner === ``) {
        carouselInner = `
                        <div class = "carousel-item active no-ads">
                          <span class = "ad-span">GET THE BEST PRODUCTS EASY AND FAST FROM THIS APPLICATION</span>
                        </div>
                        <div class = "carousel-item no-ads">
                          <span class = "ad-span">WE CURRENTLY CRAWL THROUGH AMAZON, FLIPKART AND SNAPDEAL</span>
                        </div>
                      `;
    }
    return carouselInner;
};

const getFlipCarousal = () => {
    return axios.get('https://www.flipkart.com/').
        then(resp => {
            return getCarousalItems(resp);
        }).catch(err => {
            console.log(err);
            return getCarousalItems(null);
        });
}

module.exports = getFlipCarousal;