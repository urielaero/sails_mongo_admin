var config = require('../config');
var bson = require('../bson');
var util = require('util');
var mongodb = require('mongodb');


exports.viewDocument = function(req, res, next) {
  var ctx = {
    title:req.collectionName.toUpperCase() +'-> Viewing Document: ' + req.document._id,
    editorTheme: config.options.editorTheme,
    docString: bson.toString(req.document),
    relations:req.relations,
    relationsName:req.relationsName,
    relationsKey: req.relationsName && Object.keys(req.relationsName) || false,
    buttonCallUpdate: config.options.callbackUpdate && config.options.callbackUpdate[req.dbName]
  };

  //var rls = { fraction: 'article', header: 'article' };
  if(!ctx.relations)
      res.render('document', ctx);
  else{
    ctx.preprocess = function(ori,collection){
        var obj = ori.toObject();
        delete obj.id;
        delete obj._id;
	
        var rls = req.rls[collection] || [];
        for(var col=0;col<rls.length;col++){
            var key = rls[col];
            if(obj[key])
            obj[key] = {model:key,id:obj[key]};
        }

        return bson.toString(obj);
    };
    res.render('documentRels', ctx);

  }

};


exports.addDocument = function(req, res, next) {
  var doc = req.body.document;

  if (doc == undefined || doc.length == 0) {
    req.session.error = "You forgot to enter a document!";
    return res.redirect('back');
  }

  var docBSON;

  try {
    docBSON = bson.toBSON(doc);
  } catch (err) {
    req.session.error = "That document is not valid!";
    console.error(err);
    return res.redirect('back');
  }

  req.collection.insert(docBSON, {safe: true}, function(err, result) {
    if (err) {
      req.session.error = "Something went wrong: " + err;
      console.error(err);
      return res.redirect('back');
    }

    req.session.success = "Document added!";
    res.redirect(config.site.baseUrl+'db/' + req.dbName + '/' + req.collectionName);
  });
};


exports.updateDocument = function(req, res, next) {
  var doc = req.body.document;
  if (doc == undefined || doc.length == 0) {
    req.session.error = "You forgot to enter a document!";
    return res.redirect('back');
  }

  var docBSON;
  try {
    docBSON = bson.toBSON(doc);
  } catch (err) {
    req.session.error = "That document is not valid!";
    console.error(err);
    return res.redirect('back');
  }

  docBSON._id = req.document._id;

  req.collection.update(req.document, docBSON, {safe: true}, function(err, result) {
    if (err) {
      //document was not saved
      req.session.error = "Something went wrong: " + err;
      console.error(err);
      return res.redirect('back');
    }

    req.session.success = "Document updated!";
    return res.redirect('back');
    //res.redirect(config.site.baseUrl+'db/' + req.dbName + '/' + req.collectionName+'/'+req.document._id.toString());
  });
};


exports.deleteDocument = function(req, res, next) {
  req.collection.remove(req.document, {safe: true}, function(err, result) {
    if (err) {
      req.session.error = "Something went wrong! " + err;
      console.error(err);
      return res.redirect('back');
    }

    req.session.success = "Document deleted!";
    res.redirect(config.site.baseUrl+'db/' + req.dbName + '/' + req.collectionName);
  });
};

exports.callbackDocument = function(Models){
    return function(req, res, next){
        console.log(req.body.func);

        var methodOfModel = req.body.func;

        if(Models[req.dbName] && Models[req.dbName].collections[req.collectionName] && Models[req.dbName].collections[req.collectionName] && config.options.callbackUpdate[req.dbName] && config.options.callbackUpdate[req.dbName][req.collectionName]){
            console.log("PASO IF")
            var buttons = config.options.callbackUpdate[req.dbName][req.collectionName] || [];
            var exist = false;
            for(var button=0;button<buttons.length;button++){
                console.log(buttons[button]);
                if(buttons[button].modelMethod == methodOfModel){
                    console.log("exist");
                    exist = true;
                    break;
                }    
            }

            var trigger = exist?methodOfModel:false;
            var coll = Models[req.dbName].collections[req.collectionName];

            coll.findOne({id:req.document_id}).exec(function(err,co){
                if(co[trigger]){ 
                    co[trigger](function(err,status){
                        if(err){
                            req.session.error = "Error in trigger "+trigger;
                            return res.redirect('back');
                        }
                        req.session.success = "Method " + trigger + " of model success.";
                        return res.redirect('back');
                    });
                }else if(trigger == 'clone'){
                    var baseId = co.id;
                    delete co.id;
                    console.log("Clonado",co);
                    coll.create(co).exec(function(err,nCo){
                        console.log(err,nCo);
                        req.session.success = "Method " + trigger + " of model success. base id: " + baseId;
                        if(nCo.insertCloneElastic){
                            nCo.insertCloneElastic(baseId,function(err){
                                req.session.success += err?', Elastic insert success!':'Failed!'; 
                                return res.redirect('/db/'+req.dbName+'/'+req.collectionName+'/'+nCo.id);
                            });
                        
                        }else{
                            return res.redirect('/db/'+req.dbName+'/'+req.collectionName+'/'+nCo.id);
                        }
                    });


                }else{
                    req.session.error = "Not callback method " + trigger +" find.";
                    return res.redirect('back');        
                }
            });
        
        }else{
            req.session.error = "Not callback method find.";
            return res.redirect('back');
        }
    };
}
