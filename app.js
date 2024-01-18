const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();
const port =  3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


mongoose.connect('mongodb://127.0.0.1/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const itemSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemSchema]
};

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

const defaultItems = [
  { name: "Finish homework" },
  { name: "Create todo list" },
  { name: "Workout in the morning" }
];

app.get("/", (req, res) => {
  Item.find({})
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems);
        console.log ("defalt items inserted sucesfully")
      }
      else{
        res.render("list",{listTitle: "Today", newListItems: foundItems})
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Internal Server Error")
    });

});


app.get("/:customListName", (req, res) => {
  const customListName =_.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (foundList) {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      } else {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save()
        .then(() => {
          res.redirect("/" + customListName);
        });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Internal Server Error in custom rout");
    });
});



app.post("/", (req, res) => {
  const newItemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: newItemName
  });

  if (listName === "Today") {
    newItem.save()
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Internal Server Error post");
      });
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/"+ listName);
      })

      .catch((err) => {
        console.error(err);
        res.status(500).send("Internal Server Error post");
      });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  console.log(checkedItemId);
  const listName = req.body.listName;

  if (listName === "Today") {
    // Delete the item if it's in the "Today" list
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log(`Item with ID ${checkedItemId} deleted successfully.`);
        res.redirect("/");
      })
      .catch((err) => {
        console.error(`Error deleting item with ID ${checkedItemId}: ${err}`);
        res.status(500).send("Internal Server Error deleting");
      });
  } else {
    // Remove the item from a custom list
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(() => {
        console.log(`Item with ID ${checkedItemId} deleted successfully from list ${listName}.`);
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error(`Error deleting item with ID ${checkedItemId} from list ${listName}: ${err}`);
        res.status(500).send("Internal Server Error deleting");
      });
  }
  
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
