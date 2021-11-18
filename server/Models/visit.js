const mongoose = require("mongoose");

const visit = new mongoose.Schema({
    inde: Number,
    totalVisits: Number,
    lastVisit: Date
});

module.exports = mongoose.model("Visit", visit, "visit");