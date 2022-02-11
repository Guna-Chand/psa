const SearchTerms = require("../Models/searchTerms");
const Visit = require("../Models/visit");
const getFlipCarousal = require("../Services/getCarousal.service");
const getImage = require("../Services/getImage.service");

const topFive = async (req, res) => {
    let date = new Date();
    Visit.updateOne(
        { inde: 1 },
        { $inc: { totalVisits: 1 }, $set: { lastVisit: date } },
        { upsert: true }
    );

    SearchTerms.find({}).sort({ frequency: -1 }).limit(5).then((resu) => {
        let imgSrc = [];
        Promise.allSettled([
            getImage(resu[0].searchTerm),
            getImage(resu[1].searchTerm),
            getImage(resu[2].searchTerm),
            getImage(resu[3].searchTerm),
            getImage(resu[4].searchTerm)
        ]).then(results => {
            results.forEach(result => {
                if (result.status === "fulfilled" && result.value !== "") {
                    imgSrc.push(result.value);
                } else {
                    console.error(result);
                }
            });
            res.send([resu, imgSrc]);
        }).catch(error => {
            console.log(error);
            res.send([resu, imgSrc]);
        });
    }).catch(err => {
        res.send([]);
        console.log(err);
    });
};

const searchSuggestions = (req, res) => {
    try {
        let searchTerm = new RegExp(req.body.searchTerm);

        SearchTerms.find({ searchTerm: searchTerm }).sort({ frequency: -1 }).limit(10).then((resu) => {
            res.send(resu);
        }).catch(er => {
            res.send([]);
            console.log(er);
        })
    } catch (error) {
        console.log(error);
    }
};

const getVisitCount = (req, res) => {

    Visit.find({ inde: 1 }).then(resuu => {
        res.send(resuu);
    }).catch(errr => {
        res.send('Retrieving...');
        console.log(errr);
    });
};

const getCarousal = async (req, res) => {
    let data = await getFlipCarousal();
    res.send(data);
};

module.exports = {
    searchSuggestions,
    getVisitCount,
    getCarousal,
    topFive
};
