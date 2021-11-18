const mongoose = require("mongoose");

const searchTerms = new mongoose.Schema({
    searchTerm: { type: String, default: 'Nope' },
    frequency: { type: Number, min: 1 }
});

module.exports = mongoose.model("SearchTerms", searchTerms, "searchTerms");