const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const lodash = require('lodash');

const date = require(__dirname + '/date.js');

const dotenv = require('dotenv');
dotenv.config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect(`${process.env.MONGODB_URI}`, { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = {
    name: {
        type: String,
        required: [true, "To-Do item can't be blank."]
    }
}
const Item = new mongoose.model('Item', itemsSchema);

const item1 = new Item({ name: 'Welcome to the To-Do List app!' });
const item2 = new Item({ name: 'Click the + button to add a new item.' });
const item3 = new Item({ name: '<== Click the checkbox to delete an item.' });
const defaultItems = [item1, item2, item3];

const listSchema = {
    name: {
        type: String,
        required: [true, "List title can't be blank."]
    },
    items: [itemsSchema]
}
const List = new mongoose.model('List', listSchema);

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Express server listening on port ${port}.`));

app.get('/', (req, res) => {
    const listTitle = date.getDate();

    Item.find({}, (err, items) => {
        if (err) {
            console.log(err);
        } 
        else {
            if (items.length === 0) {
                Item.insertMany(defaultItems, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Default items added to DB!');
                    }
                    res.redirect('/');
                })
            } 
            else {
                res.render('list', { listTitle, items });
            }
        }
    });
});

app.post('/', (req, res) => {
    const { newItem, list } = req.body;
    const item = new Item({
        name: newItem
    });

    if (list === date.getDate()) {
        item.save();
        res.redirect('/');
    } 
    else {
        List.findOne({ name: list }, (err, foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect(`/${list}`);
        });
    }
});

app.post('/delete', (req, res) => {
    const { checkedItemId, listName } = req.body

    if (listName === date.getDate()) {
        Item.findByIdAndRemove(checkedItemId, (err) => {
            if (err) {
                console.log(err);
            } 
            else {
                console.log('Item deletion successful!');
                res.redirect('/');
            }
        });
    } 
    else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, (err, foundList) => {
            if (err) {
                console.log(err);
            } 
            else {
                console.log('Item deletion successful!');
                res.redirect(`/${listName}`);
            }
        });
    }
});


app.get('/:customListName', (req, res) => {
    const customListName = lodash.capitalize(req.params.customListName);
    List.findOne({ name: customListName }, (err, foundList) => {
        if (err) {
            console.log(err);
        } 
        else {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save((err) => {
                    res.redirect(`/${customListName}`);
                })
            } 
            else {
                res.render('list', { listTitle: foundList.name, items: foundList.items });
            }
        }
    });
});

app.get('/about', (req, res) => {
    res.render('about');
})