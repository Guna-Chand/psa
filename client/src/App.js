import React from 'react';
import './App.css';
import './ResultV2.css';
import noImg from './noImg.jpg';
import { FaDesktop, FaTimesCircle } from "react-icons/fa";
import { IoMdArrowDropupCircle, IoIosArrowForward } from "react-icons/io";
// import { FaArrowRight, FaReact, FaDesktop} from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { TiArrowSortedUp } from "react-icons/ti";


// import ReactDOM from "react-dom";
// import { Link, BrowserRouter as Router, Route } from "react-router-dom";
// import { BrowserRouter as Router, Route } from "react-router-dom";

import {isMobile, osVersion, osName, fullBrowserVersion, browserName, engineName, getUA, deviceType} from 'react-device-detect';

import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, OverlayTrigger, Popover } from 'react-bootstrap';
import { HashLoader } from 'react-spinners';

// import Dropdown from 'rc-dropdown';
// import Menu, { Item as MenuItem, ItemGroup as MenuItemGroup } from 'rc-menu';
import $ from 'jquery';
// import 'rc-menu/assets/index.css';

// import 'rc-dropdown/assets/index.css';
import { css } from '@emotion/core';
// import ReactDOMServer from 'react-dom/server';
// import ReactDOM from 'react-dom';


const axios = require('axios');
// const cheerio = require('cheerio');

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

var data = [];
var fixedData = [];
var expandedData = [];
var globalCurrentSearchTermFlag = '';
var globalCurrentSearchTermStable = '';
//globalPriceUpdateFlag is to keep track if the price slider is moved or not just not to do unneccessary price sorting
var globalPriceUpdateFlag = false;

// var globalWebsiteCheckboxUpdateFlag = false;
var globalTopFive = [];
// var flipCount = 0;

// const productRouteSearch = ({ match, location }) => {
//   console.log('LISTENED!');
//   console.log(location.search);
//   console.log(location.search.slice(3,));
//
//   const psa = new ProductSearchAutomation();
//   psa.analyse('psaAnchor'+location.search.slice(3,));
//   return(<span></span>);
// };


class ProductSearchAutomation extends React.Component{

  //constructor
  constructor(props){
    super(props);

    this.aboutState = "closed";

    this.reportState = "closed";

    this.flipkart = {};

    this.amazon = {};

    this.snapdeal = {};

    this.startFlipHTML = {};

    this.topFiveHtml = {};

    this.state = {

      showResultModal: false,

      timeoutMsg: '',

      timeCounter: 0,

      head : '',

      category : 'Not Detected',

      resultCount : 0,

      reportEmail : '',

      reportContent : '',

      searchTerm : ''
    };
    this.handleSearchTerm = this.handleSearchTerm.bind(this);
    this.reloading = this.reloading.bind(this);
    this.dropdownCall = this.dropdownCall.bind(this);
    this.fetchTopFive = this.fetchTopFive.bind(this);
    this.timeoutMsgTrigger = this.timeoutMsgTrigger.bind(this);
    this.setSearchSuggestions = this.setSearchSuggestions.bind(this);
    // this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleDropdownClick = this.handleDropdownClick.bind(this);
    // this.productRouteSearch = this.productRouteSearch.bind(this);
  }


  // handleDropdownClick(event){
  //   console.log(event);
  //   let name = event.target.name;
  //   if(name !== undefined){
  //     console.log(name);
  //     let first = name.split(' ');
  //     if(first[0] === 'top5'){
  //       console.log('CALLING');
  //       this.dropdownCall(name.splice(1).join(' '));
  //     }
  //   }
  // }

  async componentDidMount(){

    window.scroll({ top: 0, left: 0, behavior: 'smooth'});

    window.onscroll = () =>{
          let pageOffset = document.documentElement.scrollTop || document.body.scrollTop;
          if(pageOffset > 250)
          {
              document.getElementById('moveToTop').style.opacity="1";
              document.getElementById('moveToTop').style.visibility="visible";
          }else
          {
              document.getElementById('moveToTop').style.opacity="0";
              document.getElementById('moveToTop').style.visibility="hidden";
          }
      };

      window.$("#sliderId").ionRangeSlider({
                                      skin: "flat",
                                      type: "double",
                                      min: 0,
                                      max: 10000,
                                      from: 0,
                                      to: 10000,
                                      grid: true,
                                      force_edges: true,
                                      prefix: `&#8377;`,
                                      grid_num: 4,
                                      prettify_separator: ",",
                                      values_separator: " to ",
                                      onFinish: data => {
                                          console.dir(data.from, ' to ', data.to);
                                          this.updateResult();
                                      }
                                  });

    // document.addEventListener('click', this.handleDocumentClick);
    let proxyUrl = 'https://gunachand-proxy.herokuapp.com/';
    axios.get(proxyUrl)
      .then(response => {
        console.log('PROXY fired successfully !');
      })
      .catch(err => {
        axios.get(proxyUrl)
          .then(response => {
            console.log('PROXY fired successfully !');
          })
          .catch(err => {
              console.log("Error : ",err);
              if(err.toString().includes('Network Error')){
                alert('There\'s an issue with your Internet Connection! Please try again.')
              }
              console.log('PROXY NOT fired !');
          });
      });

    try{
      console.log('Getting the html to load first page content');
      // this.startFlipHTML = axios.get(proxyUrl + 'https://www.flipkart.com/');
      // this.fetchStartPageContent(await this.startFlipHTML);
        axios.post('/getFirstPage')
        .then( res => {
          console.log(res.data);
          this.fetchStartPageContent(res.data);
        }).catch( err => {
          console.error(err);
        });
    }catch(err){
      console.log(err);
    }

    axios.post('/initialFireup')
    .then( res => {
      console.log(res.data);
      globalTopFive = res.data;
      globalTopFive = globalTopFive[0];
      this.setSearchSuggestions(globalTopFive);
      this.fetchTopFive(res.data[0], res.data[1]);
    }).catch( err => {
      console.error(err);
    });
  }

  // handleDocumentClick = event => {
  //   console.log(event.target.className);
  //   if(event.target.className === 'elip' || event.target.className === 'productImageV2' || event.target.className === 'imV2'){
  //     // let inde = parseInt(event.target.name);
  //     console.log(event.target.name);
  //     console.log(parseInt(event.target.name));
  //     this.setState({ showResultModal: true });
  //   }
  // };

  handleSearchTerm = e => {
    if(e.target !== undefined){
      e = e.target.value;
    }else if(globalCurrentSearchTermFlag !== ''){
      return;
    }
    this.setState({
      searchTerm: e
    }, () => {
      if(this.state.searchTerm === ''){
        this.setSearchSuggestions(globalTopFive);
      }else{
        axios.post('/searchTermSuggestions', { searchTerm: this.state.searchTerm.toLowerCase()})
        .then( res => {
          console.log(res.data);
          this.setSearchSuggestions(res.data);
        }).catch( err => {
          console.error(err);
        });
      }

    });
  };

// fetchStartPageContent(html){
//   console.log(html.data);
// }

  fetchStartPageContent(html){
    // console.log('Cheerio is working on Start Page...');
    // const $ = cheerio.load(html);
    // let carouselInner = ``;
    // $('div._37vuDR').each( (i, ele) => {
    //
    //   let src = $(ele).find('img._2VeolH').attr('src');
    //   let link = $(ele).find('a._3MPlks').attr('href');
    //   if(src === undefined || src === "#" || src === ''){
    //     console.log(src);
    //     console.log('SRC FAILED!');
    //     return;
    //   }else{
    //     src = src.replace(src.substring(35, src.indexOf("image")), "/3376/560/");
    //   }
    //   if(link === undefined || link === '#' || link === ''){
    //     console.log('LINK FAILED!')
    //     return;
    //   }else{
    //     link = 'https://www.flipkart.com' + link;
    //     console.log(link);
    //     console.log(src);
    //   }
    //   if(i === 0){
    //     carouselInner +=        `<div class="carousel-item active">
    //                                 <a href = ${link} target = "_blank" rel="noopener noreferrer">
    //                                 <img src=${src} alt="CarouselImage"/>
    //                                 </a>
    //                               </div>
    //                                   `;
    //   }else{
    //     carouselInner +=        `<div class="carousel-item">
    //                                 <a href = ${link} target = "_blank" rel="noopener noreferrer">
    //                                 <img src=${src} alt="CarouselImage"/>
    //                                 </a>
    //                               </div>
    //                                   `;
    //   }
    //
    //   });
    // if(carouselInner === ``){
    //   carouselInner = `
    //                     <div class = "carousel-item active no-ads">
    //                       <span class = "ad-span">GET THE BEST PRODUCTS EASY AND FAST FROM THIS APPLICATION</span>
    //                     </div>
    //                     <div class = "carousel-item no-ads">
    //                       <span class = "ad-span">WE CURRENTLY RESEARCH THROUGH AMAZON, FLIPKART AND SNAPDEAL</span>
    //                     </div>
    //                   `;
    // }
    document.getElementById('startContentCarousel').innerHTML = `
                                                                <div class="carousel-inner">
                                                                  ${html}
                                                                </div>

                                                                <a class="carousel-control-prev" role="button" href="#startContentCarousel" data-slide = "prev">
                                                                  <span aria-hidden="true" class="carousel-control-prev-icon"></span>
                                                                  <span class="sr-only">Previous</span>
                                                                </a>

                                                                <a class="carousel-control-next" role="button" href="#startContentCarousel" data-slide = "next">
                                                                  <span aria-hidden="true" class="carousel-control-next-icon"></span>
                                                                  <span class="sr-only">Next</span>
                                                                </a>`;
  }

  setSearchSuggestions = dataLocal => {
    let searchSuggestionsAdder = ``;
    for(let i = 0; i < dataLocal.length; i++){
      if(dataLocal[i].searchTerm !== this.state.searchTerm.toLowerCase()){
        searchSuggestionsAdder += `<option value="${dataLocal[i].searchTerm.charAt(0).toUpperCase()+dataLocal[i].searchTerm.slice(1)}"></option>`;
        // searchSuggestionsAdder +=  `<div class ="suggestionListElement">${dataLocal[i].searchTerm.charAt(0).toUpperCase()+dataLocal[i].searchTerm.slice(1)}</div><br/>`
      }
    }
    if(document.getElementById('searchSuggestions').innerHTML !== searchSuggestionsAdder){
      document.getElementById('searchSuggestions').innerHTML = searchSuggestionsAdder;
    }
  };




  fetchTopFive(dataLocal, imgSrc){
    // let proxyUrl = 'https://gunachand-proxy.herokuapp.com/';
    let topFiveAdder = ``;
    // let imgSrc = [];
    // const dataLocalPromises = dataLocal.map( async(item,i) => {
    //   let topFiveUrl = 'https://www.amazon.in/s?k=' + item.searchTerm.split(' ').join('+') + '&ref=nb_sb_noss_2';
    //   try{
    //     this.topFiveHtml = axios.get(proxyUrl + topFiveUrl);
    //     imgSrc[i] = this.topFiveImageRetrieval(await this.topFiveHtml);
    //   }catch{
    //     console.log('TRYING AGAIN');
    //     try{
    //     this.topFiveHtml = axios.get(proxyUrl + topFiveUrl);
    //     imgSrc[i] = this.topFiveImageRetrieval(await this.topFiveHtml);
    //     }catch{
    //       console.log('DOUBLE TRY FAILED!');
    //     }
    //   }
    //
    //   if(await imgSrc[i] === undefined || await imgSrc[i] === null || await imgSrc[i].length < 10){
    //     console.log('NOSRC', imgSrc[i]);
    //     imgSrc[i] = noImg;
    //   }else{
    //     console.log('SRC', imgSrc[i]);
    //   }
    // });
    // Promise.all(dataLocalPromises).then(() => {

      document.getElementById('top5Content').innerHTML = '';

      imgSrc.forEach((src, i) => {
        if(src === undefined){
          src = noImg;
        }
        topFiveAdder = `
                    <div class = "col col-item">
                      <div class = "col-item-inner">
                        <div class = "topFiveHeight"><span class="largeImagehelper"></span><img src = ${src} alt = 'img' class = "topFiveImg"/></div>
                        <div class = "topFiveImgTitle">${dataLocal[i].searchTerm}</div>
                      </div>
                    </div>
                    `;
        document.getElementById('top5Content').innerHTML += topFiveAdder;
      });


      $(".col-item-inner").map((index, ele) => {
        console.log(dataLocal[index].searchTerm, ele);
        $(ele).bind( "click",() => this.dropdownCall(dataLocal[index].searchTerm));
        return 1;
      });
    // }).catch(err => {
    //   console.log(err);
    // });

  }

  // topFiveImageRetrieval(html){
  //   console.log('Cheerio is working on top five, Data is being Retrieved...');
  //   if(html === undefined || html.data === undefined){
  //     return 0;
  //   }else{
  //     const $ = cheerio.load(html.data);
  //
  //     return $('div.s-result-list div.s-result-item').first().find('a.a-link-normal img').attr('src')
  //
  //   }
  // }

/*
  fetchAmazon(html){
    this.setState({head : 'Amazon.com'});
    console.log(this.state.head);
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

  deepFlipkart(html){
    const $ = cheerio.load(html);
    this.setState({head : `Flipkart.com(${++flipCount} Pages)`});
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
      }else{
        img.push(noImg);
      }
    }

    let name = $('div._3aS5mM p').first().text();
    return [rating, img[0].replace(/\/128/g, '/416'), ratingCount, name, price, brand, img];
  }

  fetchFlipkart(html){
    this.setState({head : 'Flipkart.com'});
    console.log('Cheerio is working on Flipkart, Data is being Retrieved...');
    // let pageCounter = 0;
    if(html === undefined || html.data === undefined){
      return true;
    }else{
      const $ = cheerio.load(html.data);
      let category = $('a._32ZSYo').first().text();
      if(category !== undefined && category.length > 2){
      this.setState({category : category });
      }
      else{
        this.setState({category : 'UNABLE TO DETECT' });
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
                  let proxyUrl = 'https://gunachand-proxy.herokuapp.com/';

                  promises.push(axios.get(proxyUrl + link)
                    .then(response => {
                      let temp = this.deepFlipkart(response.data);

                      if(temp === false){
                        return;
                      }

                      let name = temp[3];
                      // let title = temp[3];
                      // if(name.length > 80){
                      //   name = name.slice(0,77) + "...";
                      // }

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
      // });
      console.log(data);
      console.log("Data from flipkart fetched");
      return  Promise.all(promises).then(() => true).catch(() => false);
    }
  }

  fetchSnapDeal(html){
    this.setState({head : 'Snapdeal.com'});
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
        // let title = nam;
        // let name = nam;
        // if(name.length > 80){
        //   name = name.slice(0,77) + "...";
        // }

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
  }*/


  updateResult(){
    let priceVals = window.$("#sliderId").data("ionRangeSlider");
    let websiteChecked = [];
    let ratingChecked = 0;
    if(priceVals.result.min === priceVals.result.from && priceVals.result.max === priceVals.result.to && globalPriceUpdateFlag === false){
      data = fixedData;
    }else{
      if(priceVals.result.min === priceVals.result.from && priceVals.result.max === priceVals.result.to && globalPriceUpdateFlag === true){
        data = fixedData;
        globalPriceUpdateFlag = false;
      }else{
        globalPriceUpdateFlag = true;
        this.updateResultByPrice(priceVals.result.from, priceVals.result.to);
      }
    }

    $(".websiteCheckbox").filter(":checked").each( function(index, ele){
      let web = $(ele).attr("id");
      web = web.replace('Checkbox', '');
      websiteChecked.push(web);
    });

    if(websiteChecked.length !== 0){
      this.updateResultByWebsite(websiteChecked);
    }

    $(".ratingCheckbox").filter(":checked").each( function(index, ele){
      ratingChecked = parseFloat($(ele).attr("id").replace('rating', ''));
    });

    if(ratingChecked !== 0){
      this.updateResultByRating(ratingChecked);
    }

    this.resultInterfaceUpdate();
  }


  updateResultByRating(ratingLocal){
    let temp = data.filter(ele => {
                              let rating = parseFloat(ele.rating);
                              if(rating >= ratingLocal){
                                return true;
                              }
                              return false;
                            });
    data = temp;
  };


  updateResultByPrice(priceMin, priceMax){
    let temp = fixedData.filter(ele => {
                              let price = parseInt(ele.price.replace(/,/g, ''));
                              if(price >= priceMin && price <= priceMax){
                                return true;
                              }
                              return false;
                            });
    data = temp;

  };

  updateResultByWebsite(websiteNames){
    let temp = data.filter(ele => {
                              let web = ele.website.toLowerCase();
                              if(websiteNames.includes(web)){
                                return true;
                              }
                              return false;
                            });
    data = temp;
  };




  displayWebsiteCheckbox(dataLocal){
    document.getElementById('websiteCheckboxDiv').innerHTML = '';
    let webs = new Map();
    dataLocal.forEach((item, i) => {
      let web = item.website.toLowerCase();
      if(webs.has(web)){
        webs.set(web, webs.get(web) + 1);
      }else{
        webs.set(web, 1);
      }
    });
    for(let [key, value] of webs){
      document.getElementById('websiteCheckboxDiv').innerHTML += `<div class = "custom-control custom-checkbox"><input type="checkbox" id="${key}Checkbox" class="websiteCheckbox custom-control-input">
                                                                  <label title="${key}" for="${key}Checkbox" class="checkboxLabel custom-control-label"><span class = "websiteLabelName">${key}</span><span class = "websiteLabelNameCount"> (${value})</span></label></div>`;
    }
    $(".websiteCheckbox").map((index, ele) => {
      $(ele).bind("click", () => this.updateResult(Array.from(webs.keys())[index]));
      return 1;
    });
  }


  rank(){



    data.sort(function (a, b) {
      return b.rating - a.rating;
    });

    let count = 0

    for(let i = 0; i < data.length; i++){
      if(data[i].rating >= 3.0){
        count++;
      }
    }
    // console.log('data : ',data);
    var data1 = data.slice(0,count);

    if(data1.length > 1){
      data1.sort(function (a, b) {
        return b.ratingCount - a.ratingCount;
      });
    }


    // let lowerTitle = '';
    // let i = 0;
    // let tempMatched = [];
    // let tempUnmatched = [];
    // let flagT = false;
    // let flagMin = true;
    // let queryArray = this.state.searchTerm.split(' ');
    // while( i < data1.length){
    //   lowerTitle = data1[i].title.toLowerCase();
    //   flagT = false;
    //   flagMin = true;
    //   for(let j = 0; j < queryArray.length; j++){
    //     if(lowerTitle.includes(queryArray[j].toLowerCase())){
    //       flagT = true;
    //     }else{
    //       flagMin = false;
    //     }
    //
    //     if(j === queryArray.length-1){
    //       if(flagMin){
    //         i++;
    //       }else if (flagT === false) {
    //         let t = data1[i];
    //         data1.splice(i, 1);
    //         tempUnmatched.push(t);
    //       }else if (flagT === true && flagMin === false) {
    //         let t = data1[i];
    //         data1.splice(i, 1);
    //         tempMatched.push(t);
    //       }
    //     }
    //   }
    // }

    // if(tempMatched.length > 0){
    //   data1.push(...tempMatched);
    // }
    // if(tempUnmatched.length > 0){
    //   data1.push(...tempUnmatched);
    // }

    // console.log('data1 : ',data1);
    var data2 = data.slice(count,);
    // console.log('data2 : ',data2);
    if(data2.length > 0){
      data1.push(...data2);
    }
    // console.log('data1 : ',data1);
    data = data1;
    // console.log('data : ',data);
  }

  timeoutMsgTrigger = e => {
    this.setState({
      timeoutMsg: e
    }, () => {
      document.getElementById('timeoutToast').style.display = "block";
      setTimeout(() => {
        document.getElementById('timeoutToast').style.display = "none";
      },5000);
    });
  };

  modalImageChange = e => {
    let smallToLargeImageAdder = `<div class = "largeImage"><span class="largeImagehelper"></span><img class = "largeImageTag" src = ${e} alt = "NULL"/></div>`;
    document.getElementById('modalLargeImages').innerHTML = smallToLargeImageAdder;
    window.$('.largeImage').zoom({ on:'click' });
  };


  resultBlockClick = e => {
    let idLocal = e;
    let smallImagesAdder = ``;
    // let imagesArray = [];
    // const proxyUrl = 'https://gunachand-proxy.herokuapp.com/';
    if(idLocal.includes('secondary')){
      idLocal = idLocal.replace('secondary', '');
    }
    console.log(idLocal);
    let obj = expandedData.find(o => o.id === idLocal);
    if(obj === undefined){
      obj = data.find(o => o.id === idLocal);

      let largeImagesAdder = `<div class = "largeImage"><img src = ${obj.imageSrc} alt = "NULL"/></div>`;
      smallImagesAdder = `<div class = "smallImage"><span class="largeImagehelper"></span><img src = ${obj.imageSrc} alt = "NULL"/></div>`;
      let itemContentAdder = `<div class = "itemContent">
                                <div class = "modalItemWebsite">${obj.website}</div>
                                <div class = "modalItemTitle"><a href = ${obj.link} target = "_blank">${obj.name}</a></div>
                                <div class = "modalItemPrice">&#8377; ${obj.price}</div>
                                <div class = "modalItemRating"><span class = "modalItemRatingValue">${obj.rating}&#9733;</span> <span class = "modalItemRatingCount">(${obj.ratingCount} ratings)</span></div>
                              </div>`;

      this.setState({ showResultModal: true }, () => {
        document.getElementById('modalSmallImages').innerHTML = smallImagesAdder;
        document.getElementById('modalLargeImages').innerHTML = largeImagesAdder;
        document.getElementById('modalItemContent').innerHTML = itemContentAdder;
        window.$('.largeImage').zoom({ on:'click' });
        // document.getElementById('modalSmallImages').innerHTML = smallImagesAdder;
        // $(".smallImage").map((index, ele) => {
        //   $(ele).bind( "mouseenter",() => {
        //     this.modalImageChange(obj.images[index]);
        //   });
        //   return 1;
        // });
      });


    }else{

      let largeImagesAdder = `<div class = "largeImage"><img src = ${obj.imageSrc.replace(/\/416/g, '/1664')} alt = "NULL"/></div>`;
      obj.images.forEach((item, i) => {
        smallImagesAdder += `
        <div class = "smallImage"><span class="largeImagehelper"></span><img src = ${item} alt = "NULL"/></div>
        `;
      });
      let itemContentAdder = `<div class = "itemContent">
                                <div class = "modalItemWebsite">${obj.website}</div>
                                <div class = "modalItemTitle"><a href = ${obj.link} target = "_blank">${obj.name}</a></div>
                                <div class = "modalItemPrice">&#8377; ${obj.price}</div>
                                <div class = "modalItemRating"><span class = "modalItemRatingValue">${obj.rating}&#9733;</span> <span class = "modalItemRatingCount">(${obj.ratingCount} ratings)</span></div>
                              </div>`;

      this.setState({ showResultModal: true }, () => {
        document.getElementById('modalSmallImages').innerHTML = smallImagesAdder;
        document.getElementById('modalLargeImages').innerHTML = largeImagesAdder;
        document.getElementById('modalItemContent').innerHTML = itemContentAdder;
        window.$('.largeImage').zoom({ on:'click' });
        // document.getElementById('modalSmallImages').innerHTML = smallImagesAdder;
        $(".smallImage").map((index, ele) => {
          $(ele).bind( "mouseenter",() => {
            this.modalImageChange(obj.images[index].replace(/\/128/g, '/1664'));
          });
          return 1;
        });
      });

    }









    /*
    smallImagesAdder = `<div class = "smallImage"><span class="largeImagehelper"></span><img src = ${obj.imageSrc} alt = "NULL"/></div>`;
    let largeImagesAdder = `<div class = "largeImage"><img src = ${obj.imageSrc} alt = "NULL"/></div>`;
    let itemContentAdder = `<div class = "itemContent">
                              <div class = "modalItemWebsite">${obj.website}</div>
                              <div class = "modalItemTitle"><a href = ${obj.link} target = "_blank">${obj.name}</a></div>
                              <div class = "modalItemPrice">&#8377; ${obj.price}</div>
                              <div class = "modalItemRating"><span class = "modalItemRatingValue">${obj.rating}&#9733;</span> <span class = "modalItemRatingCount">(${obj.ratingCount} ratings)</span></div>
                            </div>`;

    this.setState({ showResultModal: true }, () => {
      document.getElementById('modalSmallImages').innerHTML = smallImagesAdder;
      document.getElementById('modalLargeImages').innerHTML = largeImagesAdder;
      document.getElementById('modalItemContent').innerHTML = itemContentAdder;

    });

    if('images' in obj){
      smallImagesAdder = ``;
      obj.images.forEach((item, i) => {
        smallImagesAdder += `
                            <div class = "smallImage"><span class="largeImagehelper"></span><img src = ${item} alt = "NULL"/></div>
                            `;
      });

      document.getElementById('modalSmallImages').innerHTML = smallImagesAdder;
      $(".smallImage").map((index, ele) => {
        $(ele).bind( "mouseenter",() => {
          this.modalImageChange(obj.images[index]);
        });
        return 1;
      });
    }else{
      if(idLocal.includes('amazon')){
        console.log('Inside Amazon small images retrival');
        axios.get(proxyUrl + obj.link)
          .then(res => {
            console.log('retrieved Amazon small images retrival');
            if(res === undefined || res.data === undefined){
              return true;
            }else{
              console.log(res.data);
              const $ = cheerio.load(res.data);
              $('.altImages ul').children().each((i, elem) => {
                if($(elem).hasClass('360IngressTemplate')){
                  return;
                }
                if($(elem).hasClass('template')){
                  return;
                }
                let tempSrc = $(elem).find('img').attr('src');
                tempSrc = tempSrc.replace('._SR38,50_', '');
                tempSrc = tempSrc.replace('._SX38_SY50_CR,0,0,38,50_', '');
                if(tempSrc === undefined){
                  tempSrc = noImg;
                }
                imagesArray.push(tempSrc);
              });


              console.log(imagesArray);
              obj.images = imagesArray;
              expandedData.push(obj);
              if(imagesArray.length > 1){
                smallImagesAdder = ``;
                obj.images.forEach((item, i) => {
                  smallImagesAdder += `
                                      <div class = "smallImage"><span class="largeImagehelper"></span><img src = ${item} alt = "NULL"/></div>
                                      `;
                });

                document.getElementById('modalSmallImages').innerHTML = smallImagesAdder;
                $(".smallImage").map((index, ele) => {
                  $(ele).bind( "mouseenter",() => {
                    this.modalImageChange(obj.images[index]);
                  });
                  return 1;
                });
              }

            }
          }).catch(err => {
            console.log(err);
          });
      }else if (idLocal.includes('snap')) {
        console.log('Inside snapdeal small images retrival');
        axios.get(proxyUrl + obj.link)
          .then(res => {
            console.log('retrieved snapdeal small images retrival');
            if(res === undefined || res.data === undefined){
              return true;
            }else{
              console.log(res.data);
              const $ = cheerio.load(res.data);
              $('#bx-pager-left-image-panel').children().each((i, elem) => {
                let tempSrc = $(elem).find('img').attr('src');
                if(tempSrc === undefined){
                  tempSrc = $(elem).find('img').attr('lazySrc');
                }
                if(tempSrc === undefined){
                  tempSrc = noImg;
                }
                imagesArray.push(tempSrc);
              });


              console.log(imagesArray);
              obj.images = imagesArray;
              expandedData.push(obj);
              if(imagesArray.length > 1){
                smallImagesAdder = ``;
                obj.images.forEach((item, i) => {
                  smallImagesAdder += `
                                      <div class = "smallImage"><span class="largeImagehelper"></span><img src = ${item} alt = "NULL"/></div>
                                      `;
                });

                document.getElementById('modalSmallImages').innerHTML = smallImagesAdder;
                $(".smallImage").map((index, ele) => {
                  $(ele).bind( "mouseenter",() => {
                    this.modalImageChange(obj.images[index]);
                  });
                  return 1;
                });
              }


            }
          }).catch(err => {
            console.log(err);
          });
      }

    }*/


  };


  resultInterfaceUpdate(){
    var resultAdder = ``;
    if(data.length !== 0){

        this.rank();


        data.forEach((log, index) => {
            if(log.imageSrc === undefined){
              log.imageSrc = noImg;
            }
            if(index % 4 === 0 && index !== 1){
              resultAdder += `<div class = "row resultRowV2">`;
            }
            resultAdder +=
                        `<div class = "col resultColV2 resultBlock" name = ${index}>
                          <div class = "rankTagV2" name = ${index} title = "RANK ${index+1}">${index+1}</div>
                            <div class = "test resultImage" id = ${log.id} name = ${index}>
                              <div class = "imV2" name = ${index} title = "${log.title}">

                                  <img src = ${log.imageSrc} alt = "Product Image" name = ${index} class = "productImageV2">
                              </div>
                            </div>
                              <div class = "contenV2" name = ${index}>
                                  <div class = "websiteNameV2" name = ${index}>${log.website}</div>
                                  <div title = "${log.title}" name = ${index} class = "elip resultTitle" id = "${log.id}secondary">${log.name}</div>
                                  <span class = "priceV2" name = ${index}>&#8377; ${log.price}</span>
                                  <p class = "n-ratingsV2" name = ${index}><b class = "ratingV2" name = ${index}>${log.rating}&#9733;</b> (${log.ratingCount} Ratings)</p>
                                  <div class = "goToWebsiteV2" name = ${index}><a href = ${log.link} name = ${index} title = "Open in their website" target = "_blank" class="btn btn-secondary goToWebsiteV2Button">Open in Website</a></div>
                              </div>
                        </div>
                        `;

            if(index+1 !== 1 && index+1 % 4 === 0){
              resultAdder += `</div>`;
            }
          // resultAdder +=
          // `<div class = "resultDiv">
          //     <div class = "rankTag" title = "RANK ${index+1}">${index+1}</div>
          //     <div class = "im" title = "${log.title}" href = ${log.link} target = "_blank">
          //
          //         <a href = ${log.link} target = "_blank"><img src = ${log.imageSrc} alt = "Product Image" class = "productImage"></a>
          //     </div>
          //     <div class = "conten">
          //         <div class = "websiteName">${log.website}</div>
          //         <div class = "productName">${log.name}</div>
          //         <span class = "price">&#8377; ${log.price}</span>
          //         <p class = "n-ratings"><b class = "rating">${log.rating}&#9733;</b> (${log.ratingCount} Ratings)</p>
          //         <div class = "goToWebsite" name = ${index}><a href = ${log.link} name = ${index} title = "Open in their website" target = "_blank" class="btn btn-secondary goToWebsiteButton">Open in Website</a></div>
          //     </div>
          // </div>`;
        });
        document.getElementById('result').innerHTML = resultAdder;

        $(".resultImage").map((index, ele) => {
          // console.log($(ele).attr("id"));
          $(ele).bind( "click",() => this.resultBlockClick($(ele).attr("id")));
          return 1;
        });
        $(".resultTitle").map((index, ele) => {
          // console.log($(ele).attr("id"));
          $(ele).bind( "click",() => this.resultBlockClick($(ele).attr("id")));
          return 1;
        });
      }else{
        document.getElementById('result').innerHTML =
        `<div class = "resultDiv">
            <div class = "no-results">No result found for <b>${globalCurrentSearchTermStable}</b>. <span class = "no-results-2">Please check the spelling or try searching for something else</span></div>
        </div>`;
      }
      this.setState({resultCount : data.length });
  }

  analyse = async (e) => {

    window.scroll({ top: 0, left: 0, behavior: 'smooth'});

    let searchTermMain = this.state.searchTerm;
    //preventing default reloadin
    // if(e !== undefined && e.includes('psaAnchor')){
    //   searchTermMain = e.slice(9,);
    // }else
    if(e !== undefined){
      e.preventDefault();
    }
    // else{
    //   searchTermMain = this.state.searchTerm;
    // }

    // console.log(osVersion, osName, fullBrowserVersion, browserVersion, browserName, mobileVendor, mobileModel, engineName, engineVersion, getUA, deviceType);


    // this.setState({head : 'Loading...'});
    console.log(searchTermMain);

    //triggering the loading animation and hiding the arrow icon
    //Hiding the arrow icon
    // document.getElementById("icon").style.display = "none";
    //Displaying the loading animation
    // document.getElementById("anim").style.display = "block";

    if(globalCurrentSearchTermFlag !== ''){
      this.timeoutMsgTrigger('Searching for '+ globalCurrentSearchTermFlag + ' is under progress!');
    }else{

      if(searchTermMain.trim() === ""){

        alert("Empty Spaces are not accepted!");

        // window.location.reload();
        // window.scrollTo(0,0);
      }
      else{
        globalCurrentSearchTermFlag = searchTermMain;
        globalCurrentSearchTermStable = searchTermMain;
        let timeFlag = false;
        // var resultAdder = ``;
        let timeInterval = setInterval( () => {
          if(this.state.timeCounter > 35 && timeFlag === false){
            this.timeoutMsgTrigger('SLOW INTERNET CONNECTION DETECTED ! ');
            timeFlag = true;
          }
          this.setState({ timeCounter : this.state.timeCounter+1 });
        }, 1000);
        this.setState({ head : 'approx 40 different pages' });
        // flipCount = 0;


        data = [];
        document.getElementById('result').innerHTML = "";
        document.getElementById('result').style.visibility = "hidden";
        document.getElementById('leftResult').style.visibility = "hidden";
        document.getElementById('result').style.opacity = "0";
        document.getElementById('leftResult').style.opacity = "0";
        // document.getElementById('leftResult').overflow = "hidden";

        // document.getElementById('head').style.display = 'block';
        // document.getElementById('head').innerHTML = ``;

        var searchTerm = searchTermMain.trim();
        searchTerm = searchTerm.toLowerCase();
        // var amazonSearchTerm = searchTerm.split(' ').join('+');
        // var flipkartSearchTerm = amazonSearchTerm;
        // var snapDealSearchTerm = searchTerm.split(' ').join('%20');
        //
        // var amazonUrl = 'https://www.amazon.in/s?k=' + amazonSearchTerm + '&ref=nb_sb_noss_2';
        // var flipkartUrl = 'https://www.flipkart.com/search?q=' + flipkartSearchTerm + '&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off';
        // var snapDealUrl = 'https://www.snapdeal.com/search?keyword='+ snapDealSearchTerm;
        // const proxyUrl = 'https://gunachand-proxy.herokuapp.com/';

        document.getElementById('head').style.display = "inline";
        document.getElementById('startContent').style.display = "none";


        // let amazonReturn = false;
        //
        // let flipkartReturn = false;
        //
        // let snapdealReturn = false;
        //
        //
        // try{
        //   this.amazon = axios.get(proxyUrl + amazonUrl);
        //   amazonReturn = this.fetchAmazon(await this.amazon);
        // }catch{
        //   console.log('TRYING AGAIN');
        //   try{
        //     this.amazon = axios.get(proxyUrl + amazonUrl);
        //     amazonReturn = this.fetchAmazon(await this.amazon);
        //   }catch{
        //     console.log('DOUBLE TRY FAILED!');
        //     amazonReturn = true;
        //   }
        // }
        //
        // try{
        //   this.snapdeal = axios.get(proxyUrl + snapDealUrl);
        //   snapdealReturn = this.fetchSnapDeal(await this.snapdeal);
        // }catch{
        //   console.log('TRYING AGAIN');
        //   try{
        //     this.snapdeal = axios.get(proxyUrl + snapDealUrl);
        //     snapdealReturn = this.fetchSnapDeal(await this.snapdeal);
        //   }catch{
        //     console.log('DOUBLE TRY FAILED!');
        //     snapdealReturn = true;
        //   }
        // }
        //
        // try{
        //   this.flipkart = axios.get(proxyUrl + flipkartUrl);
        //   flipkartReturn = this.fetchFlipkart(await this.flipkart);
        // }catch{
        //   console.log('TRYING AGAIN');
        //   try{
        //     this.flipkart = axios.get(proxyUrl + flipkartUrl);
        //     flipkartReturn = this.fetchFlipkart(await this.flipkart);
        //   }catch{
        //     console.log('DOUBLE TRY FAILED!');
        //     flipkartReturn = true;
        //   }
        // }


        // if(await flipkartReturn === true && await amazonReturn === true && await snapdealReturn === true){


        // }


        axios.post('/searchTermsUpdate', { searchTerm: searchTerm})
        .then( res => {

          data = res.data[0];
          expandedData = res.data[1];
          this.setState({ category: res.data[2] });
          fixedData = data;

          this.displayWebsiteCheckbox(data);


          let max = Math.max.apply(Math, data.map(function(ele) { return parseInt(ele.price.replace(/,/g, '')); }));

          window.$("#sliderId").data("ionRangeSlider").update({
                                                                from: 0,
                                                                max: max,
                                                                to: max
                                                            });

            this.resultInterfaceUpdate();


            document.getElementById('head').style.display = "none";
            document.getElementById('result').style.visibility = "visible";
            document.getElementById('leftResult').style.visibility = "visible";
            document.getElementById('result').style.opacity = "1";
            document.getElementById('leftResult').style.opacity = "1";

            clearInterval(timeInterval);
            globalCurrentSearchTermFlag = '';
            this.setState({ timeCounter: 0 });



          // console.log(res.data);
        }).catch( err => {
          console.error(err);
        });

      }
    }
  };


  reloading = e => {

    window.location.reload();
    window.scroll({ top: 0, left: 0, behavior: 'smooth'});
  };



  reportToggle = e =>{

    if(this.reportState === "closed"){
      this.reportState = "open";
      document.getElementById('report').innerHTML = `X`;
      document.getElementById('feedback').classList.remove('closed');

    }else{
      this.reportState = "closed";
      document.getElementById('report').innerHTML = "REPORT";

      document.getElementById('feedback').classList.add('closed');
      document.getElementById('reportEmail').value = "";

      document.getElementById('reportContent').value = "";
      this.setState({ reportContent : '', reportEmail : '' });
    }
  }

  changeReportEmail= event =>{
    this.setState({ reportEmail : event.target.value });
  }

  changeReportContent = event =>{
    this.setState({ reportContent : event.target.value });
  }


  sendReport = e =>{
    e.preventDefault();

    if(this.state.reportContent.trim() === ''){
      alert('Description must not be empty !');
    }else{
      let device_details = `<span style = "color : gray;"><b><u>DEVICE DETAILS :</u><br/>OS : </b>` + osName + ' ' + osVersion + `<br/><b>Browser : </b>` + browserName + ' ' + fullBrowserVersion + `<br/><b>Device Type : </b>` + deviceType + `<br/><b>User Agent : </b>` + getUA + `<br/><b>Engine Name : </b>` + engineName + `</span>`;

      window.emailjs.send("gmail", "PSATemplate", {"from_name":this.state.reportEmail,"message_html": this.state.reportContent,"device_details":device_details})
      .then(res => {
        // document.getElementById('report').innerHTML = `SUCCESSFULLY REPORTED <b>X</b>`;
        this.timeoutMsgTrigger('Reported Succesfully');
        this.reportToggle();
        console.log("EMAIL SENT !");
      })
      .catch(err => {
        console.log("Error : ", err);
        this.timeoutMsgTrigger('Report unsuccesful! Please try again.')
      });
    }
  }

  aboutExpand = e =>{
    e.preventDefault();
    if(this.aboutState === "closed"){
      this.aboutState = "open";
      document.getElementById('visibleAbout').style.height = "100%";
      document.getElementById('about').style.color = "white";
      // document.getElementById('home').style.background = "#3f434a";
    } else {
      this.aboutState = "closed";
      document.getElementById('visibleAbout').style.height = "0";
      document.getElementById('about').style.color = "gray";
      // document.getElementById('home').style.background = "#036382";
    }
  }

  // aboutClose = e =>{
  //   e.preventDefault();
  //   this.aboutState = "closed";
  //   document.getElementById('visibleAbout').style.height = "0";
  //   document.getElementById('about').style.background = "#3f434a";
    // document.getElementById('home').style.background = "#036382";
  // }

  // up = e =>{
  //     e.preventDefault();
  //     window.scrollTo(0,0);
  // }

  dropdownCall = async(e) => {
    await this.handleSearchTerm(e);
    this.analyse();
  };


  handleDropdownClick = async(e) => {
    // document.getElementById('dropOut1').classList.add('dropOutClose');
    document.getElementById('dropOut1').style.display = 'none';
    setTimeout(function () {
      // document.getElementById('dropOut1').classList.remove('dropOutClose');
      document.getElementById('dropOut1').style.display = 'block';
    }, 1000);
    // document.getElementById('dropOut1').classList('0');
    await this.handleSearchTerm(e);
    this.analyse();
  }

  //Main Method that renders all the HTML
  render(){
    // const mobiles = (
    //   <Menu>
    //     <MenuItemGroup title="MOBILES" key="2">
    //       <MenuItem key="1"><div onClick = {() => this.dropdownCall('iPhone')}>iPhone</div></MenuItem>
    //       <MenuItem key="2"><div onClick = {() => this.dropdownCall('Samsung')}>Samsung</div></MenuItem>
    //       <MenuItem key="3"><div onClick = {() => this.dropdownCall('Oneplus')}>OnePlus</div></MenuItem>
    //       <MenuItem key="4"><div onClick = {() => this.dropdownCall('Pixel')}>Pixel</div></MenuItem>
    //       <MenuItem key="5"><div onClick = {() => this.dropdownCall('Redmi')}>Redmi</div></MenuItem>
    //       <MenuItem key="6"><div onClick = {() => this.dropdownCall('Realme')}>RealMe</div></MenuItem>
    //       <MenuItem key="7"><div onClick = {() => this.dropdownCall('Oppo')}>Oppo</div></MenuItem>
    //       <MenuItem key="8"><div onClick = {() => this.dropdownCall('Vivo')}>Vivo</div></MenuItem>
    //     </MenuItemGroup>
    //   </Menu>
    // );
    // const laptops = (
    //   <Menu>
    //     <MenuItem key="1"><div onClick = {() => this.dropdownCall('Dell laptop')}>Dell</div></MenuItem>
    //     <MenuItem key="2"><div onClick = {() => this.dropdownCall('Lenovo')}>Lenovo</div></MenuItem>
    //     <MenuItem key="3"><div onClick = {() => this.dropdownCall('Macbook')}>Mac</div></MenuItem>
    //     <MenuItem key="4"><div onClick = {() => this.dropdownCall('Surface')}>Surface</div></MenuItem>
    //     <MenuItem key="5"><div onClick = {() => this.dropdownCall('Asus')}>Asus</div></MenuItem>
    //     <MenuItem key="6"><div onClick = {() => this.dropdownCall('HP laptop')}>HP</div></MenuItem>
    //     <MenuItem key="7"><div onClick = {() => this.dropdownCall('Acer')}>Acer</div></MenuItem>
    //     <MenuItem key="8"><div onClick = {() => this.dropdownCall('Gaming laptop')}>Gaming</div></MenuItem>
    //   </Menu>
    // );
    // const men = (
    //   <Menu>
    //     <MenuItem key="1"><div onClick = {() => this.dropdownCall('Men shirt')}>Shirts</div></MenuItem>
    //     <MenuItem key="2"><div onClick = {() => this.dropdownCall('Men pant')}>Pants</div></MenuItem>
    //     <MenuItem key="3"><div onClick = {() => this.dropdownCall('Men tshirt')}>T-shirts</div></MenuItem>
    //     <MenuItem key="4"><div onClick = {() => this.dropdownCall('Men inner wear')}>Inner wear</div></MenuItem>
    //     <MenuItem key="5"><div onClick = {() => this.dropdownCall('Men shoes')}>Shoes</div></MenuItem>
    //     <MenuItem key="6"><div onClick = {() => this.dropdownCall('Men sneakers')}>Sneakers</div></MenuItem>
    //     <MenuItem key="7"><div onClick = {() => this.dropdownCall('Men watch')}>Watches</div></MenuItem>
    //     <MenuItem key="8"><div onClick = {() => this.dropdownCall('Trimmer')}>Trimmers</div></MenuItem>
    //     <MenuItem key="9"><div onClick = {() => this.dropdownCall('Men wallet')}>Wallet</div></MenuItem>
    //   </Menu>
    // );
    // const women = (
    //   <Menu>
    //     <MenuItem key="1"><div onClick = {() => this.dropdownCall('Saree')}>Sarees</div></MenuItem>
    //     <MenuItem key="2"><div onClick = {() => this.dropdownCall('Women kurta')}>Kurtas & Kurtis</div></MenuItem>
    //     <MenuItem key="3"><div onClick = {() => this.dropdownCall('Women tshirt')}>T-shirts</div></MenuItem>
    //     <MenuItem key="4"><div onClick = {() => this.dropdownCall('Women jeans')}>Jeans</div></MenuItem>
    //     <MenuItem key="5"><div onClick = {() => this.dropdownCall('Legging')}>Leggings</div></MenuItem>
    //     <MenuItem key="6"><div onClick = {() => this.dropdownCall('Women inner wear')}>Inner wear</div></MenuItem>
    //     <MenuItem key="7"><div onClick = {() => this.dropdownCall('Women shoes')}>Shoes</div></MenuItem>
    //     <MenuItem key="8"><div onClick = {() => this.dropdownCall('Handbag')}>Handbags</div></MenuItem>
    //     <MenuItem key="9"><div onClick = {() => this.dropdownCall('Women watch')}>Watches</div></MenuItem>
    //     <MenuItem key="10"><div onClick = {() => this.dropdownCall('Make up kit')}>Make up</div></MenuItem>
    //   </Menu>
    // );
    // const tvsAndAppliances = (
    //   <Menu>
    //     <MenuItem key="1"><div onClick = {() => this.dropdownCall('TV')}>TV</div></MenuItem>
    //     <MenuItem key="2"><div onClick = {() => this.dropdownCall('Refrigerator')}>Refrigerators</div></MenuItem>
    //     <MenuItem key="3"><div onClick = {() => this.dropdownCall('Air conditioner')}>Air Conditioners(AC)</div></MenuItem>
    //     <MenuItem key="4"><div onClick = {() => this.dropdownCall('Microwave oven')}>Microwave Ovens</div></MenuItem>
    //     <MenuItem key="5"><div onClick = {() => this.dropdownCall('Inverter')}>Inverters</div></MenuItem>
    //     <MenuItem key="6"><div onClick = {() => this.dropdownCall('Iron')}>Irons</div></MenuItem>
    //     <MenuItem key="7"><div onClick = {() => this.dropdownCall('Fan')}>Fans</div></MenuItem>
    //     <MenuItem key="8"><div onClick = {() => this.dropdownCall('Washing machine')}>Washing machines</div></MenuItem>
    //   </Menu>
    // );
    // const babyAndKids = (
    //   <Menu>
    //     <MenuItem key="1"><div onClick = {() => this.dropdownCall('Kids boys clothing')}>Boys clothing</div></MenuItem>
    //     <MenuItem key="2"><div onClick = {() => this.dropdownCall('Kids girls clothing')}>Girls clothing</div></MenuItem>
    //     <MenuItem key="3"><div onClick = {() => this.dropdownCall('Kids boys footwear')}>Boys footwear</div></MenuItem>
    //     <MenuItem key="4"><div onClick = {() => this.dropdownCall('Kids girls footwear')}>Girls footwear</div></MenuItem>
    //     <MenuItem key="5"><div onClick = {() => this.dropdownCall('Remote control toys')}>Remote control toys</div></MenuItem>
    //     <MenuItem key="6"><div onClick = {() => this.dropdownCall('Educational toys')}>Educational toys</div></MenuItem>
    //     <MenuItem key="7"><div onClick = {() => this.dropdownCall('School bag')}>School bags</div></MenuItem>
    //     <MenuItem key="8"><div onClick = {() => this.dropdownCall('Diaper')}>Diapers</div></MenuItem>
    //     <MenuItem key="9"><div onClick = {() => this.dropdownCall('Baby food')}>Baby food</div></MenuItem>
    //   </Menu>
    // );
    //
    // const homeAndFurniture = (
    //   <Menu>
    //     <MenuItem key="1"><div onClick = {() => this.dropdownCall('Kitchen tools')}>Kitchen tools</div></MenuItem>
    //     <MenuItem key="2"><div onClick = {() => this.dropdownCall('Pressure cooker')}>Pressure cookers</div></MenuItem>
    //     <MenuItem key="3"><div onClick = {() => this.dropdownCall('Dinner set')}>Dinner set</div></MenuItem>
    //     <MenuItem key="4"><div onClick = {() => this.dropdownCall('Water bottle')}>Water bottles</div></MenuItem>
    //     <MenuItem key="5"><div onClick = {() => this.dropdownCall('Bed')}>Beds</div></MenuItem>
    //     <MenuItem key="6"><div onClick = {() => this.dropdownCall('Sofa')}>Sofa</div></MenuItem>
    //     <MenuItem key="7"><div onClick = {() => this.dropdownCall('Lamp')}>Lamps</div></MenuItem>
    //     <MenuItem key="8"><div onClick = {() => this.dropdownCall('Dining table')}>Dining table</div></MenuItem>
    //     <MenuItem key="9"><div onClick = {() => this.dropdownCall('Gardening tool')}>Gardening tools</div></MenuItem>
    //     <MenuItem key="10"><div onClick = {() => this.dropdownCall('Wardrobe')}>Wardrobes</div></MenuItem>
    //     <MenuItem key="11"><div onClick = {() => this.dropdownCall('Blanket')}>Blankets</div></MenuItem>
    //     <MenuItem key="12"><div onClick = {() => this.dropdownCall('Clock')}>Clocks</div></MenuItem>
    //   </Menu>
    // );
    // const sportsBooksAndMore = (
    //   <Menu>
    //     <MenuItem key="1"><div onClick = {() => this.dropdownCall('Cricket gear')}>Cricket gear</div></MenuItem>
    //     <MenuItem key="2"><div onClick = {() => this.dropdownCall('Badminton gear')}>Badminton gear</div></MenuItem>
    //     <MenuItem key="3"><div onClick = {() => this.dropdownCall('Football gear')}>Football gear</div></MenuItem>
    //     <MenuItem key="4"><div onClick = {() => this.dropdownCall('Cycling gear')}>Cycling gear</div></MenuItem>
    //     <MenuItem key="5"><div onClick = {() => this.dropdownCall('Cardio equipment')}>Cardio equipment</div></MenuItem>
    //     <MenuItem key="6"><div onClick = {() => this.dropdownCall('Protein supplements')}>Protein supplements</div></MenuItem>
    //     <MenuItem key="7"><div onClick = {() => this.dropdownCall('Dry fruits')}>Dry fruits</div></MenuItem>
    //     <MenuItem key="8"><div onClick = {() => this.dropdownCall('Pens')}>Pens</div></MenuItem>
    //     <MenuItem key="9"><div onClick = {() => this.dropdownCall('Diary')}>Diaries</div></MenuItem>
    //     <MenuItem key="10"><div onClick = {() => this.dropdownCall('Helmet')}>Helmets</div></MenuItem>
    //     <MenuItem key="11"><div onClick = {() => this.dropdownCall('Hot water bag')}>Hot water bags</div></MenuItem>
    //     <MenuItem key="12"><div onClick = {() => this.dropdownCall('Gaming console')}>Gaming consoles</div></MenuItem>
    //     <MenuItem key="13"><div onClick = {() => this.dropdownCall('PS4 Games')}>PS4 Games</div></MenuItem>
    //   </Menu>
    // );
    // if (isMobile){
    //   return(<div className = "errorBody"><div className = "isMobile"><h5 className= "errorHead">MOBILE VERSION COMING SOON...</h5><br/>Switch to <span className = "desktopMode">Desktop Mode<span className = "emoji" role="img" aria-labelledby = "jsx-a11y/accessible-emoji">&#128161;</span></span><br/></div><span className = "faDesktop"><FaDesktop /></span></div>)
    // }else{
    return(
        <div id = "App" className="App">

          <div className="moveToTop" title = "Go to top" id = "moveToTop"><IoMdArrowDropupCircle onClick = {() => window.scroll({ top: 0, left: 0, behavior: 'smooth'}) } className = "upIcon" /></div>

          <div className="topnav" id="myTopnav">
            <div className="home" id = "home" onClick = {() => this.reloading()}>PSA</div>
            <div className = "about" id = "about" onClick = {this.aboutExpand}>about</div>
            {/*<div className="colorSwitch" onClick = {this.colorSwitch} title = {"Press this to switch to " + this.state.colorMode}>{this.state.colorMode}</div>*/}


            <div className = "App-form" id = "App-form">

              {/*Calling analyse function on submitting the form*/}
              <form id = "textForm" className = "textForm" onSubmit = {this.analyse}>
                <input type="text" name = "searchTerm" list = "searchSuggestions" value = {this.state.searchTerm} onChange = {this.handleSearchTerm} placeholder = "Search for products" className = "nameInput" id = "nameInput" spellCheck = "false" title = "Enter the product name that you want to research about" autoComplete = "off" required/>
                {/*<div id = "searchSuggestions" className = "searchSuggestions" style ={{ display: 'none' }}>

                </div>*/}
                <datalist id = "searchSuggestions">

                </datalist>
              </form>

              {/*Linking the button to the form*/}
              <button form = "textForm" type="submit" className="submitButton" id = "submitButton">
                {/*Arrow icon in the button*/}
              <FiSearch className = "icon" id = "icon"/>
              </button>
            </div>

          </div>
          <div className = "downNav">
            <div className = "downNav-inner1">
              <div className = "downNav-inner2">
                <div className = "downNavDropdown drop1">
                  <span className = "dropHead">
                    electronics
                    <i className="down"></i>
                  </span>
                  <div className="dropOut drop2Out" id = "dropOut1">
                    <div className="dropIn drop2In">
                      <div className="dropInBatch">
                        <div className="dropItemHead" onClick = {() => this.handleDropdownClick('Laptops')}><div>Mobiles</div></div>
                        <div className="dropItem"><div>Apple</div></div>
                        <div className="dropItem"><div>Samsung</div></div>
                        <div className="dropItem"><div>OnePlus</div></div>
                        <div className="dropItem"><div>Pixel</div></div>
                        <div className="dropItem"><div>Mi</div></div>
                        <div className="dropItem"><div>Realme</div></div>
                        <div className="dropItem"><div>Oppo</div></div>
                        <div className="dropItem"><div>Vivo</div></div>
                        <div className="dropItem"><div>Honor</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>iPhone 11 Pro max</div></div>
                        <div className="dropItem"><div>OnePlus 7T pro</div></div>
                        <div className="dropItem"><div>Asus ROG II</div></div>
                        <div className="dropItem"><div>Samsung S20 Ultra</div></div>
                        <div className="dropItem"><div>Redmi 8A</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItemHead"><div>Mobile Accessories</div></div>
                        <div className="dropItem"><div>Mobile Cases</div></div>
                        <div className="dropItem"><div>Earphones</div></div>
                        <div className="dropItem"><div>Headsets</div></div>
                        <div className="dropItem"><div>Bluetooth Headphones</div></div>
                        <div className="dropItem"><div>Power Banks</div></div>
                        <div className="dropItem"><div>Screenguards</div></div>
                        <div className="dropItem"><div>Memory Cards</div></div>
                        <div className="dropItem"><div>Mobile Cables</div></div>
                        <div className="dropItem"><div>Mobile Chargers</div></div>
                        <div className="dropItemHead"><div>Smart Wearable Tech</div></div>
                        <div className="dropItem"><div>Smart Watches</div></div>
                        <div className="dropItem"><div>VR Headset</div></div>
                        <div className="dropItem"><div>Smart Bands</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItemHead"><div>Laptops</div></div>
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Alienware</div></div>
                        <div className="dropItemHead"><div>Games & Accessories</div></div>
                        <div className="dropItem"><div>PlayStation</div></div>
                        <div className="dropItem"><div>Xbox</div></div>
                        <div className="dropItem"><div>Gaming Consoles</div></div>
                        <div className="dropItem"><div>Gaming Laptops</div></div>
                        <div className="dropItem"><div>Games</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItemHead"><div>Computer Accessories</div></div>
                        <div className="dropItem"><div>External Hard Disks</div></div>
                        <div className="dropItem"><div>Pendrives</div></div>
                        <div className="dropItem"><div>Laptop Skins</div></div>
                        <div className="dropItem"><div>Laptop Bags</div></div>
                        <div className="dropItem"><div>Mouse</div></div>
                        <div className="dropItem"><div>Keyboard</div></div>
                        <div className="dropItem"><div>CPU</div></div>
                        <div className="dropItemHead"><div>Speakers</div></div>
                        <div className="dropItem"><div>Home Audio Speakers</div></div>
                        <div className="dropItem"><div>Home Theatres</div></div>
                        <div className="dropItem"><div>Soundbars</div></div>
                        <div className="dropItem"><div>Bluetooth Speakers</div></div>
                        <div className="dropItemHead"><div>Tablets</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItemHead"><div>Smart Home Automation</div></div>
                        <div className="dropItem"><div>Amazon Echo</div></div>
                        <div className="dropItem"><div>Google Home</div></div>
                        <div className="dropItem"><div>Sonos One</div></div>
                        <div className="dropItem"><div>Apple HomePod</div></div>
                        <div className="dropItem"><div>JBL Link 20</div></div>
                        <div className="dropItemHead"><div>Camera & Accessories</div></div>
                        <div className="dropItem"><div>DSLR</div></div>
                        <div className="dropItem"><div>Compact Cameras</div></div>
                        <div className="dropItem"><div>Camera Lens</div></div>
                        <div className="dropItem"><div>Tripods</div></div>
                        <div className="dropItemHead"><div>Health Care Appliances</div></div>
                        <div className="dropItem"><div>BP Monitors</div></div>
                        <div className="dropItem"><div>Weighing Scale</div></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className = "downNavDropdown drop2">
                  <span className = "dropHead">
                    tvs & appliances
                    <i className="down"></i>
                  </span>
                  <div className="dropOut drop2Out">
                    <div className="dropIn drop2In">
                      <div className="dropInBatch">
                        <div className="dropItemHead" onClick = {() => this.handleDropdownClick('Laptops')}><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className = "downNavDropdown drop3">
                  <span className = "dropHead">
                    men
                    <i className="down"></i>
                  </span>
                  <div className="dropOut drop2Out">
                    <div className="dropIn drop2In">
                      <div className="dropInBatch">
                        <div className="dropItemHead" onClick = {() => this.handleDropdownClick('Laptops')}><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className = "downNavDropdown drop4">
                  <span className = "dropHead">
                    women
                    <i className="down"></i>
                  </span>
                  <div className="dropOut drop2Out">
                    <div className="dropIn drop2In">
                      <div className="dropInBatch">
                        <div className="dropItemHead" onClick = {() => this.handleDropdownClick('Laptops')}><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                    </div>
                  </div>
                </div>


                <div className = "downNavDropdown drop6">
                  <span className = "dropHead">
                    baby & kids
                    <i className="down"></i>
                  </span>
                  <div className="dropOut drop2Out">
                    <div className="dropIn drop2In">
                      <div className="dropInBatch">
                        <div className="dropItemHead" onClick = {() => this.handleDropdownClick('Laptops')}><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className = "downNavDropdown drop7">
                  <span className = "dropHead">
                    home & furniture
                    <i className="down"></i>
                  </span>
                  <div className="dropOut drop2Out">
                    <div className="dropIn drop2In">
                      <div className="dropInBatch">
                        <div className="dropItemHead" onClick = {() => this.handleDropdownClick('Laptops')}><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className = "downNavDropdown drop8">
                  <span className = "dropHead">
                    sports, books & more
                    <i className="down"></i>
                  </span>
                  <div className="dropOut drop2Out">
                    <div className="dropIn drop2In">
                      <div className="dropInBatch">
                        <div className="dropItemHead" onClick = {() => this.handleDropdownClick('Laptops')}><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch dropInColorDark">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                      <div className="dropInBatch">
                        <div className="dropItem"><div>Dell</div></div>
                        <div className="dropItem"><div>Lenovo</div></div>
                        <div className="dropItem"><div>Mac</div></div>
                        <div className="dropItem"><div>Surface</div></div>
                        <div className="dropItem"><div>Asus</div></div>
                        <div className="dropItem"><div>HP</div></div>
                        <div className="dropItem"><div>Acer</div></div>
                        <div className="dropItem"><div>Gaming</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/*<div className = "upDiv" onClick = {this.up}>
            <FaArrowUp className = "up" id = "up"/>
          </div>*/}

          <div className = "visibleAbout" id = "visibleAbout">
            <h1>PRODUCT SEARCH AUTOMATION</h1>
            <p>
            This application automates the manual research of a product search in multiple E-Commerce websites.<br/>Automated product research helps users to purchase the best product online saving lots of time and effort while not compromising on quality and considers all the user preferences.<br/><br/><br/><b className = "aboutDiv">This application <br/>- Researches and make comparisions in multiple e-commerce websites based on category.<br/>- Applies user filters and preferences.<br/>- Ranks the products.<br/>- Display them.</b><br/><br/><br/><br/><b><i>~ ~ Researching about a product is now automated ~ ~</i></b><br/>- - - - -
            </p>


            <div onClick = {this.aboutExpand} className = "aboutCloseButton" id = "aboutCloseButton">&times;</div>
          </div>


          <div id = 'startContent' className = 'startContent'>
            <div id="startContentCarousel" className="carousel slide startContentCarousel" data-ride="carousel"></div>

            <div className = "top5Div">
              <h3 className = "top5Heading">Top Searches</h3>
                {/*<Router>
                  <Link to = "/search?q=pants">SEARCH BOOY</Link>
                  <Route exact path="/search" component={productRouteSearch} />
                </Router>*/}
              <hr/>
              <div>
                <div id = "top5Content" className = "row top5Content">
                  <HashLoader
                    css = {override}
                    size = {30}
                    color = {'#000000'}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className = "timeoutToast" id = "timeoutToast" title ="Tap to close" onClick = {() => document.getElementById('timeoutToast').style.display = "none"}>{this.state.timeoutMsg}<span className = "timeoutToastx"><FaTimesCircle className = "timeoutIcon"/></span></div>



          <div id = "head" className = "head">


              <div className='jetbody'>
                <span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                <div className='base'>
                  <span></span>
                  <div className='face'></div>
                </div>
              </div>
              <div className='longfazers'>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <h1 className = 'jettext' title = "Applies only for good internet connection">This will take some time(approx 35 sec). Please be patient.  <u className = "timeCounter">{this.state.timeCounter}sec</u></h1>
              <h1 className = 'jettext2'>Working on <u style = {{color: 'blue', position: 'absolute', marginLeft: '10px'}}>{this.state.head}</u></h1>


          </div>

          <div className = "resultModal">
            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" show={this.state.showResultModal} onHide={() => this.setState({ showResultModal: false })} centered>
              {/*<Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                  Modal heading
                </Modal.Title>
              </Modal.Header>*/}
              <Modal.Body>
                <section className = "modalSection">
                  <div className = "modalSmallImages" id = "modalSmallImages">

                  </div>
                  <div className = "modalLargeImages" id = "modalLargeImages">

                  </div>
                  <div className = "modalItemContent" id = "modalItemContent">

                  </div>
                </section>
              </Modal.Body>
              {/*<Modal.Footer>
                <Button onClick={() => this.setState({ showResultModal: false })}>Close</Button>
              </Modal.Footer>*/}
            </Modal>
          </div>

          {/*The whole result div tag*/}
          <div className = "res" id = "res">




            <div className="leftResult" id = "leftResult">
              <div className = "leftResultMainHead">Filters</div>
              <section className = "leftResultSection">
                <div className = "leftResultHead">CATEGORY</div>
                <div className = "leftResultText category" id = "category"><IoIosArrowForward className = "categoryIcon" /> {this.state.category}</div>
              </section>
              <section className = "leftResultSection">
                <div className = "leftResultHead">PRICE</div>
                <div className = "sliderDiv" title = "Keyboard arrows also work"><input type="text" id="sliderId" /></div>
              </section>
              <section className = "leftResultSection">
                <div className = "leftResultHead">WEBSITES</div>
                <div id = 'websiteCheckboxDiv'></div>
              </section>
              <section className = "leftResultSection">
                <div className = "leftResultHead">RATING</div>
                <div className = "ratingCheckboxDiv">
                  <div className = "custom-control custom-checkbox">
                    <input type="checkbox" id="rating4" className="ratingCheckbox custom-control-input" onClick = {() => this.updateResult()} />
                      <label title="4 star and above" htmlFor="rating4" className="checkboxLabel custom-control-label">
                        4&#9733; & above
                      </label>
                  </div>
                  <div className = "custom-control custom-checkbox">
                    <input type="checkbox" id="rating3" className="ratingCheckbox custom-control-input" onClick = {() => this.updateResult()} />
                      <label title="3 star and above" htmlFor="rating3" className="checkboxLabel custom-control-label">
                        3&#9733; & above
                      </label>
                  </div>
                  <div className = "custom-control custom-checkbox">
                    <input type="checkbox" id="rating2" className="ratingCheckbox custom-control-input" onClick = {() => this.updateResult()} />
                      <label title="2 star and above" htmlFor="rating2" className="checkboxLabel custom-control-label">
                        2&#9733; & above
                      </label>
                  </div>
                  <div className = "custom-control custom-checkbox">
                    <input type="checkbox" id="rating1" className="ratingCheckbox custom-control-input" onClick = {() => this.updateResult()} />
                      <label title="1 star and above" htmlFor="rating1" className="checkboxLabel custom-control-label">
                        1&#9733; & above
                      </label>
                  </div>
                </div>
              </section>
              <div className = "resultCount" id = "resultCount"><span className = "resultCountNumber">{this.state.resultCount}</span> TOTAL RESULTS</div>

            </div>

            <div className= "result" id= "result">
              {/*<Row id = "resultRowV2">
              </Row>*/}
            </div>
          </div>





          <footer id = "footer" className = "footer">
            <div className = "footerTitleAndTop">
              <div className = "footerLogo"><span className = "footerLogoText" onClick = {() => this.reloading()}>PSA</span></div>
              <div className = "footerToTop"><span className = "footerText" onClick = {() => window.scroll({ top: 0, left: 0, behavior: 'smooth'}) }>Return to top <TiArrowSortedUp /></span></div>
            </div>
            <div className = "footerMiddle">
              <div className = "footerCentered"><span className = "footerText" id = "report" onClick = {() => this.reportToggle()}>REPORT</span></div>
              <div className = "footerCentered"><span className = "footerText"  onClick = {this.aboutExpand}>ABOUT</span></div>
              <div className = "footerCentered"><span className = "footerText"><a className = "footerText" href="mailto:gunachand7@gmail.com?Subject=Regarding%20PSA" target="_top">CONTACT</a></span></div>
            </div>
            <div className = "feedback closed" id = "feedback">

                <form onSubmit = {this.sendReport}>
                      <input type = "email" onChange = {this.changeReportEmail} className = "reportEmail" id = "reportEmail" placeholder = "Enter Your email..." autoComplete = "off" spellCheck = "false" required/><br/>
                      <textarea type = "text" onChange = {this.changeReportContent} placeholder = "Description..." className = "reportContent" id = "reportContent" rows = "4" cols = "50" spellCheck = "false" autoComplete = "off" required></textarea><br/>
                      <div className = "reportTerms">
                        <span className = "reportTermsText">By reporting, you agree with our </span>
                        <OverlayTrigger placement="auto" overlay={
                                    <Popover id="popover-basic">
                                      <Popover.Title as="h3">Terms applied for reporting</Popover.Title>
                                      <Popover.Content>
                                        We collect <strong>Device type</strong>, <strong>OS name</strong>, <strong>OS version</strong>, <strong>Browser name</strong>, <strong>Browser version</strong>, <strong>User Agent</strong> and <strong>Engine name</strong> from your device for the better understanding of your report.
                                      </Popover.Content>
                                    </Popover>}>
                          <span className = "reportTermsTrigger">Terms</span>
                        </OverlayTrigger>
                      </div>
                      <input type = "submit" className ="reportButton" value= "REPORT"/>
                </form>

            </div>
            <div className = "copyright" id = "copyright"><span className = "footerYear">&copy; 2020</span>, PRODUCT SEARCH AUTOMATION</div>
          </footer>

        </div>



    )}
  // }
}

//Exporting the main default class
export default ProductSearchAutomation;
