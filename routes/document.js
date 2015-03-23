var config = require('../config');
var bson = require('../bson');
var util = require('util');
var mongodb = require('mongodb');


exports.viewDocument = function(req, res, next) {
  var ctx = {
    title: 'Viewing Document: !!' + req.document._id,
    editorTheme: config.options.editorTheme,
    docString: bson.toString(req.document),
    relations:req.relations,
    relationsName:req.relationsName,
    relationsKey: req.relationsName && Object.keys(req.relationsName) || false,
  };

  //var rls = { fraction: 'article', header: 'article' };
  if(!ctx.relations)
      res.render('document', ctx);
  else{
    ctx.preprocess = function(ori,collection){
        var obj = ori.toObject();
        delete obj.id;
        delete obj._id;

        if(req.rls[collection] && obj[req.rls[collection]]){
            var key = req.rls[collection]
            obj[key] = {model:key,id:obj[key]}
        }
        //obj['article'] = {model:'article',id:obj.article};

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
