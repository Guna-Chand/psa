import React from 'react';
import './App.css';
import './ResultV2.css';
import noImg from './noImg.jpg';
import { FaTimesCircle } from "react-icons/fa";
import { IoMdArrowDropupCircle, IoIosArrowForward } from "react-icons/io";
import { FiSearch } from "react-icons/fi";
import { TiArrowSortedUp } from "react-icons/ti";
import { isMobile, getUA } from 'react-device-detect';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, OverlayTrigger, Popover } from 'react-bootstrap';
import { HashLoader, BarLoader } from 'react-spinners';
import $ from 'jquery';
import { css } from '@emotion/core';

const axios = require('axios');

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
var zoomCautionFlag = false;

var globalTopFive = [];

class ProductSearchAutomation extends React.Component {

  constructor(props) {
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

      head: '',

      category: 'Not Detected',

      resultCount: 0,

      reportEmail: '',

      reportContent: '',

      searchTerm: ''
    };
    this.handleSearchTerm = this.handleSearchTerm.bind(this);
    this.reloading = this.reloading.bind(this);
    this.dropdownCall = this.dropdownCall.bind(this);
    this.fetchTopFive = this.fetchTopFive.bind(this);
    this.timeoutMsgTrigger = this.timeoutMsgTrigger.bind(this);
    this.setSearchSuggestions = this.setSearchSuggestions.bind(this);
    this.handleDropdownClick = this.handleDropdownClick.bind(this);
  }

  componentDidMount() {

    if (isMobile) {
      document.getElementById('staticPageBackgroundOpacity').style.background = "linear-gradient(to right, rgba(67, 67, 67, 0.6), rgba(0,0,0,0.6))";
      document.getElementById('res').style.minHeight = "300px";
      document.getElementById('aboutTextContentTop1').style.width = "80%";
      document.getElementById('aboutTextHead').style.width = "60%";
      document.getElementById('aboutBackground').style.marginTop = "200px";
      document.getElementById('aboutBackground').style.marginRight = "0";
      document.getElementById('aboutText').style.paddingTop = "0";
      document.getElementById('aboutCloseButton').style.marginTop = "600px";
    }

    window.scroll({ top: 0, left: 0, behavior: 'smooth' });

    window.onscroll = () => {
      let pageOffset = document.documentElement.scrollTop || document.body.scrollTop;
      if (pageOffset > 250) {
        document.getElementById('moveToTop').style.opacity = "1";
        document.getElementById('moveToTop').style.visibility = "visible";
      } else {
        document.getElementById('moveToTop').style.opacity = "0";
        document.getElementById('moveToTop').style.visibility = "hidden";
      }
    };

    try {
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
    } catch (err) {
      console.log(err);
    }
    axios.post('/getVisitCount')
      .then(res => {
        if (res.data !== 'Retrieving...') {
          document.getElementById('totalPageVisits').innerHTML = res.data[0].totalVisits;
        } else {
          document.getElementById('totalPageVisits').innerHTML = res.data;
        }
      }).catch(err => {
        console.error(err);
      });

    axios.post('/getFirstPage')
      .then(res => {
        this.fetchStartPageContent(res.data);
      }).catch(err => {
        console.error(err);
      });

    axios.post('/initialFireup')
      .then(res => {
        globalTopFive = res.data[0];
        this.setSearchSuggestions(globalTopFive);
        this.fetchTopFive(res.data[0], res.data[1]);
      }).catch(err => {
        console.error(err);
      });
  }

  handleSearchTerm = e => {
    if (e.target !== undefined) {
      e = e.target.value;
    } else if (globalCurrentSearchTermFlag !== '') {
      return;
    }
    this.setState({
      searchTerm: e
    }, () => {
      if (this.state.searchTerm === '') {
        this.setSearchSuggestions(globalTopFive);
      } else {
        axios.post('/searchTermSuggestions', { searchTerm: this.state.searchTerm.toLowerCase() })
          .then(res => {
            this.setSearchSuggestions(res.data);
          }).catch(err => {
            console.error(err);
          });
      }

    });
  };

  fetchStartPageContent(html) {
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
    for (let i = 0; i < dataLocal.length; i++) {
      if (dataLocal[i].searchTerm !== this.state.searchTerm.toLowerCase()) {
        searchSuggestionsAdder += `<option value="${dataLocal[i].searchTerm.charAt(0).toUpperCase() + dataLocal[i].searchTerm.slice(1)}"></option>`;
      }
    }
    if (document.getElementById('searchSuggestions').innerHTML !== searchSuggestionsAdder) {
      document.getElementById('searchSuggestions').innerHTML = searchSuggestionsAdder;
    }
  };

  fetchTopFive(dataLocal, imgSrc) {
    let topFiveAdder = ``;

    document.getElementById('top5Content').innerHTML = '';

    imgSrc.forEach((src, i) => {
      topFiveAdder = `
                    <div class = "col col-item">
                      <div class = "col-item-inner">
                        <div class = "topFiveHeight"><span class="largeImagehelper"></span><img src = ${src || noImg} alt = '' class = "topFiveImg"/></div>
                        <div class = "topFiveImgTitle">${dataLocal[i].searchTerm}</div>
                      </div>
                    </div>
                    `;
      document.getElementById('top5Content').innerHTML += topFiveAdder;
    });

    $(".col-item-inner").map((index, ele) => {
      $(ele).bind("click", () => this.dropdownCall(dataLocal[index].searchTerm));
      return 1;
    });
  }

  updateResult() {
    let priceVals = window.$("#sliderId").data("ionRangeSlider");
    let websiteChecked = [];
    let ratingChecked = 0;
    if (priceVals.result.min === priceVals.result.from && priceVals.result.max === priceVals.result.to && globalPriceUpdateFlag === false) {
      data = fixedData;
    } else {
      if (priceVals.result.min === priceVals.result.from && priceVals.result.max === priceVals.result.to && globalPriceUpdateFlag === true) {
        data = fixedData;
        globalPriceUpdateFlag = false;
      } else {
        globalPriceUpdateFlag = true;
        this.updateResultByPrice(priceVals.result.from, priceVals.result.to);
      }
    }

    $(".websiteCheckbox").filter(":checked").each(function (index, ele) {
      let web = $(ele).attr("id");
      web = web.replace('Checkbox', '');
      websiteChecked.push(web);
    });

    if (websiteChecked.length !== 0) {
      this.updateResultByWebsite(websiteChecked);
    }

    $(".ratingCheckbox").filter(":checked").each(function (index, ele) {
      ratingChecked = parseFloat($(ele).attr("id").replace('rating', ''));
    });

    if (ratingChecked !== 0) {
      this.updateResultByRating(ratingChecked);
    }

    this.resultInterfaceUpdate();
  }

  updateResultByRating(ratingLocal) {
    let temp = data.filter(ele => {
      let rating = parseFloat(ele.rating);
      if (rating >= ratingLocal) {
        return true;
      }
      return false;
    });
    data = temp;
  };

  updateResultByPrice(priceMin, priceMax) {
    let temp = fixedData.filter(ele => {
      let price = parseInt(ele.price.replace(/,/g, ''));
      if (price >= priceMin && price <= priceMax) {
        return true;
      }
      return false;
    });
    data = temp;

  };

  updateResultByWebsite(websiteNames) {
    let temp = data.filter(ele => {
      let web = ele.website.toLowerCase();
      if (websiteNames.includes(web)) {
        return true;
      }
      return false;
    });
    data = temp;
  };

  displayWebsiteCheckbox(dataLocal) {
    document.getElementById('websiteCheckboxDiv').innerHTML = '';
    let webs = new Map();
    dataLocal.forEach((item, i) => {
      let web = item.website.toLowerCase();
      if (webs.has(web)) {
        webs.set(web, webs.get(web) + 1);
      } else {
        webs.set(web, 1);
      }
    });
    for (let [key, value] of webs) {
      document.getElementById('websiteCheckboxDiv').innerHTML += `<div class = "custom-control custom-checkbox"><input type="checkbox" id="${key}Checkbox" class="websiteCheckbox custom-control-input">
                                                                  <label title="${key}" for="${key}Checkbox" class="checkboxLabel custom-control-label"><span class = "websiteLabelName">${key}</span><span class = "websiteLabelNameCount"> (${value})</span></label></div>`;
    }
    $(".websiteCheckbox").map((index, ele) => {
      $(ele).bind("click", () => this.updateResult(Array.from(webs.keys())[index]));
      return 1;
    });
  }


  rank() {
    data.sort(function (a, b) {
      return b.rating - a.rating;
    });

    let count = 0

    for (let i = 0; i < data.length; i++) {
      if (data[i].rating >= 3.0) {
        count++;
      }
    }
    var data1 = data.slice(0, count);

    if (data1.length > 1) {
      data1.sort(function (a, b) {
        return b.ratingCount - a.ratingCount;
      });
    }

    var data2 = data.slice(count,);
    if (data2.length > 0) {
      data1.push(...data2);
    }
    data = data1;
  }

  timeoutMsgTrigger = e => {
    this.setState({
      timeoutMsg: e
    }, () => {
      document.getElementById('timeoutToast').style.display = "block";
      setTimeout(() => {
        document.getElementById('timeoutToast').style.display = "none";
      }, 5000);
    });
  };

  modalImageChange = e => {
    let smallToLargeImageAdder = `<div class = "largeImage"><span class="largeImagehelper"></span><img class = "largeImageTag" src = ${e || noImg} alt = "NULL"/></div>`;
    document.getElementById('modalLargeImages').innerHTML = smallToLargeImageAdder;
    window.$('.largeImage').zoom({ on: 'click' });
  };

  resultBlockClick = e => {
    let idLocal = e;
    let smallImagesAdder = ``;
    zoomCautionFlag = false;
    if (idLocal.includes('secondary')) {
      idLocal = idLocal.replace('secondary', '');
    }
    let obj = expandedData.find(o => o.id === idLocal);
    if (obj === undefined) {
      obj = data.find(o => o.id === idLocal);

      let largeImagesAdder = `<div class = "largeImage"><span class="largeImagehelper"></span><img src = ${obj.imageSrc || noImg} class = "largeImageTag" alt = "NULL"/></div>`;
      smallImagesAdder = `<div class = "smallImage"><span class="largeImagehelper"></span><img src = ${obj.imageSrc || noImg} alt = "NULL"/></div>`;
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
        window.$('.largeImage').zoom({ on: 'click' });
        $('.largeImage').bind('click touchstart', () => {
          if (zoomCautionFlag === false) {
            zoomCautionFlag = true;
            document.getElementById('modalItemContent').innerHTML += `<div class = "modalItemContentZoomCaution">Amazon and SnapDeal image dimensions are currently not fit for Zooming.<br/><b>Will be updated soon.</b></div>`;
          }
        });
      });
    } else {
      let largeImagesAdder = `<div class = "largeImage"><span class="largeImagehelper"></span><img class = "largeImageTag" src = ${obj.imageSrc.replace(/\/416/g, '/1664') || noImg} alt = "NULL"/></div>`;
      obj.images.forEach((item, i) => {
        smallImagesAdder += `
        <div class = "smallImage"><span class="largeImagehelper"></span><img src = ${item || noImg} alt = "NULL"/></div>
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
        window.$('.largeImage').zoom({ on: 'click' });
        $(".smallImage").map((index, ele) => {
          $(ele).bind("mouseenter", () => {
            this.modalImageChange(obj.images[index].replace(/\/128/g, '/1664'));
          });
          return 1;
        });
      });
    }
  };

  resultInterfaceUpdate() {
    var resultAdder = ``;
    if (data.length !== 0) {

      this.rank();

      data.forEach((log, index) => {
        if (index % 4 === 0 && index !== 1) {
          resultAdder += `<div class = "row resultRowV2">`;
        }
        resultAdder +=
          `<div class = "col resultColV2 resultBlock" name = ${index}>
                          <div class = "rankTagV2" name = ${index} title = "RANK ${index + 1}">${index + 1}</div>
                            <div class = "test resultImage" id = ${log.id} name = ${index}>
                              <div class = "imV2" name = ${index} title = "${log.title}">
                                  <img src = ${log.imageSrc || noImg} alt = "Product Image" name = ${index} class = "productImageV2">
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

        if (index + 1 !== 1 && index + 1 % 4 === 0) {
          resultAdder += `</div>`;
        }
      });
      document.getElementById('result').innerHTML = resultAdder;

      $(".resultImage").map((index, ele) => {
        $(ele).bind("click", () => this.resultBlockClick($(ele).attr("id")));
        return 1;
      });
      $(".resultTitle").map((index, ele) => {
        $(ele).bind("click", () => this.resultBlockClick($(ele).attr("id")));
        return 1;
      });
    } else {
      document.getElementById('result').innerHTML =
        `<div class = "resultDiv">
            <div class = "no-results">No result found for <b>${globalCurrentSearchTermStable}</b>. <span class = "no-results-2">Please check the spelling or try searching for something else</span></div>
        </div>`;
    }
    this.setState({ resultCount: data.length });
  }

  analyse = async (e) => {

    let searchTermMain = this.state.searchTerm;
    if (e !== undefined) {
      e.preventDefault();
    }

    if (globalCurrentSearchTermFlag !== '') {
      this.timeoutMsgTrigger('Searching for ' + globalCurrentSearchTermFlag + ' is under progress!');
    } else {

      if (searchTermMain.trim() === "") {
        alert("Empty Spaces are not accepted!");
      }
      else {
        globalCurrentSearchTermFlag = searchTermMain;
        globalCurrentSearchTermStable = searchTermMain;
        let timeFlag = false;
        let timeFlag60 = false;
        let timeInterval = setInterval(() => {
          if (this.state.timeCounter > 35 && timeFlag === false) {
            this.timeoutMsgTrigger('SLOW INTERNET CONNECTION DETECTED ! ');
            timeFlag = true;
          }
          if (this.state.timeCounter > 60 && timeFlag60 === false) {
            this.timeoutMsgTrigger('PLEASE RELOAD AND TRY AGAIN ! ');
            timeFlag60 = true;
          }
          this.setState({ timeCounter: this.state.timeCounter + 1 });
        }, 1000);
        this.setState({ head: 'approx 40 different pages' });

        data = [];
        if (isMobile) {
          document.getElementById('res').style.minHeight = "1700px";
        } else {
          document.getElementById('res').style.minHeight = "700px";
        }
        document.getElementById('result').innerHTML = "";
        document.getElementById('result').style.visibility = "hidden";
        document.getElementById('leftResult').style.visibility = "hidden";
        document.getElementById('result').style.opacity = "0";
        document.getElementById('leftResult').style.opacity = "0";

        var searchTerm = searchTermMain.trim();
        searchTerm = searchTerm.toLowerCase();

        document.getElementById('head').style.display = "inline";
        document.getElementById('startContent').style.display = "none";

        $("input:checked").each(function (index, ele) {
          $(ele).prop("checked", false);
        });

        window.scroll({ top: 0, left: 0, behavior: 'smooth' });
        axios.post('/getSearchResults', { searchTerm: searchTerm })
          .then(res => {

            data = res.data[0];
            expandedData = res.data[1];
            this.setState({ category: res.data[2] });
            fixedData = data;

            this.displayWebsiteCheckbox(data);

            let max = Math.max.apply(Math, data.map(function (ele) { return parseInt(ele.price.replace(/,/g, '')); }));

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
          }).catch(err => {
            console.error(err);
            this.timeoutMsgTrigger('NETWORK ERROR ! Retrieval failed, Please try again.');
            data = [];
            expandedData = [];
            this.setState({ category: 'Not Detected' });
            fixedData = data;
            this.displayWebsiteCheckbox(data);
            try {
              window.$("#sliderId").data("ionRangeSlider").update({
                from: 0,
                max: 0,
                to: 0
              });
            } catch (error) {
              console.log(error);
            }
            this.resultInterfaceUpdate();

            document.getElementById('head').style.display = "none";
            document.getElementById('result').style.visibility = "visible";
            document.getElementById('leftResult').style.visibility = "visible";
            document.getElementById('result').style.opacity = "1";
            document.getElementById('leftResult').style.opacity = "1";

            clearInterval(timeInterval);
            globalCurrentSearchTermFlag = '';
            this.setState({ timeCounter: 0 });
          });

      }
    }
  };

  reloading = e => {

    window.location.reload();
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
  };

  reportToggle = e => {

    if (this.reportState === "closed") {
      this.reportState = "open";
      document.getElementById('report').innerHTML = `X`;
      document.getElementById('feedback').classList.remove('closed');

    } else {
      this.reportState = "closed";
      document.getElementById('report').innerHTML = "REPORT";

      document.getElementById('feedback').classList.add('closed');
      document.getElementById('reportEmail').value = "";

      document.getElementById('reportContent').value = "";
      this.setState({ reportContent: '', reportEmail: '' });
    }
  }

  changeReportEmail = event => {
    this.setState({ reportEmail: event.target.value });
  }

  changeReportContent = event => {
    this.setState({ reportContent: event.target.value });
  }

  sendReport = e => {
    e.preventDefault();

    if (this.state.reportContent.trim() === '') {
      alert('Description must not be empty !');
    } else {

      axios.post('/sendReport', { fromName: this.state.reportEmail, messageHtml: this.state.reportContent, userAgent: getUA })
        .then(res => {
          if (res.data === "success") {
            this.timeoutMsgTrigger('Reported Succesfully');
            this.reportToggle();
          } else {
            throw res.data;
          }
        }).catch(err => {
          console.log("Error : ", err);
          this.timeoutMsgTrigger('Report unsuccessful! Please try again.')
        });
    }
  }

  aboutExpand = e => {
    e.preventDefault();
    if (this.aboutState === "closed") {
      this.aboutState = "open";
      document.getElementById('visibleAbout').style.transition = "height 1s, box-shadow 0s";
      document.getElementById('visibleAbout').style.boxShadow = "0px 1px 100px 100px rgba(0,0,0,1)";
      document.getElementById('visibleAbout').style.height = "100%";
      document.getElementById('about').style.color = "white";
    } else {
      this.aboutState = "closed";
      document.getElementById('visibleAbout').style.transition = "height 1s, box-shadow 2s";
      document.getElementById('visibleAbout').style.height = "0";
      document.getElementById('about').style.color = "gray";
      document.getElementById('visibleAbout').style.boxShadow = "0px 0px 0px 0px rgba(0,0,0,0)";
    }
  }

  dropdownCall = async (e) => {
    await this.handleSearchTerm(e);
    this.analyse();
  };


  handleDropdownClick = async (e, id) => {
    document.getElementById(id).style.display = 'none';
    setTimeout(function () {
      document.getElementById(id).style.display = 'block';
    }, 1000);
    await this.handleSearchTerm(e);
    this.analyse();
  }

  //Main Method that renders all the HTML
  render() {
    return (
      <div id="App" className="App">

        <div className="moveToTop" title="Go to top" id="moveToTop"><IoMdArrowDropupCircle onClick={() => window.scroll({ top: 0, left: 0, behavior: 'smooth' })} className="upIcon" /></div>

        <div className="topnav" id="myTopnav">
          <div className="home" id="home" onClick={() => this.reloading()}>PSA</div>
          <div className="about" id="about" onClick={this.aboutExpand}>about</div>

          <div className="App-form" id="App-form">

            {/*Calling analyse function on submitting the form*/}
            <form id="textForm" className="textForm" onSubmit={this.analyse}>
              <input type="text" name="searchTerm" list="searchSuggestions" value={this.state.searchTerm} onChange={this.handleSearchTerm} placeholder="Search for products" className="nameInput" id="nameInput" spellCheck="false" title="Enter the product name that you want to research about" autoComplete="off" required />
              <datalist id="searchSuggestions">

              </datalist>
            </form>

            {/*Linking the button to the form*/}
            <button form="textForm" type="submit" className="submitButton" id="submitButton">
              {/*Arrow icon in the button*/}
              <FiSearch className="icon" id="icon" />
            </button>
          </div>

        </div>
        <div className="downNav">
          <div className="downNav-inner1">
            <div className="downNav-inner2">
              <div className="downNavDropdown drop1">
                <span className="dropHead">
                  electronics
                  <i className="down"></i>
                </span>
                <div className="dropOut drop2Out" id="dropOut1">
                  <div className="dropIn drop2In">
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Smartphones', 'dropOut1')}><div>Mobiles</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('iPhone', 'dropOut1')}><div>Apple</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Samsung phones', 'dropOut1')}><div>Samsung</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Oneplus', 'dropOut1')}><div>OnePlus</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Pixel', 'dropOut1')}><div>Pixel</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Redmi', 'dropOut1')}><div>Mi</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Realme', 'dropOut1')}><div>Realme</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Oppo', 'dropOut1')}><div>Oppo</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Vivo', 'dropOut1')}><div>Vivo</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Honor', 'dropOut1')}><div>Honor</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Asus phones', 'dropOut1')}><div>Asus</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('iPhone 11 pro max', 'dropOut1')}><div>iPhone 11 Pro max</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Oneplus 7T pro', 'dropOut1')}><div>OnePlus 7T pro</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Asus ROG 2', 'dropOut1')}><div>Asus ROG II</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Samsung S20 ultra', 'dropOut1')}><div>Samsung S20 Ultra</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Redmi 8A', 'dropOut1')}><div>Redmi 8A</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Smartphone accessories', 'dropOut1')}><div>Mobile Accessories</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Smartphone cases', 'dropOut1')}><div>Mobile Cases</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Earphones', 'dropOut1')}><div>Earphones</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Headset', 'dropOut1')}><div>Headsets</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Bluetooth Headphones', 'dropOut1')}><div>Bluetooth Headphones</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Power banks', 'dropOut1')}><div>Power Banks</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Smartphone screen guards', 'dropOut1')}><div>Screenguards</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Memory cards', 'dropOut1')}><div>Memory Cards</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Smartphone cables', 'dropOut1')}><div>Mobile Cables</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Smartphone chargers', 'dropOut1')}><div>Mobile Chargers</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Smart Wearable', 'dropOut1')}><div>Smart Wearable Tech</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Smart watches', 'dropOut1')}><div>Smart Watches</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Virtual Reality', 'dropOut1')}><div>VR Headset</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Smart bands', 'dropOut1')}><div>Smart Bands</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Laptops', 'dropOut1')}><div>Laptops</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Dell laptops', 'dropOut1')}><div>Dell</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Macbook', 'dropOut1')}><div>Mac</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Surface laptops', 'dropOut1')}><div>Surface</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Lenovo laptops', 'dropOut1')}><div>Lenovo</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Asus laptops', 'dropOut1')}><div>Asus</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('HP Laptops', 'dropOut1')}><div>HP</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Acer laptops', 'dropOut1')}><div>Acer</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Avita laptops', 'dropOut1')}><div>Avita</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Games and accessories', 'dropOut1')}><div>Games & Accessories</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sony PlayStation', 'dropOut1')}><div>PlayStation</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Microsoft Xbox', 'dropOut1')}><div>Xbox</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Gaming consoles', 'dropOut1')}><div>Gaming Consoles</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Gaming laptops', 'dropOut1')}><div>Gaming Laptops</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Games', 'dropOut1')}><div>Games</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Computer accessories', 'dropOut1')}><div>Computer Accessories</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('External hard disks', 'dropOut1')}><div>External Hard Disks</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Pendrives', 'dropOut1')}><div>Pendrives</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Laptop skins', 'dropOut1')}><div>Laptop Skins</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Laptop bags', 'dropOut1')}><div>Laptop Bags</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Mouse', 'dropOut1')}><div>Mouse</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Keyboard', 'dropOut1')}><div>Keyboard</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('CPU', 'dropOut1')}><div>CPU</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Speakers', 'dropOut1')}><div>Speakers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Home audio system', 'dropOut1')}><div>Home Audio Speakers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Home theater', 'dropOut1')}><div>Home Theatres</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Soundbars', 'dropOut1')}><div>Soundbars</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Bluetooth speakers', 'dropOut1')}><div>Bluetooth Speakers</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Tablets', 'dropOut1')}><div>Tablets</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Smart home automation', 'dropOut1')}><div>Smart Home Automation</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Amazon echo', 'dropOut1')}><div>Amazon Echo</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Google home', 'dropOut1')}><div>Google Home</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sonos', 'dropOut1')}><div>Sonos One</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Apple Homepod', 'dropOut1')}><div>Apple HomePod</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('JBL Link 20', 'dropOut1')}><div>JBL Link 20</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Camera accesories', 'dropOut1')}><div>Camera & Accessories</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('DSLR', 'dropOut1')}><div>DSLR</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Compact cameras', 'dropOut1')}><div>Compact Cameras</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Camera Lens', 'dropOut1')}><div>Camera Lens</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Tripods', 'dropOut1')}><div>Tripods</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Health care appliances', 'dropOut1')}><div>Health Care Appliances</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('BP Monitors', 'dropOut1')}><div>BP Monitors</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Weighing scale', 'dropOut1')}><div>Weighing Scale</div></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="downNavDropdown drop2">
                <span className="dropHead">
                  tvs & appliances
                  <i className="down"></i>
                </span>
                <div className="dropOut drop2Out" id="dropOut2">
                  <div className="dropIn drop2In">
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Tv', 'dropOut2')}><div>Television</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Mi Tv', 'dropOut2')}><div>Mi</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Samsung Tv', 'dropOut2')}><div>Samsung</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('LG Tv', 'dropOut2')}><div>LG</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sony Tv', 'dropOut2')}><div>Sony</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Paanasonic Tv', 'dropOut2')}><div>Panasonic</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Philips Tv', 'dropOut2')}><div>Philips</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Lloyd Tv', 'dropOut2')}><div>Lloyd</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('MarQ Tv', 'dropOut2')}><div>MarQ</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Vu Tv', 'dropOut2')}><div>Vu</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Thomson Tv', 'dropOut2')}><div>Thomson</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('iFFALCON by TCL Tv', 'dropOut2')}><div>iFFALCON by TCL</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('BPL Tv', 'dropOut2')}><div>BPL</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Motorola Tv', 'dropOut2')}><div>Motorola</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead"><div>Shop By Screen Size</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('24 inches Tv', 'dropOut2')}><div>24 inches</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('32 inches Tv', 'dropOut2')}><div>32 inches</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('48 inches Tv', 'dropOut2')}><div>48 inches</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('60 inches Tv', 'dropOut2')}><div>60 inches</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Washing machines', 'dropOut2')}><div>Washing Machine</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Fully Automatic Front Load', 'dropOut2')}><div>Fully Automatic Front Load</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Semi Automatic Top Load', 'dropOut2')}><div>Semi Automatic Top Load</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Fully Automatic Top Load', 'dropOut2')}><div>Fully Automatic Top Load</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Air Conditioners', 'dropOut2')}><div>Air Conditioners</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Inverter AC', 'dropOut2')}><div>Inverter AC</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Split AC', 'dropOut2')}><div>Split AC</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Window AC', 'dropOut2')}><div>Window AC</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('5 Star AC', 'dropOut2')}><div>5 Star AC</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead"><div>Shop By Brand</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Blue Star AC', 'dropOut2')}><div>Blue Star</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Voltas AC', 'dropOut2')}><div>Voltas</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Samsung AC', 'dropOut2')}><div>Samsung</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('LG AC', 'dropOut2')}><div>LG</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('MarQ AC', 'dropOut2')}><div>MarQ</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Lloyd AC', 'dropOut2')}><div>Lloyd</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Hitachi AC', 'dropOut2')}><div>Hitachi</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Panasonic AC', 'dropOut2')}><div>Panasonic</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Daikin AC', 'dropOut2')}><div>Daikin</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Godrej AC', 'dropOut2')}><div>Godrej</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Onida AC', 'dropOut2')}><div>Onida</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Whirlpool AC', 'dropOut2')}><div>Whirlpool</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Toshiba AC', 'dropOut2')}><div>Toshiba</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Carrier AC', 'dropOut2')}><div>Carrier</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Fridge', 'dropOut2')}><div>Refrigerators</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Single Door Refrigerator', 'dropOut2')}><div>Single Door</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Double Door Refrigerator', 'dropOut2')}><div>Double Door</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Triple Door Refrigerator', 'dropOut2')}><div>Triple Door</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sde by side Refrigerator', 'dropOut2')}><div>Side By Side</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Convertible Refrigerator', 'dropOut2')}><div>Convertible</div></div>
                      <div className="dropItemHead"><div>Shop By Brand</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Samsung Fridge', 'dropOut2')}><div>Samsung</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('LG Fridge', 'dropOut2')}><div>LG</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Whirlpool Fridge', 'dropOut2')}><div>Whirlpool</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('MarQ Fridge', 'dropOut2')}><div>MarQ</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Bosch Fridge', 'dropOut2')}><div>Bosch</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('BPL Fridge', 'dropOut2')}><div>BPL</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Panasonic Fridge', 'dropOut2')}><div>Panasonic</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Haier Fridge', 'dropOut2')}><div>Haier</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Kitchen Appliances', 'dropOut2')}><div>Kitchen Appliances</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Microwave Ovens', 'dropOut2')}><div>Microwave Ovens</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Oven Toaster grills', 'dropOut2')}><div>Oven Toaster grills (OTG)</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Electric Kettle', 'dropOut2')}><div>Electric Kettle</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Electric Cookers', 'dropOut2')}><div>Electric Cookers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Pressure Cookers', 'dropOut2')}><div>Pressure Cookers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Chimneys', 'dropOut2')}><div>Chimneys</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Hand Blenders', 'dropOut2')}><div>Hand Blenders</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sandwich Makers', 'dropOut2')}><div>Sandwich Makers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Pop Up Toasters', 'dropOut2')}><div>Pop Up Toasters</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Juicer', 'dropOut2')}><div>Juicer</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Grinders', 'dropOut2')}><div>Grinders</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Coffee Makers', 'dropOut2')}><div>Coffee Makers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Dishwashers', 'dropOut2')}><div>Dishwashers</div></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="downNavDropdown drop3">
                <span className="dropHead">
                  men
                  <i className="down"></i>
                </span>
                <div className="dropOut drop2Out" id="dropOut3">
                  <div className="dropIn drop2In">
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Men Clothing', 'dropOut3')}><div>Clothing</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Men top wear', 'dropOut3')}><div>Top Wear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men T Shirts', 'dropOut3')}><div>T-Shirts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men Shirts', 'dropOut3')}><div>Shirts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men Kutas', 'dropOut3')}><div>Kurtas</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men Pyjamas', 'dropOut3')}><div>Pyjama</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men Suits', 'dropOut3')}><div>Suits</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men Blazers', 'dropOut3')}><div>Blazers</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Men bottom wear', 'dropOut3')}><div>Bottom Wear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men jeans', 'dropOut3')}><div>Jeans</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men Trousers', 'dropOut3')}><div>Trousers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men shorts', 'dropOut3')}><div>Shorts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men 3/4ths', 'dropOut3')}><div>3/4ths</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men cargos', 'dropOut3')}><div>Cargos</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men track pants', 'dropOut3')}><div>Track pants</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Men seasonal wear', 'dropOut3')}><div>Seasonal Wear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men sweater', 'dropOut3')}><div>Sweaters</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men jackets', 'dropOut3')}><div>Jackets</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men sweatshirts', 'dropOut3')}><div>Sweatshirts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men raincoats', 'dropOut3')}><div>Raincoats</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men thermals', 'dropOut3')}><div>Thermals</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Men sports wear', 'dropOut3')}><div>Sports Wear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men sports t shirts', 'dropOut3')}><div>Sports T-Shirts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men track pants', 'dropOut3')}><div>Track Pants</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men track suits', 'dropOut3')}><div>Track Suits</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Men innerwear', 'dropOut3')}><div>Innerwear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men briefs', 'dropOut3')}><div>Briefs</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men vests', 'dropOut3')}><div>Vests</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men boxers', 'dropOut3')}><div>Boxers</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Men footwear', 'dropOut3')}><div>Footwear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men sports shoes', 'dropOut3')}><div>Sports Shoes</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men casual shoes', 'dropOut3')}><div>Casual Shoes</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men formal shoes', 'dropOut3')}><div>Formal Shoes</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men sandals', 'dropOut3')}><div>Sandals</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men floaters', 'dropOut3')}><div>Floaters</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men flip flops', 'dropOut3')}><div>Flip-Flops</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men loafers', 'dropOut3')}><div>Loafers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men boots', 'dropOut3')}><div>Boots</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men sneakers', 'dropOut3')}><div>Sneakers</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Mens grooming', 'dropOut3')}><div>Mens's Grooming</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Deodorants for men', 'dropOut3')}><div>Deodorants</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Perfumes for men', 'dropOut3')}><div>Perfumes</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Beard care', 'dropOut3')}><div>Beard Care</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Aftershave', 'dropOut3')}><div>Aftershave</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Men watches', 'dropOut3')}><div>Watches</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Fastrack watches for men', 'dropOut3')}><div>Fastrack</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Casio watches for men', 'dropOut3')}><div>Casio</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Titan watches for men', 'dropOut3')}><div>Titan</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Fossil watches for men', 'dropOut3')}><div>Fossil</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sonata watches for men', 'dropOut3')}><div>Sonata</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Daniel Klien watches for men', 'dropOut3')}><div>Daniel Klien</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Maxima watches for men', 'dropOut3')}><div>Maxima</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Fogg watches for men', 'dropOut3')}><div>Fogg</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Diesel watches for men', 'dropOut3')}><div>Diesel</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('LimeStone watches for men', 'dropOut3')}><div>LimeStone</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Timex watches for men', 'dropOut3')}><div>Timex</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Apple watch', 'dropOut3')}><div>Apple</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Redmi watch', 'dropOut3')}><div>Mi</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Mens Accessories', 'dropOut3')}><div>Accessories</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Backpacks for men', 'dropOut3')}><div>Backpacks</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Wallets for men', 'dropOut3')}><div>Wallets</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Belts for men', 'dropOut3')}><div>Belts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men Sunglasses', 'dropOut3')}><div>Sunglasses</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Luggage', 'dropOut3')}><div>Luggage & Travel</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Jewellery for men', 'dropOut3')}><div>Jewellery</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Smart Bands', 'dropOut3')}><div>Smart Bands</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Men Personal Care Appliances', 'dropOut3')}><div>Personal Care Appliances</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Trimmers', 'dropOut3')}><div>Trimmers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Shavers for men', 'dropOut3')}><div>Shavers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Men Grooming Kit', 'dropOut3')}><div>Grooming Kit</div></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="downNavDropdown drop4">
                <span className="dropHead">
                  women
                  <i className="down"></i>
                </span>
                <div className="dropOut drop2Out" id="dropOut4">
                  <div className="dropIn drop2In">
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Women clothing', 'dropOut4')}><div>Clothing</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Tops for women', 'dropOut4')}><div>Tops</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('T shirts for women', 'dropOut4')}><div>T-Shirts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Shirts for women', 'dropOut4')}><div>Shirts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Dresses for women', 'dropOut4')}><div>Dresses</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Skirts for women', 'dropOut4')}><div>Skirts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Jeans for women', 'dropOut4')}><div>Jeans</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Leggings', 'dropOut4')}><div>Leggings</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Jeggings', 'dropOut4')}><div>Jeggings</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Trousers for women', 'dropOut4')}><div>Trousers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Capris', 'dropOut4')}><div>Capris</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Women Sleepwear', 'dropOut4')}><div>Sleepwear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Bras', 'dropOut4')}><div>Bras</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Nighties', 'dropOut4')}><div>Nighties</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Slips for women', 'dropOut4')}><div>Slips</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Women ethnic wear', 'dropOut4')}><div>Ethnic Wear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sarees', 'dropOut4')}><div>Sarees</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Women Kutas', 'dropOut4')}><div>Kurtas</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Lehenga Choli', 'dropOut4')}><div>Lehenga Choli</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Blouse', 'dropOut4')}><div>Blouse</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Women Ethnic Bottom', 'dropOut4')}><div>Ethnic Bottoms</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Anarkali Suits', 'dropOut4')}><div>Anarkali Suits</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Petticoats', 'dropOut4')}><div>Petticoats</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Dupattas', 'dropOut4')}><div>Dupattas</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Women Seasonal Wear', 'dropOut4')}><div>Seasonal Wear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sweaters for women', 'dropOut4')}><div>Sweaters</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Seatshirts for women', 'dropOut4')}><div>Sweatshirts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Jackets for women', 'dropOut4')}><div>Jackets</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Rain coats for women', 'dropOut4')}><div>Rain Coats</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Women sports wear', 'dropOut4')}><div>Sports Wear</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Women Footwear', 'dropOut4')}><div>Footwear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sandals for women', 'dropOut4')}><div>Sandals</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Flats', 'dropOut4')}><div>Flats</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Heels', 'dropOut4')}><div>Heels</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Wedges', 'dropOut4')}><div>Wedges</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Slippers for women', 'dropOut4')}><div>Slippers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Flip flops for women', 'dropOut4')}><div>Flip-Flops</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Ballerinas', 'dropOut4')}><div>Ballerinas</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Shoes for women', 'dropOut4')}><div>Shoes</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Women sport shoes', 'dropOut4')}><div>Sports Shoes</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Casual shoes for women', 'dropOut4')}><div>Casual Shoes</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Ethnic shoes for women', 'dropOut4')}><div>Ethnic Shoes</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Party shoes for women', 'dropOut4')}><div>Party Shoes</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Boots for women', 'dropOut4')}><div>Boots</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Watches for women', 'dropOut4')}><div>Watches</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Women grooming', 'dropOut4')}><div>Beauty & Grooming</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Makeup', 'dropOut4')}><div>Makeup</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Women Skin care', 'dropOut4')}><div>Skin Care</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Hair care for women', 'dropOut4')}><div>Hair Care</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Deodorants for women', 'dropOut4')}><div>Deodorants</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Perfumes for women', 'dropOut4')}><div>Perfumes</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Jewellery', 'dropOut4')}><div>Jewellery</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Jewellery sets', 'dropOut4')}><div>Jewellery Sets</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Earrings', 'dropOut4')}><div>Earrings</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Chains', 'dropOut4')}><div>Chains</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Bangles', 'dropOut4')}><div>Bangles</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Rings for women', 'dropOut4')}><div>Rings</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Anklets', 'dropOut4')}><div>Anklets</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Silver Jewellery', 'dropOut4')}><div>Silver Jewellery</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Women accessories', 'dropOut4')}><div>Accessories</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Handbags', 'dropOut4')}><div>Handbags</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Shoulder bags for women', 'dropOut4')}><div>Shoulder bags</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Totes', 'dropOut4')}><div>Totes</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sling Bags', 'dropOut4')}><div>Sling Bags</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Clutches', 'dropOut4')}><div>Clutches</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sunglasses for women', 'dropOut4')}><div>Sunglasses</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Frames for women', 'dropOut4')}><div>Frames</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Women personal care appliances', 'dropOut4')}><div>Personal Care Appliances</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Hair Straightners', 'dropOut4')}><div>Hair Straightners</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Hair Dryers', 'dropOut4')}><div>Hair Dryers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Epilators', 'dropOut4')}><div>Epilators</div></div>
                    </div>
                  </div>
                </div>
              </div>


              <div className="downNavDropdown drop5">
                <span className="dropHead">
                  baby & kids
                  <i className="down"></i>
                </span>
                <div className="dropOut drop2Out" id="dropOut5">
                  <div className="dropIn drop2In">
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Boys clothing', 'dropOut5')}><div>Boys Clothing</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Boys t shirts', 'dropOut5')}><div>T-Shirts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Boys polos', 'dropOut5')}><div>Polos</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Boys ethnic wear', 'dropOut5')}><div>Ethnic Wear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Boys shorts', 'dropOut5')}><div>Shorts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Body suits for baby boys', 'dropOut5')}><div>Body Suits</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Girls clothing', 'dropOut5')}><div>Girls Clothing</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Girls dresses', 'dropOut5')}><div>Dresses</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Girls skirts', 'dropOut5')}><div>Skirts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Girls ethnic wear', 'dropOut5')}><div>Ethnic Wear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Girls t shirts', 'dropOut5')}><div>T-Shirts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Girls tops', 'dropOut5')}><div>Tops</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Body suits for baby girls', 'dropOut5')}><div>Body Suits</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Boys footwear', 'dropOut5')}><div>Boys Footwear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Boys sandals', 'dropOut5')}><div>Sandals</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Boys sport shoes', 'dropOut5')}><div>Sport Shoes</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Girls footwear', 'dropOut5')}><div>Girls Footwear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Girls flats', 'dropOut5')}><div>Flats</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Girls bellies', 'dropOut5')}><div>Bellies</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Girls sport shoes', 'dropOut5')}><div>Sport Shoes</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Baby footwear', 'dropOut5')}><div>Baby Footwear</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Kids winterwear', 'dropOut5')}><div>Kids Winter Wear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Boys winter wear', 'dropOut5')}><div>Boys Winter Wear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Girls winter wear', 'dropOut5')}><div>Girls Winter Wear</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Infants winter wear', 'dropOut5')}><div>Infants Winter Wear</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Toys for kids', 'dropOut5')}><div>Toys</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Remote Control Toys', 'dropOut5')}><div>Remote Control Toys</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Educational toys', 'dropOut5')}><div>Educational Toys</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Soft toys', 'dropOut5')}><div>Soft Toys</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Outdoor toys', 'dropOut5')}><div>Outdoor Toys</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Action figures', 'dropOut5')}><div>Action Figures</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Board games', 'dropOut5')}><div>Board Games</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Musical toys', 'dropOut5')}><div>Musical Toys</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Dolls', 'dropOut5')}><div>Dolls</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Doll houses', 'dropOut5')}><div>Doll Houses</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Puzzles', 'dropOut5')}><div>Puzzles</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Helicopter', 'dropOut5')}><div>Helicopter</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Drones', 'dropOut5')}><div>Drones</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Toy guns', 'dropOut5')}><div>Toy Guns</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('School Supplies', 'dropOut5')}><div>School Supplies</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('School bags', 'dropOut5')}><div>School Bags</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Lunch box', 'dropOut5')}><div>Lunch Box</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Bottles', 'dropOut5')}><div>Bottles</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Kids watches', 'dropOut5')}><div>Kids Watches</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Baby care', 'dropOut5')}><div>Baby Care</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Diapers', 'dropOut5')}><div>Diapers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Wipes', 'dropOut5')}><div>Wipes</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Baby bath', 'dropOut5')}><div>Baby Bath</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Baby oral care', 'dropOut5')}><div>Baby Oral Care</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Baby food', 'dropOut5')}><div>Baby Food</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Baby nursing', 'dropOut5')}><div>Nursing</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Kids sunglasses', 'dropOut5')}><div>Kids Sunglasses</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Kids accessories', 'dropOut5')}><div>Accessories</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Baby Feeding', 'dropOut5')}><div>Baby Feeding Utensils</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Breast Feeding', 'dropOut5')}><div>Breast Feeding</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Baby Feeding Bottles', 'dropOut5')}><div>Baby Feeding Bottles</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Baby bedding', 'dropOut5')}><div>Baby Bedding</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Baby skin care', 'dropOut5')}><div>Baby Skin Care</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Baby gift sets', 'dropOut5')}><div>Baby Gift Sets</div></div>
                      <div className="dropItemHead"><div>Featured Brands</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Barbie', 'dropOut5')}><div>Barbie Toys</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Disney toys', 'dropOut5')}><div>Disney Toys</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Lego', 'dropOut5')}><div>Lego</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Mamy Poko', 'dropOut5')}><div>Mamy Poko</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Funskool', 'dropOut5')}><div>Funskool</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('LuvLap', 'dropOut5')}><div>LuvLap</div></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="downNavDropdown drop6">
                <span className="dropHead">
                  home & furniture
                  <i className="down"></i>
                </span>
                <div className="dropOut drop2Out" id="dropOut6">
                  <div className="dropIn drop2In">
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Kitchen tools', 'dropOut6')}><div>Kitchen</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Pans', 'dropOut6')}><div>Pans</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Tawas', 'dropOut6')}><div>Tawas</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Pressure cookers', 'dropOut6')}><div>Pressure Cookers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Kitchen tools', 'dropOut6')}><div>Kitchen Tools</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Gas stoves', 'dropOut6')}><div>Gas Stoves</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Dinnerwear', 'dropOut6')}><div>Dinnerware</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Dinner set', 'dropOut6')}><div>Dinner Set</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Coffee Mugs', 'dropOut6')}><div>Coffee Mugs</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Barware', 'dropOut6')}><div>Barware</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Kitchen Storage', 'dropOut6')}><div>Kitchen Storage</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Water bottles', 'dropOut6')}><div>Water Bottles</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Lunch boxes', 'dropOut6')}><div>Lunch Boxes</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Flasks', 'dropOut6')}><div>Flasks</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Bed room furniture', 'dropOut6')}><div>Bed Room Furniture</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Beds', 'dropOut6')}><div>Beds</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Mattresses', 'dropOut6')}><div>Mattresses</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Wardrobes', 'dropOut6')}><div>Wardrobes</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Living Room Furniture', 'dropOut6')}><div>Living Room Furniture</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sofa', 'dropOut6')}><div>Sofa</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sofa Beds', 'dropOut6')}><div>Sofa Beds</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('TV Units', 'dropOut6')}><div>TV Units</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Chairs', 'dropOut6')}><div>Chairs</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Shoe Racks', 'dropOut6')}><div>Shoe Racks</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Study furniture', 'dropOut6')}><div>Study Furniture</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Study tables', 'dropOut6')}><div>Study Tables</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Office furniture', 'dropOut6')}><div>Office Furniture</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Computer desk', 'dropOut6')}><div>Computer Desk</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('DIY furniture', 'dropOut6')}><div>DIY Furniture</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Bean bags', 'dropOut6')}><div>Bean Bags</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Furnishing', 'dropOut6')}><div>Furnishing</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Bedsheets', 'dropOut6')}><div>Bedsheets</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Curtains', 'dropOut6')}><div>Curtains</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Cushions', 'dropOut6')}><div>Cushions</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Pillows', 'dropOut6')}><div>Pillows</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Pillow Covers', 'dropOut6')}><div>Pillow Covers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Blankets', 'dropOut6')}><div>Blankets</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Bath Towels', 'dropOut6')}><div>Bath Towels</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Floor Covering', 'dropOut6')}><div>Floor Covering</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Napkins', 'dropOut6')}><div>Napkins</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Decorating Lights', 'dropOut6')}><div>Decorating Lights</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Mugs', 'dropOut6')}><div>Mugs</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Buckets', 'dropOut6')}><div>Buckets</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Home Decor', 'dropOut6')}><div>Home Decor</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Paintings', 'dropOut6')}><div>Paintings</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Clocks', 'dropOut6')}><div>Clocks</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Wall shelves', 'dropOut6')}><div>Wall Shelves</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Stickers', 'dropOut6')}><div>Stickers</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Home lighting', 'dropOut6')}><div>Home Lighting</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Bulbs', 'dropOut6')}><div>Bulbs</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Wall lamps', 'dropOut6')}><div>Wall Lamps</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Table lamps', 'dropOut6')}><div>Table Lamps</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Ceiling lamps', 'dropOut6')}><div>Ceiling Lamps</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Emergency lights', 'dropOut6')}><div>Emergency Lights</div></div>
                      <div className="dropItemHead"><div>Featured</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Milton', 'dropOut6')}><div>Milton</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Prestige', 'dropOut6')}><div>Prestige</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Home improvement', 'dropOut6')}><div>Home Improvement</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Screwdriver Kit', 'dropOut6')}><div>Screwdriver Kit</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Lawn mower', 'dropOut6')}><div>Lawn Mower</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Smart home automation', 'dropOut6')}><div>Smart Home Automation</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Smart security system', 'dropOut6')}><div>Smart Security System</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Smart door locks', 'dropOut6')}><div>Smart Door Locks</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Home accessories', 'dropOut6')}><div>Accessories</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Irons', 'dropOut6')}><div>Irons</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Water purifiers', 'dropOut6')}><div>Water Purifiers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Fans', 'dropOut6')}><div>Fans</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Vacuum Cleaners', 'dropOut6')}><div>Vacuum Cleaners</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick(' Sewing machines', 'dropOut6')}><div>Sewing Machines</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Water geysers', 'dropOut6')}><div>Water Geysers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Inverters', 'dropOut6')}><div>Inverters</div></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="downNavDropdown drop7">
                <span className="dropHead">
                  sports, books & more
                  <i className="down"></i>
                </span>
                <div className="dropOut drop2Out" id="dropOut7">
                  <div className="dropIn drop2In">
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Sports', 'dropOut7')}><div>Sports</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Cricket', 'dropOut7')}><div>Cricket</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Badminton', 'dropOut7')}><div>Badminton</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Cycling Machines', 'dropOut7')}><div>Cycling</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Football', 'dropOut7')}><div>Football</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Skating', 'dropOut7')}><div>Skating</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Hiking', 'dropOut7')}><div>Hiking</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Swimming', 'dropOut7')}><div>Swimming</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Exercise', 'dropOut7')}><div>Exercise Fitness</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Cardio Equipment', 'dropOut7')}><div>Cardio Equipment</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Dumbbells', 'dropOut7')}><div>Dumbbells</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Shaker', 'dropOut7')}><div>Shakers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Sippers', 'dropOut7')}><div>Sippers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Yoga mat', 'dropOut7')}><div>Yoga Mat</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Food Essentialsfor fitness', 'dropOut7')}><div>Food Essentials</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Nuts', 'dropOut7')}><div>Nuts</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Dry fruits', 'dropOut7')}><div>Dry Fruits</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Beverages', 'dropOut7')}><div>Beverages</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Chocolates', 'dropOut7')}><div>Chocolates</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Honey', 'dropOut7')}><div>Honey</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Spreads', 'dropOut7')}><div>Spreads</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Jams', 'dropOut7')}><div>Jams</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Health & Nutrition', 'dropOut7')}><div>Health & Nutrition</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Protein Supplements', 'dropOut7')}><div>Protein Supplements</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Vitamin Supplements', 'dropOut7')}><div>Vitamin Supplements</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Health Drinks', 'dropOut7')}><div>Health Drinks</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Ayurvedic Supplements', 'dropOut7')}><div>Ayurvedic Supplements</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Books', 'dropOut7')}><div>Books</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Literature books', 'dropOut7')}><div>Literature</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Fiction books', 'dropOut7')}><div>Fiction</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Entrance Exams Books', 'dropOut7')}><div>Entrance Exams</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Non fiction Books', 'dropOut7')}><div>Non Fiction</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Yoga Books', 'dropOut7')}><div>Yoga Readers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Business Books', 'dropOut7')}><div>Business</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Stationery', 'dropOut7')}><div>Stationery</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Pens', 'dropOut7')}><div>Pens</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Diaries', 'dropOut7')}><div>Diaries</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Card holders', 'dropOut7')}><div>Card Holders</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Desk Organizers', 'dropOut7')}><div>Desk Organizers</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Calculators', 'dropOut7')}><div>Calculators</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Key Chains', 'dropOut7')}><div>Key Chains</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Paper clips', 'dropOut7')}><div>Paper Clips</div></div>
                    </div>
                    <div className="dropInBatch dropInColorDark">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Vehicle Accessories', 'dropOut7')}><div>Auto Accessories</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Helmets', 'dropOut7')}><div>Helmets</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Car Care', 'dropOut7')}><div>Car Care</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Car audio', 'dropOut7')}><div>Car Audio</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Bike care', 'dropOut7')}><div>Bike Care</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('vehicle Lubricants', 'dropOut7')}><div>Vehicle Lubricants</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Scientific Tools', 'dropOut7')}><div>Industrial & Scientific Tools</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Measuring devices', 'dropOut7')}><div>Measurement Devices</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Scientific Products', 'dropOut7')}><div>Scientific Products</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Medical Supplies', 'dropOut7')}><div>Medical Supplies</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Pregnancy', 'dropOut7')}><div>Pregnancy Kits</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Hot water bag', 'dropOut7')}><div>Hot Water Bag</div></div>
                    </div>
                    <div className="dropInBatch">
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Music', 'dropOut7')}><div>Music</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Music', 'dropOut7')}><div>Music</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Keyboards', 'dropOut7')}><div>Keyboards</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Guitar', 'dropOut7')}><div>Guitar</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Flute', 'dropOut7')}><div>Flute</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Microphones', 'dropOut7')}><div>Microphones</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('DJ Controller', 'dropOut7')}><div>DJ Controller</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Movies', 'dropOut7')}><div>Movies</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('TV Shows', 'dropOut7')}><div>TV Shows</div></div>
                      <div className="dropItemHead" onClick={() => this.handleDropdownClick('Gaming', 'dropOut7')}><div>Gaming</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Gaming Consoles', 'dropOut7')}><div>Gaming Consoles</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('PS4 Games', 'dropOut7')}><div>PS4 Games</div></div>
                      <div className="dropItem" onClick={() => this.handleDropdownClick('Virtual Reality', 'dropOut7')}><div>Smart Glasses (VR)</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="visibleAbout" id="visibleAbout">
          <div className="aboutBackground" id="aboutBackground">
            <div className="aboutText" id="aboutText">
              <div className="aboutTextHead" id="aboutTextHead">PRODUCT SEARCH AUTOMATION</div>
              <div className="aboutTextContent">
                <div className="aboutTextContentTop" id="aboutTextContentTop">
                  <div className="aboutTextContentTop1" id="aboutTextContentTop1">If you're planning to buy a product, you would normally search in popular e-commerce websites and analyse it by looking into reviews and ratings and then decide where you're going to buy it.</div>

                  <div className="aboutTextContentTop2">What if we do all that hardwork and rank the products for you to choose in a single place from multiple trusted sites?</div>
                  <div className="aboutTextContentTop3">That's what this app exactly does</div>
                  <div className="aboutTextContentTop3" id="aboutTextContentTop3"><IoIosArrowForward className="aboutArrowIcon" />  Just enter whatever you want to buy and we'll provide you the best results for the product you want to buy based on it's reviews and ratings from popular e-commerce sites</div>

                  {/*This application replaces the manual research of a product search in multiple e-commerce websites
                    and helps users to purchase the best product online saving lots of time and effort while not compromising on quality.*/}
                </div>
                <div className="aboutCloseButtonContainer">
                  <div onClick={this.aboutExpand} className="aboutCloseButton" id="aboutCloseButton">&times;</div>
                </div>
              </div>
              <div className="aboutTotalVisits">
                <div className="aboutTotalVisitsContent">total page visits : <span className="totalPageVisits" id="totalPageVisits"></span></div>
              </div>
            </div>
          </div>
        </div>

        <div id='startContent' className='startContent'>
          <div id="startContentCarousel" className="carousel slide startContentCarousel" data-ride="carousel"></div>

          <div className="staticStartPage">
            <div className="staticPageBackground">
              <div className="staticPageBackgroundOpacity" id="staticPageBackgroundOpacity">
                <div className="staticStartPageText">
                  <div className="staticStartPageTextTop">MULTI-SOURCE REAL-TIME<br />PRODUCT RANKING</div>
                  <div className="staticStartPageTextBottom">Get the best products from all the e-commerce applications combined. Save time, effort and get everything in one place</div>
                </div>
              </div>
            </div>
          </div>

          <div className="top5Div">
            <h3 className="top5Heading">top searches</h3>
            <hr />
            <div>
              <div id="top5Content" className="row top5Content">
                <HashLoader
                  css={override}
                  size={30}
                  color={'#000000'}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="timeoutToast" id="timeoutToast" title="Tap to close" onClick={() => document.getElementById('timeoutToast').style.display = "none"}>{this.state.timeoutMsg}<span className="timeoutToastx"><FaTimesCircle className="timeoutIcon" /></span></div>

        <div id="head" className="head">

          <h1 className='jettext' title="Applies only for good internet connection">this will take some time(approx 35 sec). please be patient.  <u className="timeCounter">{this.state.timeCounter}sec</u></h1>

          <BarLoader
            css={override}
            size={50}
            width={300}
            color={'#000000'}
          />
        </div>

        <div className="resultModal">
          <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" show={this.state.showResultModal} onHide={() => this.setState({ showResultModal: false })} centered>
            <Modal.Body className="modalBody">
              <section className="modalSection">
                <div className="modalSmallImages" id="modalSmallImages">

                </div>
                <div className="modalLargeImages" id="modalLargeImages">

                </div>
                <div className="modalItemContent" id="modalItemContent">

                </div>
              </section>
            </Modal.Body>
          </Modal>
        </div>

        {/*The whole result div tag*/}
        <div className="res" id="res">

          <div className="leftResult" id="leftResult">
            <div className="leftResultMainHead">Filters</div>
            <section className="leftResultSection">
              <div className="leftResultHead">CATEGORY</div>
              <div className="leftResultText category" id="category"><IoIosArrowForward className="categoryIcon" /> {this.state.category}</div>
            </section>
            <section className="leftResultSection">
              <div className="leftResultHead">PRICE</div>
              <div className="sliderDiv" title="Keyboard arrows also work"><input type="text" id="sliderId" /></div>
            </section>
            <section className="leftResultSection">
              <div className="leftResultHead">WEBSITES</div>
              <div id='websiteCheckboxDiv'></div>
            </section>
            <section className="leftResultSection">
              <div className="leftResultHead">RATING</div>
              <div className="ratingCheckboxDiv">
                <div className="custom-control custom-checkbox">
                  <input type="checkbox" id="rating4" className="ratingCheckbox custom-control-input" onClick={() => this.updateResult()} />
                  <label title="4 star and above" htmlFor="rating4" className="checkboxLabel custom-control-label">
                    4&#9733; & above
                  </label>
                </div>
                <div className="custom-control custom-checkbox">
                  <input type="checkbox" id="rating3" className="ratingCheckbox custom-control-input" onClick={() => this.updateResult()} />
                  <label title="3 star and above" htmlFor="rating3" className="checkboxLabel custom-control-label">
                    3&#9733; & above
                  </label>
                </div>
                <div className="custom-control custom-checkbox">
                  <input type="checkbox" id="rating2" className="ratingCheckbox custom-control-input" onClick={() => this.updateResult()} />
                  <label title="2 star and above" htmlFor="rating2" className="checkboxLabel custom-control-label">
                    2&#9733; & above
                  </label>
                </div>
                <div className="custom-control custom-checkbox">
                  <input type="checkbox" id="rating1" className="ratingCheckbox custom-control-input" onClick={() => this.updateResult()} />
                  <label title="1 star and above" htmlFor="rating1" className="checkboxLabel custom-control-label">
                    1&#9733; & above
                  </label>
                </div>
              </div>
            </section>
            <div className="resultCount" id="resultCount"><span className="resultCountNumber">{this.state.resultCount}</span> TOTAL RESULTS</div>

          </div>

          <div className="result" id="result">
          </div>
        </div>

        <footer id="footer" className="footer">
          <div className="footerTitleAndTop">
            <div className="footerLogo"><span className="footerLogoText" onClick={() => this.reloading()}>PSA</span></div>
            <div className="footerToTop"><span className="footerText" onClick={() => window.scroll({ top: 0, left: 0, behavior: 'smooth' })}>Return to top <TiArrowSortedUp /></span></div>
          </div>
          <div className="footerMiddle">
            <div className="footerCentered"><span className="footerText" id="report" onClick={() => this.reportToggle()}>REPORT</span></div>
            <div className="footerCentered"><span className="footerText" onClick={this.aboutExpand}>ABOUT</span></div>
            <div className="footerCentered"><span className="footerText"><a className="footerText" href="mailto:gunachand7@gmail.com?Subject=Regarding%20PSA" target="_top">CONTACT</a></span></div>
          </div>
          <div className="feedback closed" id="feedback">

            <form onSubmit={this.sendReport}>
              <input type="email" onChange={this.changeReportEmail} className="reportEmail" id="reportEmail" placeholder="Enter Your email..." autoComplete="off" spellCheck="false" required /><br />
              <textarea type="text" onChange={this.changeReportContent} placeholder="Description..." className="reportContent" id="reportContent" rows="4" cols="50" spellCheck="false" autoComplete="off" required></textarea><br />
              <div className="reportTerms">
                <span className="reportTermsText">By reporting, you agree with our </span>
                <OverlayTrigger placement="auto" overlay={
                  <Popover id="popover-basic">
                    <Popover.Title as="h3">Terms applied for reporting</Popover.Title>
                    <Popover.Content>
                      <ul>
                        <li>We collect <strong>User Agent</strong> to understand your report better.</li>
                        <li>User provided email will be used for further communication.</li>
                      </ul>
                    </Popover.Content>
                  </Popover>}>
                  <span className="reportTermsTrigger">Terms</span>
                </OverlayTrigger>
              </div>
              <input type="submit" className="reportButton" value="REPORT" />
            </form>

          </div>
          <div className="copyright" id="copyright"><span className="footerYear">&copy; 2020</span>, PRODUCT SEARCH AUTOMATION</div>
        </footer>

      </div>
    )
  }
}

export default ProductSearchAutomation;
