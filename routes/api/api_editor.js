var express = require('express');
var _ = require('lodash');
var router = express.Router();
var modelsInteractor = require('./ModelsInteractor');
var configureResp = require('./configure_resp');

var mongoose = require('mongoose');
var Model = mongoose.model('model');


var RESP = configureResp({
    ok: {
        status: 200,
        msg: 'ok'
    },

    invalidModel: {
        status: 401,
        msg: 'Provided model is not valid'
    },

    modelIdIsRequired: {
        status: 402,
        msg: 'Model id is required'
    },

    modelSavingError: {
        status: 501,
        msg: 'Error happened while saving a model'
    },

    modelUpdatingError: {
        status: 502,
        msg: 'Error happened while updating a model'
    },

    modelNotFound: {
        status: 404,
        msg: 'Requested model not found'
    },

    modelsSelectingError: {
        status: 503,
        msg: 'Error happened while selecting models'
    }
});

router.post('/model', function(req, res, next) {
    var model = req.body;
    if (modelsInteractor.validate(model)) {
        modelsInteractor.save(model, function(err, saved_model) {
            if (err) {
                console.error("Error while saving model: ", err);
                res.status(500).json(RESP.modelSavingError());
                return;
            }

            res.json(RESP.ok({
                _id: saved_model._id
            }));
        });
    } else {
        res.status(400).json(RESP.invalidModel());
    }
});

router.put('/model', function(req, res, next) {
    // TODO
    var model = req.body;
    if (modelsInteractor.validate(model, true)) {
        var id = model._id;
        delete model._id;  // or mongo will try to save id as String

        Model.update(id, model, { upsert: false }, function(err) {
            if (err) {
                console.error("Error while updating model: ", err);
                res.status(500).json(RESP.modelUpdatingError());
                return;
            }

            res.json(RESP.ok());
        });


    } else {
        res.status(400).json(RESP.invalidModel());
    }
});

router.get('/model', function(req, res, next) {
    var model_id = req.query.id;
    if (model_id) {
        modelsInteractor.get(model_id, function(err, model) {
            if (err) {
                console.error("Error while selecting: ", err);
                res.status(500).json(RESP.modelsSelectingError());
                return;
            }

            if (model) {
                res.json(RESP.ok({
                    model: model
                }));
            } else {
                res.status(404).json(RESP.modelNotFound());
            }
        });
    } else {
        res.status(400).json(RESP.modelIdIsRequired());
    }
});

router.get('/model/list', function(req, res, next) {
    Model.find({}, { _id: true, name: true }, function(err, models) {
        if (err) {
            console.error("Error while selecting: ", err);
            res.status(500).json(RESP.modelsSelectingError());
            return;
        }

        if (!models) {
            models = [];
        }

        res.json(RESP.ok({
            models: models
        }));
    });
});


module.exports = router;