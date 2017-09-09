#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var session = require('express-session')
var fs      = require('fs');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var path = require('path');
var routes = require('./routes/index');
var songs = require('./routes/songs');

var User = require('./models/User.js');

var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;

/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = '0.0.0.0';
        self.port = 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    /*
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };
    };
    */

    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        //self.createRoutes();
        //self.app = express.createServer();
        self.app = express();

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };
    
    self.passportInitialize = function() {
        var app = self.app;
        
        //passport init
        passport.use(new FacebookStrategy({
                clientID: process.env.FB_APP_ID,
                clientSecret: process.env.FB_SECRET,
                callbackURL: process.env.FB_CALLBACK,
                //passReqToCallback : true,
                //profileFields: ['id', 'emails', 'name'] 
                //profileFields: ['emails'] 
                profileFields: ['id', 'displayName']
                //profileFields: ['id', 'displayName', 'email']
            },
            function(accessToken, refreshToken, profile, done) {
                //User.findOrCreate(..., function(err, user) {
                //if (err) { return done(err); }
                //done(null, user);
                //});
                
                //http://stackoverflow.com/questions/20431049/what-is-function-user-findorcreate-doing-and-when-is-it-called-in-passport
                User.findOne({
                    'fbId': profile.id }, function(err, user) {
                        if (err) {
                            console.log(err);
                            return done(err);
                        }
                        //No user was found... so create a new user with values from Facebook (all the profile. stuff)
                        if (!user) {
                            /*No longer create user after all fb user has been added
                            console.log(profile);
                            user = new User({
                                name: profile.displayName,
                                fbId: profile.id
                                //email: profile.emails[0].value,
                                //username: profile.username,
                                //facebook: profile.email
                                //fbid: profile._json.id,
                                //facebook: profile._json
                                //createDate: new Date(),
                                //updateDate: new Date()
                                //provider: 'facebook',
                                //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line
                                //facebook: profile._json
                                
                            });
                            console.log('profile id' + profile.id);
                            console.log(user);
                            user.save(function(err) {
                                if (err) console.log(err);
                                return done(err, user);
                            });
                            */
                            
                            /*User.create(user, function (err, post) {
                                if (err) console.log(err);
                                return done(err, user);
                            });*/
                        } else {
                            //found user. Return
                            return done(err, user);
                        }
                    });
                
                //return done(null, profile);
            }
        ));
        
        passport.serializeUser(function(user, done) {
            done(null, user);
            //done(null, user.id);
        });

        passport.deserializeUser(function(user, done) {
            done(null, user);
            //done(null, user.id);
        });
        
        app.use(session({ secret: 'keyboard cat' }));
        app.use(passport.initialize());
        app.use(passport.session());
        
        // Redirect the user to Facebook for authentication.  When complete,
        // Facebook will redirect the user back to the application at
        //     /auth/facebook/callback
        //app.get('/auth/facebook', passport.authenticate('facebook', { authType: 'rerequest', scope: ['email']}));
        app.get('/auth/facebook', passport.authenticate('facebook'));

        // Facebook will redirect the user to this URL after approval.  Finish the
        // authentication process by attempting to obtain an access token.  If
        // access was granted, the user will be logged in.  Otherwise,
        // authentication has failed.
        app.get('/auth/facebook/callback',
        passport.authenticate('facebook', { successRedirect: '/',
                                            failureRedirect: '/login' }));
                                            
        //module.exports = function(req, res, next) {
        app.use(function(req, res, next) {
            if (req.isAuthenticated()) {
                return next();
            }
            else{
                return res.redirect('/auth/facebook');
            }
        });
    };
    
    self.customInitialize = function() {
        var app = self.app;

        // view engine setup
        app.set('views', path.join(__dirname, 'views'));
        app.set('view engine', 'ejs')
        
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(cookieParser());
        
        self.passportInitialize();

        // uncomment after placing your favicon in /public
        //app.use(favicon(__dirname + '/public/favicon.ico'));
        /*
        app.use(logger('dev'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(cookieParser());*/
        app.use(express.static(path.join(__dirname, 'public')));

        app.use('/', routes);
        app.use('/songs', songs);
        
        // Database connections
        var url = 'mongodb://localhost/kmbApp';

        // if OPENSHIFT env variables are present, use the available connection info:
        if (process.env.OPENSHIFT_MONGODB_DB_URL) {
            url = process.env.OPENSHIFT_MONGODB_DB_URL +
            process.env.OPENSHIFT_APP_NAME;
        }
		
		console.log('url = ', url);

        var mongoose = require('mongoose');
        mongoose.connect(url, function(err) {
            if(err) {
                console.log('connection error', err);
            } else {
                console.log('connection successful');
            }
        });


        // catch 404 and forward to error handler
        app.use(function(req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });
        
        /*
        // error handlers

        // development error handler
        // will print stacktrace
        if (app.get('env') === 'development') {
            app.use(function(err, req, res, next) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            });
        }

        // production error handler
        // no stacktraces leaked to user
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {}
            });
        });
        */
    }


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
        
        self.customInitialize();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

