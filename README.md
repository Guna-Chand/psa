# Product Search Automation (PSA)

MULTI-SOURCE REAL-TIME PRODUCT RANKING
> Get the best products from all the e-commerce applications combined. Save time, effort and get everything in one place

- App URL : https://search-automation.herokuapp.com/
- Hosted on [Heroku](https://dashboard.heroku.com/apps/search-automation)
- Uses [MongoDB](https://www.mongodb.com/)

## Local usage details:
- Setup PSA's MongoDB connection string in *System Variables* with key as `CONN_STR_PSA`.
- Replace `"start": "npm run server"` in *package.json* to `"start" : "concurrently \"npm run server\" \"npm run client\""` and do `npm start` to run both server and client locally in one go. **(OR)** Simply do `npm run start-local`.
- Do the vice versa or simply discard changes if any, when pushing them to GIT.
