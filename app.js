const Sequelize = require('sequelize');
const sequelize = new Sequelize('codeit_task', 'root', 'root',
    {
        host: 'localhost',
        dialect: 'mysql'
    }
);

const Op = Sequelize.Op;

const Page = sequelize.define('page', {
    title: Sequelize.STRING,
    metaDescription: Sequelize.STRING,
    content: Sequelize.TEXT,
    url: Sequelize.STRING
});

async function run(){
    await sequelize.sync({alter: true});
    console.log('synced');
}
run();

var express = require('express');
var app = express();
var pug = require('pug');
var bodyParser = require('body-parser');
app.use(express.urlencoded());
app.use(express.static('static'));

// GET method route
app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/admin/list', function (req, res) {
    Page.findAll().then(pages => {
        // renderFile
        var html = pug.renderFile('admin-list.pug', {pages: pages});
        res.send(html);
    });
});

app.get('/admin/create', function (req, res) {
    // renderFile
    var html = pug.renderFile('admin-create.pug', {
        form: {
            title: '',
            metaDescription: '',
            content: '',
            url: ''
        },
        errors: {
            title: '',
            metaDescription: '',
            content: '',
            url: ''
        }
    });
    res.send(html);
});

app.delete('/admin/delete', function(req, res) {
    Page.destroy({
        where: {
            id: req.body.pageId
        }
    });
    res.sendStatus(200);
});

function checkRequiredField(fieldName, fieldLabel, form, results) {
    if (!form[fieldName] || !form[fieldName].trim()) {
        results[fieldName] = fieldLabel + " is required!";
        results.hasErrors = true;
    }
}

async function validate(form, errors) {
    var results = {
        hasErrors: false
    };

    checkRequiredField('title', 'Title', form, results);
    checkRequiredField('content', 'Content', form, results);
    checkRequiredField('url', 'URL', form, results);
    
    Page.count({
        where: {url: form.url}
    }).then(
            count => {
       if (count > 0) {
           results.url = 'Url should be unique!';
           console.log(results)
           results.hasErrors = true;
       } 
    });
    
    return results;
}

app.post('/admin/create', async function (req, res) {
    var validationResults = await validate(req.body);
    
    
    if (!validationResults.hasErrors) {
        Page.create(req.body);
        res.redirect(301, '/admin/list');
    } else {
        console.log(validationResults)
        var html = pug.renderFile('admin-create.pug', {
            form: req.body,
            errors: validationResults
        });
        res.send(html);
    }
});

app.get('/*.html', function (req, res) {
    // render public pages
    var matchedUrl = req.path.match(/\/(.*)\.html/);
    if (matchedUrl.length !== 2) {
        res.sendStatus(400);
        return;
    }
    
    Page.findOne({ where: {url: matchedUrl[1]} }).then(page => {
        if (page) {
            var html = pug.renderFile('public.pug', {page: page});
            res.send(html);
        } else {
            res.sendStatus(404);
        }
    }, () => {
        res.sendStatus(500);
    });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
