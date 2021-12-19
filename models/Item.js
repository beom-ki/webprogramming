const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  itemId: Number,
  player: { type: Schema.Types.ObjectId, ref: "Player" }
});

const Item = mongoose.model("Item", schema);

module.exports = {
  Item
};
