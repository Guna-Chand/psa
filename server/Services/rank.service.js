

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

    // 5. Create an array with products of rating < 3.0
    var dataBottom = data.slice(count,);

    // 6. Merge these two arrays with dataBottom at the end
    if (dataBottom.length > 0) {
        dataTop.push(...dataBottom);
    }
    data = dataTop;

    // Finally the data will have sorted items as per rating count from prodcuts having 5.0 to 3.0 rating and the rest of the products are sorted as per rating

    return data;
}

module.exports = rankProducts;