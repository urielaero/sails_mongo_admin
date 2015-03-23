var globalConfig = require('../config').options;
if(!globalConfig.sailsPaths || !globalConfig.sailsPaths.length ) return 0;

var mongoAdapter = require('sails-mongo');
var Waterline = require('waterline');
var fs = require('fs');

var connTempCount = 0;
var connTempG = {};

for(var path=0;path<globalConfig.sailsPaths.length;path++){
    loadWithPath(globalConfig.sailsPaths[path]);
}


function loadWithPath(path){
    var connections = require(path+'/config/connections.js');
    var models = require(path+'/config/models.js').models;

    
    var orm = new Waterline();

    var Models = fs.readdirSync(path +'/api/models/');

    var connTemp = {};
    var connName;//diferente connect 
    if(connTempG[models.connection]){
        connName = models.connection + (connTempCount++).toString();
        connTemp[connName] = connections.connections[models.connection];
    }else{
        connName = models.connection;
        connTempG[connName] = connections.connections[models.connection];
        connTemp[connName] = connections.connections[models.connection];
    }

    Models.forEach(function(e,i){
        if(!e || e.indexOf('.js') == -1) return;
        e = e.replace('.js','');
        var Model = require(path+'/api/models/'+e);
        Model.identity = e.toLowerCase();
        Model.connection = connName;

        orm.loadCollection(Waterline.Collection.extend(Model));
    });

    var config = {
        adapters:{
            'sails-mongo':mongoAdapter,
        },
        connections:connTemp,//WTF WATERLINE
        defaults:{
            migrate:'safe'
        }
    };


    orm.initialize(config,function(err,coll){
        if(err) throw err;
        module.exports[connTemp[connName].database] = coll;
        console.log('load',connTemp[connName].database);
    });
}
