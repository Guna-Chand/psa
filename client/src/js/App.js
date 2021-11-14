import React from 'react';
import '../css/App.css';
import '../css/AppMobile.css';
import '../css/ResultV2.css';
import '../css/Sidebar.css';
import noImg from '../images/noImg.jpg';
import fromFlipkart from '../images/fromFlipkart.png';
import { FaTimesCircle } from "react-icons/fa";
import { IoMdArrowDropupCircle, IoIosArrowForward, IoIosArrowUp } from "react-icons/io";
import { IoSearchSharp } from "react-icons/io5";
import { isMobile, getUA } from 'react-device-detect';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, OverlayTrigger, Popover, CloseButton } from 'react-bootstrap';
import { HashLoader, BarLoader } from 'react-spinners';
import $ from 'jquery';
import { css } from '@emotion/core';
import Category from './components/Category';
import Sidebar from './components/Sidebar';

const axios = require('axios');

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

const mobileOverride = css`
  display: block;
  margin: 10px auto;
  border-color: red;
`;

var data = [];
var fixedData = [];
var expandedData = [];
var globalCurrentSearchTermFlag = '';
var globalCurrentSearchTermStable = '';
//globalPriceUpdateFlag is to keep track if the price slider is moved or not just not to do unneccessary price sorting
var globalPriceUpdateFlag = false;
// var zoomCautionFlag = false;

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

      searchTerm: '',

      menuOpen: false,

      filterIsOpen: true,

      appliedFilterCount: 0
    };
    this.handleSearchTerm = this.handleSearchTerm.bind(this);
    this.reloading = this.reloading.bind(this);
    this.dropdownCall = this.dropdownCall.bind(this);
    this.fetchTopFive = this.fetchTopFive.bind(this);
    this.timeoutMsgTrigger = this.timeoutMsgTrigger.bind(this);
    this.setSearchSuggestions = this.setSearchSuggestions.bind(this);
    this.handleDropdownClick = this.handleDropdownClick.bind(this);
    // this.sidebarSwitch = this.sidebarSwitch.bind(this);
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
      this.handleFiltersDropdown();
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
          this.updateResult();
        }
      });
    } catch (err) {
      console.log(err);
    }

    $('.ratingCheckbox').on('change', ({ currentTarget }) => {
      $('.ratingCheckbox').not(currentTarget).prop('checked', false);
      this.updateResult();
    });

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
      document.getElementById("res").style.display = isMobile ? 'block' : 'flex';
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
    let elements = Array.from(document.getElementsByClassName('fromFlipkartImage'));
    elements.forEach(ele => ele.src = fromFlipkart);
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
    let appliedFilterCount = 0;
    if (priceVals.result.min === priceVals.result.from && priceVals.result.max === priceVals.result.to && globalPriceUpdateFlag === false) {
      data = fixedData;
    } else {
      if (priceVals.result.min === priceVals.result.from && priceVals.result.max === priceVals.result.to && globalPriceUpdateFlag === true) {
        data = fixedData;
        globalPriceUpdateFlag = false;
      } else {
        globalPriceUpdateFlag = true;
        appliedFilterCount += 1;
        this.updateResultByPrice(priceVals.result.from, priceVals.result.to);
      }
    }

    $(".websiteCheckbox").filter(":checked").each(function (index, ele) {
      let web = $(ele).attr("id");
      web = web.replace('Checkbox', '');
      websiteChecked.push(web);
    });

    if (websiteChecked.length !== 0) {
      appliedFilterCount += websiteChecked.length;
      this.updateResultByWebsite(websiteChecked);
    }

    $(".ratingCheckbox").filter(":checked").each(function (index, ele) {
      ratingChecked = parseFloat($(ele).attr("id").replace('rating', ''));
    });

    if (ratingChecked !== 0) {
      appliedFilterCount += 1;
      this.updateResultByRating(ratingChecked);
    }

    this.setState({ appliedFilterCount: appliedFilterCount });

    this.resultInterfaceUpdate();
  }

  clearFilters() {
    let priceVals = window.$("#sliderId").data("ionRangeSlider");
    window.$("#sliderId").data("ionRangeSlider").update({
      from: 0,
      max: priceVals.result.max,
      to: priceVals.result.max
    });

    $(".websiteCheckbox").each(function () {
      this.checked = false;
    });

    $(".ratingCheckbox").each(function () {
      this.checked = false;
    });

    this.updateResult();
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
      document.getElementById('timeoutToast').style.display = "inline-block";
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
    // zoomCautionFlag = false;
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
                                <div class = "modalItemRating"><span class = "modalItemRatingValue">${obj.rating}&#9733;</span> <span class = "modalItemRatingCount">(${(obj.ratingCount).toLocaleString()} ratings)</span></div>
                              </div>`;

      this.setState({ showResultModal: true }, () => {
        document.getElementById('modalSmallImages').innerHTML = smallImagesAdder;
        document.getElementById('modalLargeImages').innerHTML = largeImagesAdder;
        document.getElementById('modalItemContent').innerHTML = itemContentAdder;
        window.$('.largeImage').zoom({ on: 'click' });
        // $('.largeImage').bind('click touchstart', () => {
        //   if (zoomCautionFlag === false) {
        //     zoomCautionFlag = true;
        //     document.getElementById('modalItemContent').innerHTML += `<div class = "modalItemContentZoomCaution">Amazon and SnapDeal images fetched are currently not fit for zooming.<br/><b>Will be updated soon.</b></div>`;
        //   }
        // });
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
                                <div class = "modalItemRating"><span class = "modalItemRatingValue">${obj.rating}&#9733;</span> <span class = "modalItemRatingCount">(${(obj.ratingCount).toLocaleString()} ratings)</span></div>
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
      let divider = isMobile ? 2 : 4;

      data.forEach((log, index) => {
        if (index % divider === 0 && index !== 1) {
          resultAdder += `<div class = "row resultRowV2">`;
        }
        let img = log.imageSrc;
        resultAdder +=
          `<div class = "col resultColV2 resultBlock" name = ${index}>
                          <div class = "rankTagV2" name = ${index} title = "RANK ${index + 1}">${index + 1}</div>
                            <div class = "test resultImage" id = ${log.id} name = ${index}>
                              <div class = "imV2" name = ${index} title = "${log.title}">
                                  <img src = ${(img) ? img : noImg} alt = "Product Image" name = ${index} class = "productImageV2">
                              </div>
                            </div>
                              <div class = "contenV2" name = ${index}>
                                  <div class = "websiteNameV2" name = ${index}>${log.website}</div>
                                  <div title = "${log.title}" name = ${index} class = "elip resultTitle" id = "${log.id}secondary">${log.name}</div>
                                  <span class = "priceV2" name = ${index}>&#8377; ${log.price}</span>
                                  <p class = "n-ratingsV2" name = ${index}><b class = "ratingV2" name = ${index}>${log.rating}&#9733;</b> (${(log.ratingCount).toLocaleString()} Ratings)</p>
                                  <div class = "goToWebsiteV2" name = ${index}><a href = ${log.link} name = ${index} title = "Open this product in ${log.website}" target = "_blank" class="btn btn-secondary goToWebsiteV2Button">Open in ${log.website}</a></div>
                              </div>
                        </div>
                        `;

        if (index + 1 !== 1 && index + 1 % divider === 0) {
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
        document.getElementById("res").style.display = isMobile ? 'block' : 'flex';
        globalCurrentSearchTermFlag = searchTermMain;
        globalCurrentSearchTermStable = searchTermMain;
        let timeFlag = false;
        let timeFlag60 = false;
        let timeInterval = setInterval(() => {
          if (this.state.timeCounter > 35 && timeFlag === false) {
            this.timeoutMsgTrigger('Please check your network connection. ');
            timeFlag = true;
          }
          if (this.state.timeCounter > 60 && timeFlag60 === false) {
            this.timeoutMsgTrigger('Please reload and try again. ');
            timeFlag60 = true;
          }
          this.setState({ timeCounter: this.state.timeCounter + 1 });
        }, 1000);
        
        this.setState({ head: 'approx 40 different pages', appliedFilterCount: 0 });

        data = [];
        if (isMobile) {
          document.getElementById('res').style.minHeight = "1700px";
        } else {
          document.getElementById('res').style.minHeight = "100vh";
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
    if (e)
      e.preventDefault();
    if (this.aboutState === "closed") {
      this.aboutState = "open";
      document.getElementById('visibleAbout').style.transition = "height 1s, box-shadow 0s";
      document.getElementById('visibleAbout').style.boxShadow = "0px 1px 100px 100px rgba(0,0,0,1)";
      document.getElementById('visibleAbout').style.height = "100%";
      if (!isMobile)
        document.getElementById('about').style.color = "white";
    } else {
      this.aboutState = "closed";
      document.getElementById('visibleAbout').style.transition = "height 1s, box-shadow 2s";
      document.getElementById('visibleAbout').style.height = "0";
      document.getElementById('visibleAbout').style.boxShadow = "0px 0px 0px 0px rgba(0,0,0,0)";
      if (!isMobile) 
        document.getElementById('about').style.color = "gray";
    }
  }

  dropdownCall = async (e) => {
    await this.handleSearchTerm(e);
    this.analyse();
  };


  handleDropdownClick = async (e, id) => {
    document.getElementById("res").style.display = isMobile ? 'block' : 'flex';
    if (id) {
      document.getElementById(id).style.display = 'none';
      setTimeout(function () {
        document.getElementById(id).style.display = 'block';
      }, 1000);
    }
    await this.handleSearchTerm(e);
    this.analyse();
  }

  handleStateChange = (state) => {
    this.setState({ menuOpen: state.isOpen })
  }

  closeMenu = () => {
    this.setState({ menuOpen: false })
  }

  toggleMenu = () => {
    this.setState(state => ({ menuOpen: !state.menuOpen }))
  }

  handleFiltersDropdown = () => {
    if (this.state.filterIsOpen) {
      document.getElementById("leftResultMainContent").style.height = "0px";
      document.getElementById("filterDropdownArrow").style.transform = "rotate(180deg)";
      this.setState({ filterIsOpen: false });
    } else {
      document.getElementById("leftResultMainContent").style.height = "100%";
      document.getElementById("filterDropdownArrow").style.transform = "rotate(0deg)";
      this.setState({ filterIsOpen: true });
    }
  }

  //Main Method that renders all the HTML
  render() {
    return (
      <div id="App" className="App">

        <div className="moveToTop" title="Go to top" id="moveToTop"><IoMdArrowDropupCircle onClick={() => window.scroll({ top: 0, left: 0, behavior: 'smooth' })} className="upIcon" /></div>

        <div className="topnav" id="myTopnav">
          <div className="home" id="home" onClick={() => this.reloading()}>PSA</div>
          {!isMobile && <div className="about" id="about" onClick={this.aboutExpand}>About</div>}

          <div className="App-form" id="App-form">

            {/*Calling analyse function on submitting the form*/}
            <form id="textForm" className="textForm" onSubmit={this.analyse}>
              <input type="text" name="searchTerm" list="searchSuggestions" value={this.state.searchTerm} onChange={this.handleSearchTerm} placeholder="Search for products" className="nameInput" id="nameInput" spellCheck="false" title="Enter the product name that you want to search" autoComplete="off" required />
              <datalist id="searchSuggestions">
              </datalist>
            </form>

            {/*Linking the button to the form*/}
            <button form="textForm" type="submit" className="submitButton" id="submitButton">
              {/*Arrow icon in the button*/}
              <IoSearchSharp className="icon" id="icon" />
            </button>
          </div>
        </div>
        <div id="page-wrap" className="page-wrap"></div>
        {isMobile &&
          <Sidebar right noOverlay itemListElement="div" handleDropdownClick={this.handleDropdownClick} aboutExpand={this.aboutExpand} isOpen={this.state.menuOpen} onStateChange={(state) => this.handleStateChange(state)} width={'100%'} closeMenu={this.closeMenu} />
        }
        {!isMobile &&
          <div className="downNav">
            <Category
              handleDropdownClick = {this.handleDropdownClick}
            />
          </div>
        }
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
            <h3 className="top5Heading">Top Searches</h3>
            <hr />
            <div className="top5ContentParent">
              <div id="top5Content" className="row top5Content">
                <HashLoader
                  css={isMobile ? mobileOverride : override}
                  size={isMobile? 20 : 30}
                  color={'#000000'}
                />
              </div>
            </div>
          </div>
          <div className="staticStartPageSteps">
            <div className="staticPageFiller">
              <div className="fillerOverlay">
                <div className="wave2">
                  <svg data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 200" preserveAspectRatio="none">
                    <path d="M0 61L15.3 61.2C30.7 61.3 61.3 61.7 92.2 59.7C123 57.7 154 53.3 184.8 51.2C215.7 49 246.3 49 277 50C307.7 51 338.3 53 369.2 53C400 53 431 51 461.8 52.2C492.7 53.3 523.3 57.7 554 59.5C584.7 61.3 615.3 60.7 646 58.2C676.7 55.7 707.3 51.3 738.2 50C769 48.7 800 50.3 830.8 48C861.7 45.7 892.3 39.3 923 39.2C953.7 39 984.3 45 1015.2 46.8C1046 48.7 1077 46.3 1107.8 46.3C1138.7 46.3 1169.3 48.7 1184.7 49.8L1200 51L1200 201L1184.7 201C1169.3 201 1138.7 201 1107.8 201C1077 201 1046 201 1015.2 201C984.3 201 953.7 201 923 201C892.3 201 861.7 201 830.8 201C800 201 769 201 738.2 201C707.3 201 676.7 201 646 201C615.3 201 584.7 201 554 201C523.3 201 492.7 201 461.8 201C431 201 400 201 369.2 201C338.3 201 307.7 201 277 201C246.3 201 215.7 201 184.8 201C154 201 123 201 92.2 201C61.3 201 30.7 201 15.3 201L0 201Z" fill="#ff6f61"></path>
                    <path d="M0 87L15.3 83.8C30.7 80.7 61.3 74.3 92.2 73.2C123 72 154 76 184.8 78C215.7 80 246.3 80 277 82.2C307.7 84.3 338.3 88.7 369.2 88.5C400 88.3 431 83.7 461.8 85.5C492.7 87.3 523.3 95.7 554 98.7C584.7 101.7 615.3 99.3 646 94C676.7 88.7 707.3 80.3 738.2 79.3C769 78.3 800 84.7 830.8 85.5C861.7 86.3 892.3 81.7 923 78.7C953.7 75.7 984.3 74.3 1015.2 76.8C1046 79.3 1077 85.7 1107.8 85.2C1138.7 84.7 1169.3 77.3 1184.7 73.7L1200 70L1200 201L1184.7 201C1169.3 201 1138.7 201 1107.8 201C1077 201 1046 201 1015.2 201C984.3 201 953.7 201 923 201C892.3 201 861.7 201 830.8 201C800 201 769 201 738.2 201C707.3 201 676.7 201 646 201C615.3 201 584.7 201 554 201C523.3 201 492.7 201 461.8 201C431 201 400 201 369.2 201C338.3 201 307.7 201 277 201C246.3 201 215.7 201 184.8 201C154 201 123 201 92.2 201C61.3 201 30.7 201 15.3 201L0 201Z" fill="#ef5663"></path>
                    <path d="M0 109L15.3 110.3C30.7 111.7 61.3 114.3 92.2 116C123 117.7 154 118.3 184.8 121.5C215.7 124.7 246.3 130.3 277 131.5C307.7 132.7 338.3 129.3 369.2 126.2C400 123 431 120 461.8 118.7C492.7 117.3 523.3 117.7 554 118.5C584.7 119.3 615.3 120.7 646 119.5C676.7 118.3 707.3 114.7 738.2 116.5C769 118.3 800 125.7 830.8 128.5C861.7 131.3 892.3 129.7 923 125.8C953.7 122 984.3 116 1015.2 114.3C1046 112.7 1077 115.3 1107.8 117.3C1138.7 119.3 1169.3 120.7 1184.7 121.3L1200 122L1200 201L1184.7 201C1169.3 201 1138.7 201 1107.8 201C1077 201 1046 201 1015.2 201C984.3 201 953.7 201 923 201C892.3 201 861.7 201 830.8 201C800 201 769 201 738.2 201C707.3 201 676.7 201 646 201C615.3 201 584.7 201 554 201C523.3 201 492.7 201 461.8 201C431 201 400 201 369.2 201C338.3 201 307.7 201 277 201C246.3 201 215.7 201 184.8 201C154 201 123 201 92.2 201C61.3 201 30.7 201 15.3 201L0 201Z" fill="#dc3d65"></path>
                    <path d="M0 159L15.3 158.7C30.7 158.3 61.3 157.7 92.2 158.3C123 159 154 161 184.8 163.5C215.7 166 246.3 169 277 170.3C307.7 171.7 338.3 171.3 369.2 169.2C400 167 431 163 461.8 159.3C492.7 155.7 523.3 152.3 554 150.3C584.7 148.3 615.3 147.7 646 148.2C676.7 148.7 707.3 150.3 738.2 154.8C769 159.3 800 166.7 830.8 169C861.7 171.3 892.3 168.7 923 168.3C953.7 168 984.3 170 1015.2 168C1046 166 1077 160 1107.8 157.2C1138.7 154.3 1169.3 154.7 1184.7 154.8L1200 155L1200 201L1184.7 201C1169.3 201 1138.7 201 1107.8 201C1077 201 1046 201 1015.2 201C984.3 201 953.7 201 923 201C892.3 201 861.7 201 830.8 201C800 201 769 201 738.2 201C707.3 201 676.7 201 646 201C615.3 201 584.7 201 554 201C523.3 201 492.7 201 461.8 201C431 201 400 201 369.2 201C338.3 201 307.7 201 277 201C246.3 201 215.7 201 184.8 201C154 201 123 201 92.2 201C61.3 201 30.7 201 15.3 201L0 201Z" fill="#c62368"></path>
                  </svg>
                </div>
                <div className="staticFillerText">
                  <div className="fillerItem">HAPPY<br/>SEARCHING.</div>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="timeoutToast" id="timeoutToast" title="Tap to close" onClick={() => document.getElementById('timeoutToast').style.display = "none"}>{this.state.timeoutMsg}<span className="timeoutToastx"><FaTimesCircle className="timeoutIcon" /></span></div>

        <div id="head" className="head">

          <h1 className='jettext' title="Applies only for good internet connection">This will take some time (Approx 15 sec).  <u className="timeCounter">{this.state.timeCounter}sec</u></h1>

          <BarLoader
            css={override}
            size={isMobile ? 20 : 50}
            width={isMobile ? 140 : 300}
            color={'#000000'}
          />
        </div>

        <div className="resultModal">
          <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" show={this.state.showResultModal} onHide={() => this.setState({ showResultModal: false })} centered>
            <div className="modalCloseButtonDiv"><CloseButton className="modalCloseButton" onClick={() => this.setState({ showResultModal: false })}/></div>
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
            <div className="leftResultMainHead" onClick={this.handleFiltersDropdown}>FILTERS <IoIosArrowUp id="filterDropdownArrow" className="filterDropdownArrow"/></div>
            <div id="leftResultMainContent" className="leftResultMainContent">
              <section className="leftResultSection clearFilterSection">
                <div className="leftResultClearAll">
                  <span className="appliedFilterCount">{this.state.appliedFilterCount} FILTERS APPLIED</span>
                  <button className ="btn clearAllButton" onClick={() => this.clearFilters()}>CLEAR ALL</button>
                </div>
              </section>
              <section className="leftResultSection">
                <div className="leftResultHead">CATEGORY</div>
                <div className="leftResultText category" id="category"><IoIosArrowForward className="categoryIcon" /> {this.state.category}</div>
              </section>
              <section className="leftResultSection">
                <div className="leftResultHead">PRICE</div>
                <div className="sliderDiv" title="Keyboard arrows also work"><input type="text" id="sliderId" /></div>
              </section>
              <div className="filterBottomDivToAlign">
                <section className="leftResultSection">
                  <div className="leftResultHead">WEBSITES</div>
                  <div id='websiteCheckboxDiv'></div>
                </section>
                <section className="leftResultSection">
                  <div className="leftResultHead">RATING</div>
                  <div className="ratingCheckboxDiv">
                    <div className="custom-control custom-checkbox">
                      <input type="checkbox" id="rating4" className="ratingCheckbox custom-control-input" />
                      <label title="4 star and above" htmlFor="rating4" className="checkboxLabel custom-control-label">
                        4&#9733; & above
                      </label>
                    </div>
                    <div className="custom-control custom-checkbox">
                      <input type="checkbox" id="rating3" className="ratingCheckbox custom-control-input" />
                      <label title="3 star and above" htmlFor="rating3" className="checkboxLabel custom-control-label">
                        3&#9733; & above
                      </label>
                    </div>
                    <div className="custom-control custom-checkbox">
                      <input type="checkbox" id="rating2" className="ratingCheckbox custom-control-input" />
                      <label title="2 star and above" htmlFor="rating2" className="checkboxLabel custom-control-label">
                        2&#9733; & above
                      </label>
                    </div>
                    <div className="custom-control custom-checkbox">
                      <input type="checkbox" id="rating1" className="ratingCheckbox custom-control-input" />
                      <label title="1 star and above" htmlFor="rating1" className="checkboxLabel custom-control-label">
                        1&#9733; & above
                      </label>
                    </div>
                  </div>
                </section>
              </div>
              <div className="resultCount" id="resultCount">{this.state.resultCount} TOTAL RESULTS</div>
            </div>
          </div>

          <div className="result" id="result">
          </div>
        </div>

        <footer id="footer" className="footer">
          <div className="footerTitleAndTop">
            <div className="footerLogo"><span className="footerLogoText" onClick={() => this.reloading()}>PSA</span></div>
            {/* <div className="footerToTop"><span className="footerText" onClick={() => window.scroll({ top: 0, left: 0, behavior: 'smooth' })}>Return to top <TiArrowSortedUp /></span></div> */}
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
          <div className="copyright" id="copyright"><span className="footerYear">&copy; 2021</span>, PRODUCT SEARCH AUTOMATION</div>
        </footer>

      </div>
    )
  }
}

export default ProductSearchAutomation;
