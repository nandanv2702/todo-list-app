//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

// Defining MongoDB requirements and schema
const mongoDB = 'mongodb://127.0.0.1/todo';
mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema)

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const item1 = new Item({
  name: "Welcome to the To-Do List!"
});
const item2 = new Item({
  name: "You can add items using the '+' button below"
});
const item3 = new Item({
  name: "You can remove items by clicking the checkbox here!"
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

  const day = date.getDate();

  Item.find({}, function(err, foundItems) {
    if (!err) {
      if (foundItems.length !== 0) {
        res.render("list", {
          listTitle: "Today",
          listItems: foundItems
        });
      } else {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log("Error");
          } else {
            console.log("Successfully added to an empty DB!");
            res.redirect("/");
          };
        });
      };
    } else {
      console.log("Error!")
    };
  });
});

app.get('/:customListName', function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        console.log("Didn't find list!");
        const newList = new List({
          name: customListName,
          items: defaultItems
        });
        newList.save();
        res.redirect(`/${customListName}`)
      } else {
        console.log("Found list");
        res.render('list', {
          listTitle: foundList.name,
          listItems: foundList.items
        });
      };
    };
  });

});

app.get("/about", function(req, res) {
  res.render("about");
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.listTitle;
  const day = date.getDate();

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, function(err, foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect(`/${listName}`);
    });
  };
});

app.post('/delete', function(req, res) {
  const checkedItemID = req.body.delItem;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemID, function(err) {
      if (!err) {
        console.log("Successfully removed an item!");
        res.redirect('/');
      } else {
        console.log("Error removing item")
      };
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList){
      if(!err){
        res.redirect(`/${listName}`)
      }
    })
  }

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
