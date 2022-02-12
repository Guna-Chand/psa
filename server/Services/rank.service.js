// standard for sorting products with close rating value.
// 1 - 10 represents number of digits
// "maxRatingCountDiff" is the max rating count difference to consider sorting
// "minRatingValueDiff" is the min rating value difference to consider sorting
// both "maxRatingCountDiff" and "minRatingValueDiff" must be satisfied to consider sorting
const standard = {
    1: { "maxRatingCountDiff": 3, "minRatingValueDiff": 0.3},
    2: { "maxRatingCountDiff": 20, "minRatingValueDiff": 0.3},
    3: { "maxRatingCountDiff": 300, "minRatingValueDiff": 0.3},
    4: { "maxRatingCountDiff": 2500, "minRatingValueDiff": 0.3},
    5: { "maxRatingCountDiff": 7000, "minRatingValueDiff": 0.3},
    6: { "maxRatingCountDiff": 30000, "minRatingValueDiff": 0.3},
    7: { "maxRatingCountDiff": 1000000, "minRatingValueDiff": 0.3},
    8: { "maxRatingCountDiff": 10000000, "minRatingValueDiff": 0.2},
    9: { "maxRatingCountDiff": 100000000, "minRatingValueDiff": 0.2},
    10: { "maxRatingCountDiff": 1000000000, "minRatingValueDiff": 0.2}
};

// method that sorts given data using the above mentioned standard
function humanSort(data) {
    data.sort(function (a, b) {
        let leftRatingCount = a.ratingCount;
        let rightRatingCount = b.ratingCount;
        let leftDigits = leftRatingCount.toString().length;
        let rightDigits = rightRatingCount.toString().length;
        if (leftDigits != rightDigits)
            return 0;
        else {
            let rules = standard[leftDigits];
            let ratingCountDiff = rightRatingCount - leftRatingCount;
            let ratingDiff = Number((a.rating - b.rating).toFixed(1));
            if (ratingCountDiff > 0 && ratingCountDiff <= rules["maxRatingCountDiff"] && ratingDiff >= rules["minRatingValueDiff"])
                return -1;
            else
                return 1;
        }
    });
    return data;
}

const rankProducts = (data) => {

    // 1. Sort whole data as per rating [Descending]
    data.sort(function (a, b) {
        return b.rating - a.rating;
    });

    let count = 0

    // 2. Count the number of products >= 3.0 rating
    for (let i = 0; i < data.length; i++) {
        if (data[i].rating >= 3.0) {
            count++;
        }
    }

    // 3. Create an array with products of rating >= 3.0
    var dataTop = data.slice(0, count);

    // 4. Sort the above array (dataTop) as per rating count [Descending]
    if (dataTop.length > 1) {
        dataTop.sort(function (a, b) {
            return b.ratingCount - a.ratingCount;
        });
    }

    // 5. Sort the data of rating 3.0 to 5.0 as per how our mind picks up rating vs ratingCount 
    dataTop = humanSort(dataTop);

    // 6. Create an array with products of rating < 3.0
    var dataBottom = data.slice(count,);

    // 7. Merge these two arrays with dataBottom at the end
    if (dataBottom.length > 0) {
        dataTop.push(...dataBottom);
    }
    data = dataTop;

    // Finally the data will have sorted items as per rating count from prodcuts having 5.0 to 3.0 rating and the rest of the products are sorted as per rating

    return data;
}

module.exports = rankProducts;