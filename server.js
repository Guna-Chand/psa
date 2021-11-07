import express from 'express';
const app = express();
import cors from 'cors';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
const port = process.env.PORT || 5100;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const searchTermsSchema = new Schema({
  searchTerm: { type: String, default: 'Nope' },
  frequency: { type: Number, min: 1 }
});

const visitSchema = new Schema({
  inde: Number,
  totalVisits: Number,
  lastVisit: Date
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html')); // relative path
  });
}

var searchTermDoc = mongoose.model('searchTermDoc', searchTermsSchema, 'searchTerms');
var visitDoc = mongoose.model('visitDoc', visitSchema, 'visit');


var data = [];
var expandedData = [];
var searchTerm = '';
var category = '';

app.listen(port, () => console.log(`Listening on port ${port}`));

mongoose.connect('mongodb+srv://chandu:qwerty1000@cluster-5w20o.mongodb.net/psa?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }).
  catch(error => {
    console.log('CONNECTION TO MONGODB FAILED !');
  });

mongoose.connection.on('connected', function () {
  console.log('Mongoose CONNECTED! ');
});

mongoose.connection.on('error', function (err) {
  console.log('Mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
  console.log('Mongoose connection disconnected');
});

app.post('/searchTermSuggestions', (req, res) => {
  try {
    searchTerm = new RegExp(req.body.searchTerm);

    searchTermDoc.find({ searchTerm: searchTerm }).sort({ frequency: -1 }).limit(10).then((resu) => {
      res.send(resu);
    }).catch(er => {
      res.send([]);
      console.log(er);
    })
  } catch (error) {
    console.log(error);
  }

});

app.post('/getVisitCount', (req, res) => {

  visitDoc.find({ inde: 1 }).then(resuu => {
    res.send(resuu);
  }).catch(errr => {
    res.send('Retrieving...');
    console.log(errr);
  });

});


function suitUp(html) {
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

app.post('/getFirstPage', async (req, res) => {
  axios.get('https://www.flipkart.com/').
    then(resp => {
      let dat = suitUp(resp);
      res.send(dat);
    }).catch(err => {
      console.log(err);
      let dat = suitUp(null);
      res.send(dat);
    });
});

function topFiveImageRetrieval(html) {
  if (html === undefined || html.data === undefined) {
    return 0;
  } else {
    const $ = cheerio.load(html.data);
    let resultImage = "";
    $('div.aok-relative').each((i, elem) => {
      if ($(elem).find('img.s-image').length != 0) {
        let src = $(elem).find('img.s-image').attr('src');
        if (src) {
          if (!src.startsWith("https")) {
            src = "https" + src;
          }
          resultImage = src;
          return false;
        }
      }
    });
    return resultImage;
  }
}

app.post('/initialFireup', async (req, res) => {
  let date = new Date();

  let result = await visitDoc.updateOne(
    { inde: 1 },
    {
      $inc: { totalVisits: 1 },
      $set: { lastVisit: date }
    },
    { upsert: true }
  );

  searchTermDoc.find({}).sort({ frequency: -1 }).limit(5).then((resu) => {
    let dataLocal = resu;
    let topFiveAdder = ``;
    let imgSrc = [];
    let topFiveHtml = ``;
    const dataLocalPromises = dataLocal.map(async (item, i) => {
      let topFiveUrl = 'https://www.amazon.in/s?k=' + item.searchTerm.split(' ').join('+') + '&ref=nb_sb_noss_2';
      try {
        topFiveHtml = axios.get(topFiveUrl);
        imgSrc[i] = topFiveImageRetrieval(await topFiveHtml);
      } catch {
        try {
          topFiveHtml = axios.get(topFiveUrl);
          imgSrc[i] = topFiveImageRetrieval(await topFiveHtml);
        } catch {
        }
      }

      if (await imgSrc[i] === undefined || await imgSrc[i] === null || await imgSrc[i].length < 10) {
      } else {
      }
    });
    Promise.all(dataLocalPromises).then(() => {
      res.send([resu, imgSrc]);
    }).catch(err => {
      console.log(err);
    });
  }).catch(er => {
    res.send([undefined, undefined, undefined, undefined, undefined]);
    console.log(er);
  })
});

function fetchAmazon(html) {
  console.log('Cheerio is working on Amazon, Data is being Retrieved...');
  if (html === undefined || html.data === undefined) {
    return true;
  } else {
    const $ = cheerio.load(html.data);
    try {
      $('div.s-result-list div.s-result-item').each((i, elem) => {
        if ($(elem).attr('class').includes('AdHolder')) {
          return;
        } else if ($(elem).find('span.a-badge').attr('data-a-badge-type') === "deal") {
          return;
        }
        let link = $(elem).find('a.a-link-normal').first().attr('href');
        if (link === undefined || link === "#" || link === "") {
          return true;
        }
        let rating = $(elem).find('i.a-icon-star-small span').first().text();
        if (rating === "" || rating === undefined) {
          rating = 0;
          return;
        } else {
          rating = rating.split(' ');
          rating = rating[0];
        }
        let price = $(elem).find('span.a-price-whole').first().text();
        if (price === "0" || price === "" || price === undefined) {
          return;
        }
        let name = $(elem).find('span.a-text-normal').first().text();

        let ratingCount = '';
        ratingCount = $(elem).find('a.a-link-normal span.a-size-base').first().text();
        if (ratingCount === '' || ratingCount === undefined) {
          ratingCount = '0';
          return;
        } else {
          ratingCount = ratingCount.split(',').join('');
        }

        price = price.replace(/\./g, '');
        let imgSrc = $(elem).find('a.a-link-normal img').attr('srcset');
        if (imgSrc === '' || imgSrc === undefined) {
          imgSrc = '';
        } else {
          imgSrc = imgSrc.slice(imgSrc.indexOf('2.5x') + 6, imgSrc.indexOf('3x') - 1);
          if (!imgSrc.startsWith("https")) {
            imgSrc = "https" + imgSrc;
          }
        }
        data.push({
          id: 'amazon' + i,
          website: 'Amazon',
          link: 'https://www.amazon.in' + link,
          imageSrc: imgSrc,
          name: name,
          title: name,
          brand: $(elem).find('span.a-size-base-plus').text(),
          price: price,
          rating: rating,
          ratingCount: ratingCount
        });
      });
    } catch (err) {
      console.log(err);
    }
    console.log("Data from amazon fetched");
    return true;
  }
}

function deepFlipkart(html) {
  const $ = cheerio.load(html);

  let price = $('div._16Jk6d').first().text();
  if (price === "0" || price === "" || price === undefined) {
    return false;
  }
  let rupee = price[0];
  price = price.slice(1,);
  if (price.includes(rupee) === true) {
    return false;
  }

  let brand = 'NoBrand';

  brand = $('span._2J4LW6').text();
  if (brand.length > 1) {
    brand = brand.slice(0, -6);
  } else {
    brand = $('div._3lDJ1K img').attr('src');
  }
  let rating = $('div._16VRIQ div._3LWZlK').first().text();
  if (rating === undefined || rating === '') {
    return false;
  }
  let ratingCount = $(' div._16VRIQ span._2_R_DZ span').children().first().text();
  if (ratingCount === '' || ratingCount === undefined) {
    ratingCount = '0';
    return false;
  } else {
    ratingCount = ratingCount.slice(0, ratingCount.indexOf("ating") - 2).split(',').join('');
  }
  let img = [];
  $('div.q6DClP').each((i, el) => {
    let imgTemp = $(el).attr('style');
    if (imgTemp !== undefined) {
      imgTemp = imgTemp.slice(21, -1);
      img.push(imgTemp);
    }
  });

  let imt = '';
  if (img[0] !== undefined) {
    imt = img[0].replace(/\/128/g, '/416');
  }

  let name = $('span.B_NuCI').first().text();
  return [rating, imt, ratingCount, name, price, brand, img];
}

function fetchFlipkart(html) {

  console.log('Cheerio is working on Flipkart, Data is being Retrieved...');

  if (html === undefined || html.data === undefined) {
    return true;
  } else {
    const $ = cheerio.load(html.data);
    category = $('a._1jJQdf').first().text();
    if (category !== undefined && category.length > 2) {
    }
    else {
      category = 'UNABLE TO DETECT';
    }

    const promises = [];

    $('div._13oc-S').children().each((i, elem) => {
      if ($(elem).find('div div span').first().text() === "Ad") {
        return true;
      }
      let link = $(elem).find('a').first().attr('href');
      if (link === undefined || link === "#" || link === "") {
        return true;
      } else {
        link = 'https://www.flipkart.com' + link;
      }

      promises.push(axios.get(link)
        .then(response => {
          let temp = deepFlipkart(response.data);

          if (temp === false) {
            return;
          }

          let name = temp[3];

          data.push({
            id: 'flip' + i,
            website: 'Flipkart',
            link: link,
            imageSrc: temp[1],
            name: name,
            title: name,
            brand: temp[5],
            price: temp[4],
            rating: temp[0],
            ratingCount: temp[2]
          });
          expandedData.push({
            id: 'flip' + i,
            website: 'Flipkart',
            link: link,
            imageSrc: temp[1],
            name: name,
            title: name,
            brand: temp[5],
            price: temp[4],
            rating: temp[0],
            ratingCount: temp[2],
            images: temp[6]
          });
        }).catch(err => {
          console.log("Error : ", err);
        }));
    });
    console.log("Data from flipkart fetched");
    return Promise.all(promises).then(() => true).catch(() => false);
  }
}

function fetchSnapDeal(html) {

  console.log('Cheerio is working on SnapDeal, Data is being Retrieved...');
  if (html === undefined || html.data === undefined) {
    return true;
  } else {
    const $ = cheerio.load(html.data);
    $('div.product-tuple-listing').each((i, elem) => {
      let link = $(elem).find('a.dp-widget-link').first().attr('href');
      let imageSrc = $(elem).find('picture.picture-elem source').attr('srcset');
      if (imageSrc === undefined || imageSrc === '') {
        imageSrc = $(elem).find('picture.picture-elem img').attr('src');
      }
      let name = $(elem).find('p.product-title').text();

      let price = $(elem).find('span.product-price').first().text();
      price = price.slice(3,).trim();
      let rating = $(elem).find('div.filled-stars').attr('style');
      if (rating === '' || rating === undefined) {
        rating = 0;
        return;
      } else {
        rating = Number(rating.slice(6, -1)) * (5 / 100);
        rating = rating.toFixed(1);
      }

      let ratingCount = $(elem).find('p.product-rating-count').text();
      if (ratingCount === '' || ratingCount === undefined) {
        ratingCount = 0;
      } else {
        ratingCount = ratingCount.slice(1, -1);
      }

      data.push({
        id: 'snap' + i,
        website: 'SnapDeal',
        link: link,
        imageSrc: imageSrc,
        name: name,
        title: name,
        brand: 'None',
        price: price,
        rating: rating,
        ratingCount: ratingCount
      });
    });
    console.log("Data from Snapdeal fetched");
    return true;
  }
}

app.post('/getSearchResults', async (req, res) => {
  searchTerm = req.body.searchTerm;
  data = [];
  expandedData = [];
  var amazonSearchTerm = searchTerm.split(' ').join('+');
  var flipkartSearchTerm = amazonSearchTerm;
  var snapDealSearchTerm = searchTerm.split(' ').join('%20');

  var amazonUrl = 'https://www.amazon.in/s?k=' + amazonSearchTerm + '&ref=nb_sb_noss_2';
  var flipkartUrl = 'https://www.flipkart.com/search?q=' + flipkartSearchTerm + '&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off';
  var snapDealUrl = 'https://www.snapdeal.com/search?keyword=' + snapDealSearchTerm;
  var amazonNewUrl = 'https://www.amazon.in/s?i=aps&k=' + snapDealSearchTerm + '&ref=nb_sb_noss_2&url=search-alias%3Daps'
  var amazonHeaders = {
    'authority': 'www.amazon.in',
    'rtt': '200',
    'downlink': '2',
    'ect': '4g',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-user': '?1',
    'sec-fetch-dest': 'document',
    'referer': amazonUrl,
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8,es;q=0.7',
    'cookie': 'at-acbin=Atza|IwEBIK0px1Gqti1-AZhSXROXzofVMZhHIAtM6GVc36bGkQmk1HmRc4qSesPDrHUglgoXm-TVkxZv4detTe--jyRscqSw_0tDiNWUE8OwxAcFzVni31Fd-GP7-Rm_z5dL7gSMvm9tHbhZIOpGgS5H1z22rt4Bfkqq5jq6PeiIZSP3hakFAL0fQlivR8r6Y3d27UIChe7r0wU88JqoI0lzq6Fc0PwAxK9NRMF2UCzopRuDUII6CLOQj6Q69dnusVfwlwIumxy278w8D8j8GlJFwCKnQiN2I91mDzjDTk1YW5YbBw2sY5Ja3uRzClpCMMDSiK-ccvx6pCSisFu2p5zbX6sZfEkOhjBRwb0CpoOKbBB1h1pF3jbBge6Sgz9en8fMjNe30xkruWG_9rBqpuYOd0H2rD49zZI7GZ70XAyuOA40Is0ZZg; sess-at-acbin="j4z2I7YbDhjWcTYLIASGMCIdAH6Uhd2Qx0VqCYRRRkU="; sst-acbin=Sst1|PQEhHEgK6WFO88-zOISBRl0CC5wlE9DzroATtxkUx0Cwprn8uFr1rBJVYrXiNyVIkheuaD6RsEQC8-WrqtUo-tZRrmCEgJl1aFhFPKvXKWwzKgnqFeX90vLLHjWmloSW3LvCGO55kpyMfALtEF3CmpF-zrVgCa_cSpEMR3pExYU71pd9Ke9KF1hjOkP3xdjhNs8N3rUj9yfZ7tzBNGNQRmCIG6IGr1zZ2T5kMLcpYdrjZ32DaZ0Km4PsZP98xdfo58Bnm9-0U-bnbt0njvNaM4d0gUKMoVFU1VWrIv5KF-Bc1oOazca5y60O1AyyXKCTwBeLlfGynDvtrnOyIiFLKdpqSg; _rails-root_session=YXBBMFcwZ0VSZlpJNS9qT3NaaHJPZDlFY2YxejJYNVpXWFMyUHR6RGNqL0ExdnVFQVBvemFZOGtVK211U3lrZEdOYTFpdEkya0laOUhvbGVyU0lwMVl1ZnIyZjFjcnF1YjJwL1FCRWwyQm8vM3RkZFNraGdRZ3Y4K1IwL3NkK3piSGF3ZlBFd0VEZEI1dFowV1Z0dWVCYUxpS28rSWhaMXZKTlpTRmtiaURlZ0FHS0VIaStwNEJkMUN1Mm9JaEpTLS1WcUFMYmEyeUtxTnZzOWpyU3pSNEVBPT0%3D--e893dd71731598f66ca5c62ac8432f9e6c79be53; session-id=262-9100105-5016307; i18n-prefs=INR; ubid-acbin=262-4316122-1152821; x-wl-uid=18bfeK+xaij5EKUnYV7fOIj78WqDkoaC1C/HQ5Fxj+xfpuc0e2AtmR6dioljFC06Aqu162Zjt8Os=; visitCount=29; session-token=EG71FCPReiXzWgOCOuEQXtXFT+keu3jKYgDLwCneLsI9HIN+ko4xTguxDQ/V/gjG0pxJiBgv2f60nH26j2guUyStzZY8YvhFwNkkSvvJzjySp/V4nZoeiP8LB27DFs1/qz/itxPyTyMDO5DMVd3nlz1C+z21O2gt6CutnB2cjd3BqsDKPDa9laC+6ewNMVkK; session-id-time=2082758401l; csm-hit=tb:7PEFJDX9HW7B4BTHXE81+s-MSQNNXW2VJNAF38D76SR|1592466208116&t:1592466208116&adb:adblk_no'
  };
  let amazonReturn = false;
  let flipkartReturn = false;
  let snapdealReturn = false;
  let amazon = '';
  let snapdeal = '';
  let flipkart = '';

  try {
    snapdeal = axios.get(snapDealUrl);
    snapdealReturn = fetchSnapDeal(await snapdeal);
  } catch (error) {
    console.log('TRYING AGAIN');
    console.log(error);
    try {
      snapdeal = axios.get(snapDealUrl);
      snapdealReturn = fetchSnapDeal(await snapdeal);
    } catch (err) {
      console.log('DOUBLE TRY FAILED!');
      console.log(err);
      snapdealReturn = true;
    }
  }

  try {
    amazon = axios.get(amazonNewUrl, {
      headers: amazonHeaders
    });
    amazonReturn = fetchAmazon(await amazon);
  } catch (error) {
    console.log('TRYING AGAIN');
    console.log(error);
    try {
      amazon = axios.get(amazonNewUrl, {
        headers: amazonHeaders
      });
      amazonReturn = fetchAmazon(await amazon);
    } catch (err) {
      console.log('DOUBLE TRY FAILED!');
      console.log(err);
      amazonReturn = true;
    }
  }

  try {
    flipkart = axios.get(flipkartUrl);
    flipkartReturn = fetchFlipkart(await flipkart);
  } catch (error) {
    console.log('TRYING AGAIN');
    console.log(error);
    try {
      flipkart = axios.get(flipkartUrl);
      flipkartReturn = fetchFlipkart(await flipkart);
    } catch (err) {
      console.log('DOUBLE TRY FAILED!');
      console.log(err);
      flipkartReturn = true;
    }
  }

  if (await flipkartReturn === true && await amazonReturn === true && await snapdealReturn === true) {
    res.send([data, expandedData, category]);
  }

  let result = await searchTermDoc.updateOne(
    { searchTerm: searchTerm },
    { $inc: { frequency: 1 } },
    { upsert: true }
  );

  if (result === 1) {
    console.log('UPDATED');
  } else {
    console.log('INSERTED');
  }
});

app.post('/sendReport', async (req, res) => {
  let data = {
    service_id: 'service_oe8salj',
    template_id: 'PSATemplate',
    user_id: 'user_FBAGBbzqImK25vE4FKYBD',
    template_params: { 'from_name': req.body.fromName, 'message_html': req.body.messageHtml, 'user_agent': req.body.userAgent },
    accessToken: 'f41e347bd28bd50cab3e6fe39aaa9b11'
  };

  axios.post('https://api.emailjs.com/api/v1.0/email/send', data)
    .then(resp => {
      res.send("success");
    }).catch(err => {
      res.send(err);
    });
});

process.on('SIGINT', function () {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});
