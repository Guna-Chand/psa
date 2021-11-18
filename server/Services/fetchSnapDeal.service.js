const cheerio = require('cheerio');

// Currently not used -- Just archiving
const fetchSnapDeal = (html) => {

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

            if (imageSrc)
                imageSrc = imageSrc.replace("/large", '');

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
                ratingCount = parseInt(ratingCount.slice(1, -1));
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
};

module.exports = fetchSnapDeal;