const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const homepageRouter = require('./Routes/homepage.route');
const reportRouter = require('./Routes/report.route');
const searchRouter = require('./Routes/search.route');
const AppConstants = require('./Constants/app.constant');

const port = AppConstants.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (AppConstants.NODE_ENV === 'production') {
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html')); // relative path
  });
}

app.listen(port, () => console.log(`Listening on port ${port}`));

mongoose.connect(AppConstants.CONN_STR, { useNewUrlParser: true, useUnifiedTopology: true }).
  catch(error => {
    console.log('MongoDB : Failed to connect. ', error);
  });

mongoose.connection.on('connected', function () {
  console.log('Mongoose CONNECTED!');
});

mongoose.connection.on('error', function (err) {
  console.log('Mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
  console.log('Mongoose connection disconnected');
});

process.on('SIGINT', function () {
  mongoose.connection.close(function () {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});

app.use('/homepage', homepageRouter);
app.use('/report', reportRouter);
app.use('/search', searchRouter);
