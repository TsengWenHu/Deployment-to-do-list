//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// connect to mongoDB Atlas
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema)

app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err)
        }else{
          console.log("Successfully insterted items.")
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
});

// add item
app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list
  const item = new Item({name: itemName});
  
  if (listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item)
      foundList.save()
      res.redirect("/"+ listName)
    })
  }
  
});

app.post("/delete", function(req, res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemID, function(err){
      if (err){
        console.log(err)
      }else{
        console.log("Removed items!!")
        res.redirect("/")
      }
    })
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}},  function(err, foundList){
      if (!err){
        res.redirect("/"+ listName)
      }      
    })
  }}
  );
  
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Creatre new list 
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName)
      }else{
        //Show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  })
});

let port = process.env.PORT;
if (port == null || port == ""){
  port == 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
