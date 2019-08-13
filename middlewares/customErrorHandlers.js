exports.logErrorHandler = function(err, req, res, next){
    console.error(err.stack);
    // res.status(500).send('Something broke!');
    next(err);// passes the error to Express
}

exports.xhrErrorHandler = function(err, req, res, next){
    if(req.xhr){
        res.status(500).send({error: 'something wrong'})
    }
    else{
        next(err);
    }
}

exports.notFoundErrorHandler = function(err, req, res, next){
    next(createError(404)); // catch 404 and forward to error handler
}

exports.finalErrorHandler = function(err, req, res, next){
    // must delegate to the default Express error handler, when the headers have already been sent
    if(res.headersSent){
        return next(err);
    }

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error', {error: err});// error.pug 
}