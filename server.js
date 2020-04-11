const express = require('express');
const app = express();
const cors = require('cors');
const mongoose  = require('mongoose');
const Schema  = mongoose.Schema;
const path = require('path');
const searchTermsSchema = new Schema({
  searchTerm : { type: String, default: 'Nope' },
  frequency : { type: Number, min: 1 }
});

const visitSchema = new Schema({
  inde : Number,
  totalVisits : Number,
  lastVisit : Date
});
const axios = require('axios');
const cheerio = require('cheerio');
const port = process.env.PORT || 5100;

// app.use(cors());
// app.use(
//   cors({
//     origin:'http://localhost:3000',
//     credentials: true
//   })
// );

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if(process.env.NODE_ENV === 'production'){
  app.use(express.static( 'client/build' ));

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

app.listen(port,() => console.log(`Listening on port ${port}`));

mongoose.connect('mongodb+srv://chandu:qwerty1000@cluster-5w20o.mongodb.net/psa?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }).
  catch(error => {
    console.log('CONNECTION TO MONGODB FAILED !');
  });

// var db = mongoose.connection;

mongoose.connection.on('connected', function () {
  console.log('Mongoose CONNECTED! ');
});

mongoose.connection.on('error',function (err) {
  console.log('Mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
  console.log('Mongoose connection disconnected');
});



app.post('/searchTermSuggestions', async(req, res) => {
  searchTerm = new RegExp(req.body.searchTerm);

  searchTermDoc.find({ searchTerm: searchTerm }).sort({frequency:-1}).limit(10).then((resu)=>{
        res.send(resu);
        console.log(resu)
    }).catch(er => {
      res.send([]);
      console.log(er);
    })


});


function suitUp(html){
  console.log('Cheerio is working on Start Page...');
  // console.log(html)
  const $ = cheerio.load(html.data);
  let carouselInner = ``;
  $('div._37vuDR').each( (i, ele) => {

    let src = $(ele).find('img._2VeolH').attr('src');
    let link = $(ele).find('a._3MPlks').attr('href');
    if(src === undefined || src === "#" || src === ''){
      console.log(src);
      console.log('SRC FAILED!');
      return;
    }else{
      src = src.replace(src.substring(35, src.indexOf("image")), "/3376/560/");
    }
    if(link === undefined || link === '#' || link === ''){
      console.log('LINK FAILED!')
      return;
    }else{
      link = 'https://www.flipkart.com' + link;
      console.log(link);
      console.log(src);
    }
    if(i === 0){
      carouselInner +=        `<div class="carousel-item active">
                                  <a href = ${link} target = "_blank" rel="noopener noreferrer">
                                  <img src=${src} alt="CarouselImage"/>
                                  </a>
                                </div>
                                    `;
    }else{
      carouselInner +=        `<div class="carousel-item">
                                  <a href = ${link} target = "_blank" rel="noopener noreferrer">
                                  <img src=${src} alt="CarouselImage"/>
                                  </a>
                                </div>
                                    `;
    }

    });
    if(carouselInner === ``){
      carouselInner = `
                        <div class = "carousel-item active no-ads">
                          <span class = "ad-span">GET THE BEST PRODUCTS EASY AND FAST FROM THIS APPLICATION</span>
                        </div>
                        <div class = "carousel-item no-ads">
                          <span class = "ad-span">WE CURRENTLY RESEARCH THROUGH AMAZON, FLIPKART AND SNAPDEAL</span>
                        </div>
                      `;
    }
    return carouselInner;
};







app.post('/getFirstPage', async(req, res) => {
  console.log('getFirstPage');
  axios.get('https://www.flipkart.com/').
    then(resp => {
      console.log('routing the data');
      let dat = suitUp(resp);
      res.send(dat);
    }).catch(err => {
      console.log(err);
    });
});


function topFiveImageRetrieval(html){
  console.log('Cheerio is working on top five, Data is being Retrieved...');
  if(html === undefined || html.data === undefined){
    return 0;
  }else{
    const $ = cheerio.load(html.data);
    return $('div.s-result-list div.s-result-item').first().find('a.a-link-normal img').attr('src');
  }
}


app.post('/initialFireup', async(req, res) => {
  date = new Date();

  let result = await visitDoc.updateOne(
  { inde: 1 },
  { $inc: { totalVisits: 1 },
    $set: { lastVisit: date }
  },
  { upsert: true }
  );


  searchTermDoc.find({}).sort({frequency:-1}).limit(5).then((resu)=>{
      console.log(resu)
      let dataLocal = resu;


      console.log('datalocal server ', dataLocal)
      let topFiveAdder = ``;
      let imgSrc = [];
      let topFiveHtml = ``;
      const dataLocalPromises = dataLocal.map( async(item,i) => {
        let topFiveUrl = 'https://www.amazon.in/s?k=' + item.searchTerm.split(' ').join('+') + '&ref=nb_sb_noss_2';
        try{
          topFiveHtml = axios.get(topFiveUrl);
          imgSrc[i] = topFiveImageRetrieval(await topFiveHtml);
        }catch{
          console.log('TRYING AGAIN');
          try{
          topFiveHtml = axios.get(topFiveUrl);
          imgSrc[i] = topFiveImageRetrieval(await topFiveHtml);
          }catch{
            console.log('DOUBLE TRY FAILED!');
          }
        }

        if(await imgSrc[i] === undefined || await imgSrc[i] === null || await imgSrc[i].length < 10){
          console.log('NOSRC', imgSrc[i]);
          // imgSrc[i] = noImg;
        }else{
          console.log('SRC', imgSrc[i]);
        }
      });
      Promise.all(dataLocalPromises).then(() => {
        console.log(imgSrc);
        // return imgSrc;
        res.send([resu,imgSrc]);
        console.log([resu, imgSrc]);
      }).catch(err => {
        console.log(err);
      });





    }).catch(er => {
      res.send([]);
      console.log(er);
    })
});





function fetchAmazon(html){
  console.log('Cheerio is working on Amazon, Data is being Retrieved...');
  if(html === undefined || html.data === undefined){
    return true;
  }else{
    const $ = cheerio.load(html.data);
    $('div.s-result-list div.s-result-item').each((i, elem) => {
        if($(elem).attr('class').includes('AdHolder')){
          return;
        }else if ($(elem).find('span.a-badge').attr('data-a-badge-type') === "deal") {
          return;
        }
        let link = $(elem).find('a.a-link-normal').first().attr('href');
        if(link === undefined || link === "#" || link === ""){
            return true;
        }
        let rating = $(elem).find('i.a-icon-star-small span').first().text();
        if(rating === "" || rating === undefined){
            rating = 0;
            return;
        }else{
            rating = rating.split(' ');
            rating = rating[0];
        }
        let price = $(elem).find('span.a-price-whole').first().text();
        if(price === "0" || price === "" ||price === undefined){
          return;
        }
        let name = $(elem).find('span.a-text-normal').first().text();

        let ratingCount = '';
        if(isMobile){
          ratingCount = $(elem).find('a.a-link-normal span.a-size-small.a-color-secondary').first().text();
        }else{
          ratingCount = $(elem).find('a.a-link-normal span.a-size-base').first().text();
        }
        if(ratingCount === '' || ratingCount === undefined){
          ratingCount = '0';
          return;
        }else{
          ratingCount = ratingCount.split(',').join('');
        }

        price = price.replace(/\./g, '');
        let imgSrc = $(elem).find('a.a-link-normal img').attr('srcset');
        console.log(imgSrc);
        imgSrc = imgSrc.slice(imgSrc.indexOf('2.5x')+5, imgSrc.indexOf('3x')-1);
        console.log(imgSrc);
        data.push({
            id : 'amazon' + i,
            website : 'Amazon',
            link : 'https://www.amazon.in' + link,
            imageSrc : imgSrc,
            name : name,
            title : name,
            brand : $(elem).find('span.a-size-base-plus').text(),
            price : price,
            rating : rating,
            ratingCount : ratingCount
        });
    });
    console.log(data);
    console.log("Data from amazon fetched");
    return true;
  }
}

function deepFlipkart(html){
  const $ = cheerio.load(html);
  console.log('Digging Deep !');

  let price = $('div._1vC4OE').first().text();
  if(price === "0" || price === "" || price === undefined){
    return false;
  }
  let rupee = price[0];
  price = price.slice(1,);
  if(price.includes(rupee) === true){
    return false;
  }

  let brand = 'NoBrand';

  brand = $('span._2J4LW6').text();
  if(brand.length > 1){
    brand = brand.slice(0, -6);
  }else{
    brand = $('div._3lDJ1K img').attr('src');
  }
  let rating = $('div.hGSR34').first().attr('class');
  if(rating === undefined || rating === ''){
    return false;
  }else if(rating.includes('YddkNl') === true){
    return false;
  }else{
    rating = $('div.hGSR34').first().text();
  }
  let ratingCount = $('span._38sUEc').children().first().text();
  if(ratingCount === '' || ratingCount === undefined){
    ratingCount = '0';
    return false;
  }else{
    ratingCount = ratingCount.slice(0,ratingCount.indexOf("ating")-2).split(',').join('');
  }
  let img = [];
  $('div._2_AcLJ').each((i,el) => {
    let imgTemp = $(el).attr('style');
      if(imgTemp !== undefined){
        imgTemp = imgTemp.slice(21,-1);
        // imgTemp = imgTemp.replace(/\/128/g, '/1664');
        img.push(imgTemp);
      }
    });
  // console.log(img);
  // first().attr('style');
  if(img.length === 0){
    let imgTem = $('img._1Nyybr').first().attr('src');
    if(imgTem !== undefined){
      img.push();
    }
    // else{
    //   img.push(noImg);
    // }
  }

  let name = $('div._3aS5mM p').first().text();
  return [rating, img[0].replace(/\/128/g, '/416'), ratingCount, name, price, brand, img];
}

function fetchFlipkart(html){

  console.log('Cheerio is working on Flipkart, Data is being Retrieved...');

  if(html === undefined || html.data === undefined){
    return true;
  }else{
    const $ = cheerio.load(html.data);
    category = $('a._32ZSYo').first().text();
    if(category !== undefined && category.length > 2){
    //
    }
    else{
      category = 'UNABLE TO DETECT';
    }

    const promises = [];

      $('div._3O0U0u').children().each((i,elem) => {
        // $(ele).each((j, elem) => {
            if($(elem).find('div div span').first().text() === "Ad"){
              return true;
            }
            let link = $(elem).find('a').first().attr('href');
            if(link === undefined || link === "#" || link === ""){
                return true;
            }else{
              link = 'https://www.flipkart.com' + link;
            }

                promises.push(axios.get(link)
                  .then(response => {
                    let temp = deepFlipkart(response.data);

                    if(temp === false){
                      return;
                    }

                    let name = temp[3];

                    data.push({
                        id : 'flip' + i,
                        website : 'Flipkart',
                        link : link,
                        imageSrc : temp[1],
                        name : name,
                        title : name,
                        brand : temp[5],
                        price : temp[4],
                        rating : temp[0],
                        ratingCount : temp[2]
                    });
                    expandedData.push({
                      id : 'flip' + i,
                      website : 'Flipkart',
                      link : link,
                      imageSrc : temp[1],
                      name : name,
                      title : name,
                      brand : temp[5],
                      price : temp[4],
                      rating : temp[0],
                      ratingCount : temp[2],
                      images : temp[6]
                    });
                  }).catch(err => {
                      console.log("Error : ",err);
                  }));
        });
    console.log(data);
    console.log("Data from flipkart fetched");
    return  Promise.all(promises).then(() => true).catch(() => false);
  }
}

function fetchSnapDeal(html){

  console.log('Cheerio is working on SnapDeal, Data is being Retrieved...');
  if(html === undefined || html.data === undefined){
    return true;
  }else{
    const $ = cheerio.load(html.data);
    $('div.product-tuple-listing').each((i, elem) => {
      let link = $(elem).find('a.dp-widget-link').first().attr('href');
      let imageSrc = $(elem).find('picture.picture-elem source').attr('srcset');
      console.log(imageSrc);
      if(imageSrc === undefined || imageSrc === ''){
        imageSrc = $(elem).find('picture.picture-elem img').attr('src');
        console.log('undefined so ', imageSrc)
      }
      let name = $(elem).find('p.product-title').text();

      let price = $(elem).find('span.product-price').first().text();
      price = price.slice(3,).trim();
      let rating = $(elem).find('div.filled-stars').attr('style');
      if(rating==='' || rating === undefined){
        rating =0;
        return;
      }else{
        rating = Number(rating.slice(6,-1))*(5/100);
        rating = rating.toFixed(1);
      }

      let ratingCount = $(elem).find('p.product-rating-count').text();
      if(ratingCount==='' || ratingCount === undefined){
        ratingCount =0;
      }else{
        ratingCount = ratingCount.slice(1,-1);
      }

      data.push({
          id : 'snap' + i,
          website : 'SnapDeal',
          link : link,
          imageSrc : imageSrc,
          name : name,
          title : name,
          brand : 'None',
          price : price,
          rating : rating,
          ratingCount : ratingCount
      });

    });

    console.log(data);
    console.log("Data from Snapdeal fetched");
    return true;
  }
}








app.post('/searchTermsUpdate', async(req, res) => {
  searchTerm = req.body.searchTerm;
  data = [];
  expandedData = [];
  var amazonSearchTerm = searchTerm.split(' ').join('+');
  var flipkartSearchTerm = amazonSearchTerm;
  var snapDealSearchTerm = searchTerm.split(' ').join('%20');

  var amazonUrl = 'https://www.amazon.in/s?k=' + amazonSearchTerm + '&ref=nb_sb_noss_2';
  var flipkartUrl = 'https://www.flipkart.com/search?q=' + flipkartSearchTerm + '&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off';
  var snapDealUrl = 'https://www.snapdeal.com/search?keyword='+ snapDealSearchTerm;

  let amazonReturn = false;

  let flipkartReturn = false;

  let snapdealReturn = false;

  let amazon = '';
  let snapdeal = '';
  let flipkart = '';

  try{
    amazon = axios.get(amazonUrl);
    amazonReturn = fetchAmazon(await amazon);
  }catch{
    console.log('TRYING AGAIN');
    try{
      amazon = axios.get(amazonUrl);
      amazonReturn = fetchAmazon(await amazon);
    }catch{
      console.log('DOUBLE TRY FAILED!');
      amazonReturn = true;
    }
  }

  try{
    snapdeal = axios.get(snapDealUrl);
    snapdealReturn = fetchSnapDeal(await snapdeal);
  }catch{
    console.log('TRYING AGAIN');
    try{
      snapdeal = axios.get(snapDealUrl);
      snapdealReturn = fetchSnapDeal(await snapdeal);
    }catch{
      console.log('DOUBLE TRY FAILED!');
      snapdealReturn = true;
    }
  }

  try{
    flipkart = axios.get(flipkartUrl);
    flipkartReturn = fetchFlipkart(await flipkart);
  }catch{
    console.log('TRYING AGAIN');
    try{
      flipkart = axios.get(flipkartUrl);
      flipkartReturn = fetchFlipkart(await flipkart);
    }catch{
      console.log('DOUBLE TRY FAILED!');
      flipkartReturn = true;
    }
  }

  if(await flipkartReturn === true && await amazonReturn === true && await snapdealReturn === true){
    console.log(flipkartReturn, amazonReturn, snapdealReturn);
    console.log([data,expandedData,category]);
    res.send([data,expandedData,category]);

  }





  let result = await searchTermDoc.updateOne(
  { searchTerm: searchTerm },
  { $inc: { frequency: 1 } },
  { upsert: true }
  );


  if(result === 1){
    console.log('UPDATED');
    // res.send("UPDATED SUCCESFULLY");
  }else{
    console.log('INSERTED');
    // res.send("INSERTED SUCCESFULLY");
  }

});







process.on('SIGINT', function() {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});