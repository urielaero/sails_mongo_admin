var connections = require('../../config/connections.js');
var models = require('../../config/models.js').models;
var mongoAdapter = require('sails-mongo');
var Waterline = require('waterline');
var fs = require('fs');

var orm = new Waterline();

//var Models = require('../../api/models');
var Models = fs.readdirSync(__dirname +'/../../api/models/');
console.log(Models);
Models.forEach(function(e,i){
    if(!e || e.indexOf('.js') == -1) return;
    e = e.replace('.js','');
    var Model = require('../../api/models/'+e);
    Model.identity = e.toLowerCase();
    Model.connection = models.connection;


    orm.loadCollection(Waterline.Collection.extend(Model));
});


//--
var connTemp = {};
connTemp[models.connection] = connections.connections[models.connection];
var config = {
    adapters:{
        'sails-mongo':mongoAdapter,
        'sails-mysql':mongoAdapter,
        'sails-postgresql':mongoAdapter,
        'sails-disk':mongoAdapter
    },
    connections:connTemp,//WTF WATERLINE
    defaults:{
        migrate:'safe'
    }
};

//orm.loadCollection(Article);

orm.initialize(config,function(err,coll){
    if(err) throw err;
    console.log('ORM load');
    module.exports[connTemp[models.connection].database] = coll;
    console.log(connTemp[models.connection].database);
    //coll.collections.article.find().limit(1).exec(function(err,ar){
        //console.log(err,ar);
    //});;
});
