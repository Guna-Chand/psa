const SearchTerms = require("../Models/searchTerms");
const fetchAmazon = require('../Services/fetchAmazon.service');
const fetchFlipkart = require('../Services/fetchFlipkart.service');
const fetchMyntra = require("../Services/fetchMyntra.service");
const getCategory = require("../Services/getCategory.service");
const rankProducts = require("../Services/rank.service");

function checkIfMyntraIsSearchable(categories) {
    let response = false;
    categories = categories.join(" ").toLowerCase();
    myntraList = ["clothing", "beauty", "furnishing", "lighting", "decor", "cases", "books", "audio", "jewellery",
        "bags", "wallets", "belts", "eyewear", "Sunglasses", "watches", "kitchen appliances", "kitchen, cookware & serveware", "baby care", "toys", "footwear", "gift", "wearable", "kids", "pet", "pens", "health"];
    for (const cat of myntraList) {
        if (categories.includes(cat)) {
            response = true;
            break;
        }
    }
    return response;
}

const getSearchResults = async (req, res) => {
    let searchTerm = req.body.searchTerm.trim();

    let data = [];
    let category = "UNABLE TO DETECT";
    let isMyntraSearchable = false;
    let categories = await getCategory(searchTerm);
    if (categories.length !== 0) {
        category = categories[categories.length - 1];
        isMyntraSearchable = checkIfMyntraIsSearchable(categories);
    }

    Promise.allSettled([
        fetchFlipkart(searchTerm, 1),
        fetchAmazon(searchTerm, 1),
        fetchMyntra(searchTerm, 1, isMyntraSearchable)
    ]).then(results => {
        results.forEach((result, index) => {
            try {
                if (result.status === "fulfilled") {
                    data = data.concat(result.value);
                } else {
                    console.error(result);
                }
            } catch (err) {
                console.log(err);
            }
        });
        res.send([rankProducts(data), category]);
    }).catch(error => {
        console.log(error);
        res.send([rankProducts(data), category]);
    });

    let result = await SearchTerms.updateOne(
        { searchTerm: searchTerm },
        { $inc: { frequency: 1 } },
        { upsert: true }
    );

    if (result === 1) {
        console.log('Search Term -- Updated');
    } else {
        console.log('Search Term -- Inserted');
    }
};

module.exports = { getSearchResults };