// Modules used
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// application uses and functions
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// Mongoose DB connection
mongoose.connect("mongodb+srv://admin-deadman:Admin@deadman@cluster0.stpku.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

// DB Model schemas
const itemsSchema = ({
  name: String
});
const listSchema = {
  name: String,
  items: [itemsSchema]
}

// Collection models
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

// Default collections items
const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the \"+\" button to add a new item"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

// Collection items array
const defaultItems = [item1, item2, item3];

// Get method - Default route
app.get("/", function(req, res) {
  Item.find(function(err, founditems){
    if(founditems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("Successfully inserted default data to the DB");
        }
      });
      res.redirect("/");
    }
    else{
      res.render("list", {
        listTitle: "Today",
        newListItems: founditems
      });
    }
  });
});

// Get custom route
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        // console.log("Doesn't exists");
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else{
        // console.log("Exists");
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });
});

// Get method - about route
app.get("/about", function(req, res) {
  res.render("about");
});

// Post method - Adding new item
app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({
    name: itemName
  });
  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// Post method - deleting an item
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, (err) =>{
      if(!err){
        console.log("Item removed successfully");
        res.redirect("/");
      }
    });
  }
  else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}},function(err, results){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});

//  Port allocation method

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
