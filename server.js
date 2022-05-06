// Core dependencies
const fs = require('fs')
const path = require('path')
const url = require('url')
const axios = require('axios');

// NPM dependencies
const bodyParser = require('body-parser')
const dotenv = require('dotenv')
const express = require('express')
const nunjucks = require('nunjucks')
const sessionInCookie = require('client-sessions')
const sessionInMemory = require('express-session')

// Run before other code to make sure variables from .env are available
dotenv.config()

// Local dependencies
const middleware = [
    require('./lib/middleware/authentication/authentication.js'),
    require('./lib/middleware/extensions/extensions.js')
]
const config = require('./app/config.js')
const documentationRoutes = require('./docs/documentation_routes.js')
const packageJson = require('./package.json')
const routes = require('./app/routes.js')
const utils = require('./lib/utils.js')
const extensions = require('./lib/extensions/extensions.js')

// Variables for v6 backwards compatibility
// Set false by default, then turn on if we find /app/v6/routes.js
var useV6 = false
var v6App
var v6Routes

if (fs.existsSync('./app/v6/routes.js')) {
    v6Routes = require('./app/v6/routes.js')
    useV6 = true
}

const app = express()
const documentationApp = express()

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(express.json());

app.get("/", (req, res) => {
    resetFormFields();
    res.redirect("/versions/index");
});

var NotifyClient = require('notifications-node-client').NotifyClient,
    notify = new NotifyClient(process.env.NOTIFYAPIKEY);

const visited = {
    siteOdsCode: '',
    organisationName: '',
    organisationBuilding: '',
    organisationStreet: '',
    organisationTown: '',
    organisationPostcode: '',
    supplierName: '',
    productName: '',
    signatoryName: '',
    signatoryJobTitle: '',
    signatoryEmail: '',
    proxySignatoryName: '',
    proxySignatoryJobTitle: '',
    proxySignatoryEmail: '',
    signatoryProxyDeclaration: '',
    careSetting: '',
    reasonAgreement: '',
    agreeAgreement: ''
};

const search = {
    providerCode: '',
    providerName: '',
    ccgCode: '',
    ccgName: ''
};

const searchResultsCount = {
    invalidCount: 0,
    totalCount: 0,
    hasHtmlView: 0,
    hasStructured: 0,
    hasAppointment: 0,
    hasSendDocument: 0
};

const notCompletedArray = [];

const searchResults = [];

const enabledProgressBookmarks = {
    step1: true,
    step2: false,
    step3: false,
    step3a: false,
    step4: false,
    step5: false,
    step6: false,
    inlineAgreement: false,
    step7: false,
    review: false
}

function resetSearchFields() {
    search.ccgCode = '';
    search.ccgName = '';
    search.providerCode = '';
    search.providerName = '';
    searchResultsCount.invalidCount = 0;
    searchResultsCount.totalCount = 0;
    searchResultsCount.hasHtmlView = 0;
    searchResultsCount.hasStructured = 0;
    searchResultsCount.hasAppointment = 0;
    searchResultsCount.hasSendDocument = 0;
}

function resetFormFields() {

    notCompletedArray.length = 0;

    visited.siteOdsCode = '';
    visited.organisationName = '';
    visited.organisationBuilding = '';
    visited.organisationStreet = '';
    visited.organisationTown = '';
    visited.organisationPostcode = '';
    visited.supplierName = '';
    visited.productName = '';
    visited.signatoryName = '';
    visited.signatoryJobTitle = '';
    visited.signatoryEmail = '';
    visited.signatoryProxyDeclaration = '';
    visited.proxySignatoryName = '';
    visited.proxySignatoryJobTitle = '';
    visited.proxySignatoryEmail = '';
    visited.careSetting = '';
    visited.reasonAgreement = '';
    visited.agreeAgreement = '';
    visited.haveOrganisationDetails = false;

    enabledProgressBookmarks.step1 = true;
    enabledProgressBookmarks.step2 = false;
    enabledProgressBookmarks.step3 = false;
    enabledProgressBookmarks.step3a = false;
    enabledProgressBookmarks.step4 = false;
    enabledProgressBookmarks.step5 = false;
    enabledProgressBookmarks.step6 = false;
    enabledProgressBookmarks.inlineAgreement = false;
    enabledProgressBookmarks.step7 = false;
    enabledProgressBookmarks.review = false;
}

app.get("/*/step-1", (req, res) => {
    if (enabledProgressBookmarks.step1) {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
    else {
        res.redirect("./index");
    }
});

app.get("/*/step-2", (req, res) => {
    if (enabledProgressBookmarks.step2) {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
    else {
        res.redirect("./index");
    }
});

app.get("/*/step-3", (req, res) => {
    if (enabledProgressBookmarks.step3) {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
    else {
        res.redirect("./index");
    }
});

app.get("/*/step-3-1", (req, res) => {
    if (enabledProgressBookmarks.step3a) {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
    else {
        res.redirect("./index");
    }
});

app.get("/*/step-4", (req, res) => {
    if (enabledProgressBookmarks.step4) {
        careSetting = visited.careSetting;
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
    else {
        res.redirect("./index");
    }
});

app.get("/*/step-5", (req, res) => {
    if (enabledProgressBookmarks.step5) {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
    else {
        res.redirect("./index");
    }
});

app.get("/*/step-6", (req, res) => {
    if (enabledProgressBookmarks.step6) {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
    else {
        res.redirect("./index");
    }
});

app.get("/*/step-7", (req, res) => {
    if (enabledProgressBookmarks.step7) {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
    else {
        res.redirect("./index");
    }
});

app.get("/*/review", (req, res) => {
    if (enabledProgressBookmarks.review) {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
    else {
        res.redirect("./index");
    }
});

app.get("/*/search", (req, res) => {
    resetSearchFields();
    res.render(req.path.substring(1), { search: search });
});

app.post("/*/search", function (req, res) {

    searchResults.length = 0;

    switch (req.body.action) {
        case 'clearall':
            resetSearchFields();
            break;
        case 'getresults':
            var searchParameterCount = 0;
            var filteredSites = null;

            search.providerName = req.body.providerName;
            search.providerCode = req.body.providerCode;
            search.ccgCode = req.body.ccgCode;
            search.ccgName = req.body.ccgName;

            var sites = JSON.parse(fs.readFileSync('./app/data/sites.json', 'utf8'));

            if (search.providerCode.trim() != '') {
                search.providerCode.split(/[\s,]+/).forEach(searchValue => {
                    filteredSites = sites.filter(site => site.SiteODSCode && site.SiteODSCode.toUpperCase().indexOf(searchValue.trim().toUpperCase()) > -1);
                    filteredSites.forEach(filteredSite => {
                        searchResults.push(filteredSite);
                    });
                });
                searchParameterCount += 1;
            }

            if (search.providerName.trim() != '') {
                search.providerName.split(/[,]+/).forEach(searchValue => {
                    filteredSites = sites.filter(site => site.SiteName && site.SiteName.toUpperCase().indexOf(searchValue.trim().toUpperCase()) > -1);
                    filteredSites.forEach(filteredSite => {
                        searchResults.push(filteredSite);
                    });
                });
                searchParameterCount += 1;
            }

            if (search.ccgCode != '') {
                filteredSites = sites.filter(site => site.SelectedCCGOdsCode && site.SelectedCCGOdsCode.toUpperCase().indexOf(search.ccgCode.toUpperCase()) > -1);
                filteredSites.forEach(filteredSite => {
                    searchResults.push(filteredSite);
                });
                searchParameterCount += 1;
            }

            if (search.ccgName != '') {
                filteredSites = sites.filter(site => site.SelectedCCGName && site.SelectedCCGName.toUpperCase().indexOf(search.ccgName.toUpperCase()) > -1);
                filteredSites.forEach(filteredSite => {
                    searchResults.push(filteredSite);
                });
                searchParameterCount += 1;
            }

            if ((searchParameterCount > 1) || (search.providerName.trim() === '' && search.providerCode.trim() === '' && search.ccgCode.trim() === '' && search.ccgName.trim() === '')) {
                searchResultsCount.invalidCount = 1;
                searchResultsCount.totalCount = 0;
            }
            else {
                searchResultsCount.invalidCount = 0;
                searchResultsCount.totalCount = searchResults.length;
                searchResultsCount.hasHtmlView = searchResults.filter(x => x.HasHtmlView).length;
                searchResultsCount.hasStructured = searchResults.filter(x => x.HasStructured).length;
                searchResultsCount.hasSendDocument = searchResults.filter(x => x.HasSendDocument).length;
                searchResultsCount.hasAppointment = searchResults.filter(x => x.HasAppointment).length;
            }
            break;
    }
    res.render(req.path.substring(1), { search: search, searchResults: searchResults, searchResultsCount: searchResultsCount });
});

app.post('/email-address-page', function (req, res) {
    notify
        .sendEmail(
            '6a5b377e-4763-4618-bd7b-7b31ac823849',
            req.body.emailAddress,
            {
                personalisation:
                {
                    firstName: req.body.firstName,
                    version: req.body.version
                }
            }
        )
        .then(response => console.log(response))
        .catch(err => console.error(err));
    res.redirect('/' + req.body.version);
});

app.post("/*/review", function (req, res) {
    var nextStep = '/' + req.path.split('/')[1] + '/thankyou';
    notify.sendEmail(
        '3d7b74db-98aa-4dab-8638-3af09c58f046',
        visited.signatoryEmail,
        {
            personalisation:
            {
                fullName: visited.signatoryName
            }
        }
    ).then(response => console.log(response))
        .catch(err => console.error(err));
    resetFormFields();
    res.redirect(nextStep);
});

app.post("/*/step-1", function (req, res) {
    var nextStep = '/' + req.path.split('/')[1] + '/step-2';
    var reviewStep = '/' + req.path.split('/')[1] + '/review';

    notCompletedArray.length = 0;
    if (req.body.supplierName === '') { notCompletedArray.push('supplierName') } else { visited.supplierName = req.body.supplierName };
    if (req.body.productName === '' || req.body.productName == null) { notCompletedArray.push('productName') } else { visited.productName = req.body.productName };

    if (notCompletedArray.length == 0) {
        enabledProgressBookmarks.step2 = true;

        if (enabledProgressBookmarks.review === false) {
            res.redirect(nextStep);
        }
        else {
            res.redirect(reviewStep);
        }
    }
    else {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
});

function getOrganisation(siteOdsCode) {
    axios.get('https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/' + siteOdsCode)
        .then(response => populateOrganisationDetails(siteOdsCode, response.data));
}

function populateOrganisationDetails(siteOdsCode, data) {
    visited.siteOdsCode = siteOdsCode;
    visited.organisationName = data.Organisation.Name;
    visited.organisationBuilding = data.Organisation.GeoLoc.Location.AddrLn1;
    visited.organisationStreet = data.Organisation.GeoLoc.Location.AddrLn2;
    visited.organisationTown = data.Organisation.GeoLoc.Location.Town;
    visited.organisationPostcode = data.Organisation.GeoLoc.Location.PostCode;
}

app.post("/*/step-2", function (req, res) {

    switch (req.body.action) {
        case 'getorganisation':
            if (req.body.siteOdsCode === '') {
                notCompletedArray.push('siteOdsCode');
                visited.siteOdsCode = '';
                visited.organisationName = '';
                visited.organisationBuilding = '';
                visited.organisationStreet = '';
                visited.organisationTown = '';
                visited.organisationPostcode = '';
                visited.haveOrganisationDetails = false;
            }
            else {
                var index = notCompletedArray.indexOf('siteOdsCode');
                if (index !== -1) {
                    notCompletedArray.splice(index, 1);
                }
                visited.siteOdsCode = req.body.siteOdsCode;
                visited.organisationName = 'Testvale Surgery';
                visited.organisationBuilding = '12';
                visited.organisationStreet = 'Salisbury Road';
                visited.organisationTown = 'Southampton';
                visited.organisationPostcode = 'SO40 3PY';
                visited.haveOrganisationDetails = true;
            };
            res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
            break;
        case 'submitformvalues':
            var nextStep = '/' + req.path.split('/')[1] + '/step-3';
            var reviewStep = '/' + req.path.split('/')[1] + '/review';
            notCompletedArray.length = 0;

            if (req.body.siteOdsCode === '') {
                notCompletedArray.push('siteOdsCode');
                if (req.body.organisationName === '') { notCompletedArray.push('organisationName') } else { visited.organisationName = req.body.organisationName };
                if (req.body.organisationBuilding === '') { notCompletedArray.push('organisationBuilding') } else { visited.organisationBuilding = req.body.organisationBuilding };
                if (req.body.organisationTown === '') { notCompletedArray.push('organisationTown') } else { visited.organisationTown = req.body.organisationTown };
                if (req.body.organisationPostcode === '') { notCompletedArray.push('organisationPostcode') } else { visited.organisationPostcode = req.body.organisationPostcode };
            }
            else {
                visited.siteOdsCode = req.body.siteOdsCode;
                visited.organisationName = 'Testvale Surgery';
                visited.organisationBuilding = '12';
                visited.organisationStreet = 'Salisbury Road';
                visited.organisationTown = 'Southampton';
                visited.organisationPostcode = 'SO40 3PY';
                visited.haveOrganisationDetails = true;
            };

            if (notCompletedArray.length == 0) {
                enabledProgressBookmarks.step3 = true;

                if (enabledProgressBookmarks.review === false) {
                    res.redirect(nextStep);
                }
                else {
                    res.redirect(reviewStep);
                }
            }
            else {
                res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
            }
            break;
    }
});

app.post("/*/step-3", function (req, res) {
    var nextStep = '/' + req.path.split('/')[1] + '/step-4';
    var reviewStep = '/' + req.path.split('/')[1] + '/review';
    notCompletedArray.length = 0;

    var showProxyDetails = req.body.showProxyDetails;
    var signatoryProxyDeclaration = req.body.signatoryProxyDeclaration;

    if (req.body.signatoryName === '') { notCompletedArray.push('signatoryName') } else { visited.signatoryName = req.body.signatoryName };
    if (req.body.signatoryJobTitle === '') { notCompletedArray.push('signatoryJobTitle') } else { visited.signatoryJobTitle = req.body.signatoryJobTitle };
    if (req.body.signatoryEmail === '') { notCompletedArray.push('signatoryEmail') } else { visited.signatoryEmail = req.body.signatoryEmail };
    if (req.body.signatoryProxyDeclaration === '') { notCompletedArray.push('signatoryProxyDeclaration') } else { visited.signatoryProxyDeclaration = req.body.signatoryProxyDeclaration };

    if (notCompletedArray.length == 0) {

        if (showProxyDetails) {
            if (signatoryProxyDeclaration === 'true') {
                nextStep = '/' + req.path.split('/')[1] + '/step-4';
                enabledProgressBookmarks.step3a = false;
                enabledProgressBookmarks.step4 = true;
            }
            else {
                nextStep = '/' + req.path.split('/')[1] + '/step-3-1';
                enabledProgressBookmarks.step3a = true;
                enabledProgressBookmarks.step4 = false;
            }
        }
        else {
            nextStep = '/' + req.path.split('/')[1] + '/step-4';
            enabledProgressBookmarks.step4 = true;
        }

        if (enabledProgressBookmarks.review === false) {
            res.redirect(nextStep);
        }
        else {
            res.redirect(reviewStep);
        }
    }
    else {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
});

app.post("/*/step-3-1", function (req, res) {
    var nextStep = '/' + req.path.split('/')[1] + '/step-4';
    var reviewStep = '/' + req.path.split('/')[1] + '/review';
    notCompletedArray.length = 0;

    if (req.body.proxySignatoryName === '') { notCompletedArray.push('proxySignatoryName') } else { visited.proxySignatoryName = req.body.proxySignatoryName };
    if (req.body.proxySignatoryJobTitle === '') { notCompletedArray.push('proxySignatoryJobTitle') } else { visited.proxySignatoryJobTitle = req.body.proxySignatoryJobTitle };
    if (req.body.proxySignatoryEmail === '') { notCompletedArray.push('proxySignatoryEmail') } else { visited.proxySignatoryEmail = req.body.proxySignatoryEmail };

    if (notCompletedArray.length == 0) {

        enabledProgressBookmarks.step3 = true;
        enabledProgressBookmarks.step3a = true;
        enabledProgressBookmarks.step4 = true;

        if (enabledProgressBookmarks.review === false) {
            res.redirect(nextStep);
        }
        else {
            res.redirect(reviewStep);
        }
    }
    else {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
});


app.post("/*/step-4", function (req, res) {
    var nextStep = '/' + req.path.split('/')[1] + '/step-5';
    var reviewStep = '/' + req.path.split('/')[1] + '/review';
    notCompletedArray.length = 0;

    if (req.body.careSetting === '') { notCompletedArray.push('careSetting') } else { visited.careSetting = req.body.careSetting };

    if (notCompletedArray.length == 0) {
        enabledProgressBookmarks.step5 = true;

        if (enabledProgressBookmarks.review === false) {
            res.redirect(nextStep);
        }
        else {
            res.redirect(reviewStep);
        }
    }
    else {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
});

app.post("/*/step-5", function (req, res) {
    var nextStep = '/' + req.path.split('/')[1] + '/step-6';
    var reviewStep = '/' + req.path.split('/')[1] + '/review';
    notCompletedArray.length = 0;

    if (req.body.reasonAgreement === '') { notCompletedArray.push('reasonAgreement') } else { visited.reasonAgreement = req.body.reasonAgreement };

    if (notCompletedArray.length == 0) {
        enabledProgressBookmarks.step6 = true;

        if (enabledProgressBookmarks.review === false) {
            res.redirect(nextStep);
        }
        else {
            res.redirect(reviewStep);
        }
    }
    else {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
});

app.post("/*/step-6", function (req, res) {
    var nextStep = '/' + req.path.split('/')[1] + '/step-7';
    var reviewStep = '/' + req.path.split('/')[1] + '/review';
    notCompletedArray.length = 0;

    enabledProgressBookmarks.inlineAgreement = req.body.inlineAgreement;

    if (req.body.inlineAgreement === 'true') {
        if (req.body.agreeAgreement === '') { notCompletedArray.push('agreeAgreement') } else { visited.agreeAgreement = req.body.agreeAgreement };

        if (notCompletedArray.length == 0) {
            enabledProgressBookmarks.review = true;
            nextStep = '/' + req.path.split('/')[1] + '/review';
        }
    }
    else {
        if (notCompletedArray.length == 0) {
            nextStep = '/' + req.path.split('/')[1] + '/step-7';
            enabledProgressBookmarks.step7 = true;
        }
    }

    console.log(nextStep);

    if (enabledProgressBookmarks.review === false) {
        res.redirect(nextStep);
    }
    else {
        res.redirect(reviewStep);
    }
});

app.post("/*/step-7", function (req, res) {
    var nextStep = '/' + req.path.split('/')[1] + '/review';
    notCompletedArray.length = 0;

    if (req.body.agreeAgreement === '') { notCompletedArray.push('agreeAgreement') } else { visited.agreeAgreement = req.body.agreeAgreement };

    if (notCompletedArray.length == 0) {
        enabledProgressBookmarks.review = true;
        res.redirect(nextStep);
    }
    else {
        res.render(req.path.substring(1), { visited: visited, enabledProgressBookmarks: enabledProgressBookmarks, notCompletedArray: notCompletedArray });
    }
});

if (useV6) {
    console.log('/app/v6/routes.js detected - using v6 compatibility mode')
    v6App = express()
}

// Set up configuration variables
var releaseVersion = packageJson.version
var glitchEnv = (process.env.PROJECT_REMIX_CHAIN) ? 'production' : false // glitch.com
var env = (process.env.NODE_ENV || glitchEnv || 'development').toLowerCase()
var useAutoStoreData = process.env.USE_AUTO_STORE_DATA || config.useAutoStoreData
var useCookieSessionStore = process.env.USE_COOKIE_SESSION_STORE || config.useCookieSessionStore
var useHttps = process.env.USE_HTTPS || config.useHttps

useHttps = useHttps.toLowerCase()

var useDocumentation = (config.useDocumentation === 'true')

// Promo mode redirects the root to /docs - so our landing page is docs when published on heroku
var promoMode = process.env.PROMO_MODE || 'false'
promoMode = promoMode.toLowerCase()

// Disable promo mode if docs aren't enabled
if (!useDocumentation) promoMode = 'false'

// Force HTTPS on production. Do this before using basicAuth to avoid
// asking for username/password twice (for `http`, then `https`).
var isSecure = (env === 'production' && useHttps === 'true')
if (isSecure) {
    app.use(utils.forceHttps)
    app.set('trust proxy', 1) // needed for secure cookies on heroku
}

middleware.forEach(func => app.use(func))

// Set up App
var appViews = extensions.getAppViews([
    path.join(__dirname, '/app/views/'),
    path.join(__dirname, '/lib/')
])

var nunjucksConfig = {
    autoescape: true,
    noCache: true,
    watch: false // We are now setting this to `false` (it's by default false anyway) as having it set to `true` for production was making the tests hang
}

if (env === 'development') {
    nunjucksConfig.watch = true
}

nunjucksConfig.express = app

var nunjucksAppEnv = nunjucks.configure(appViews, nunjucksConfig)

// Add Nunjucks filters
utils.addNunjucksFilters(nunjucksAppEnv)

// Set views engine
app.set('view engine', 'html')

// Middleware to serve static assets
app.use('/public', express.static(path.join(__dirname, '/public')))

// Serve govuk-frontend in from node_modules (so not to break pre-extensions prototype kits)
app.use('/node_modules/govuk-frontend', express.static(path.join(__dirname, '/node_modules/govuk-frontend')))

// Set up documentation app
if (useDocumentation) {
    var documentationViews = [
        path.join(__dirname, '/node_modules/govuk-frontend/'),
        path.join(__dirname, '/node_modules/govuk-frontend/components'),
        path.join(__dirname, '/docs/views/'),
        path.join(__dirname, '/lib/')
    ]

    nunjucksConfig.express = documentationApp
    var nunjucksDocumentationEnv = nunjucks.configure(documentationViews, nunjucksConfig)
    // Nunjucks filters
    utils.addNunjucksFilters(nunjucksDocumentationEnv)

    // Set views engine
    documentationApp.set('view engine', 'html')
}

// Support for parsing data in POSTs
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

// Set up v6 app for backwards compatibility
if (useV6) {
    var v6Views = [
        path.join(__dirname, '/node_modules/govuk_template_jinja/views/layouts'),
        path.join(__dirname, '/app/v6/views/'),
        path.join(__dirname, '/lib/v6') // for old unbranded template
    ]
    nunjucksConfig.express = v6App
    var nunjucksV6Env = nunjucks.configure(v6Views, nunjucksConfig)

    // Nunjucks filters
    utils.addNunjucksFilters(nunjucksV6Env)

    // Set views engine
    v6App.set('view engine', 'html')

    // Backward compatibility with GOV.UK Elements
    app.use('/public/v6/', express.static(path.join(__dirname, '/node_modules/govuk_template_jinja/assets')))
    app.use('/public/v6/', express.static(path.join(__dirname, '/node_modules/govuk_frontend_toolkit')))
    app.use('/public/v6/javascripts/govuk/', express.static(path.join(__dirname, '/node_modules/govuk_frontend_toolkit/javascripts/govuk/')))
}

// Add variables that are available in all views
app.locals.asset_path = '/public/'
app.locals.useAutoStoreData = (useAutoStoreData === 'true')
app.locals.useCookieSessionStore = (useCookieSessionStore === 'true')
app.locals.promoMode = promoMode
app.locals.releaseVersion = 'v' + releaseVersion
app.locals.serviceName = config.serviceName
app.locals.pageName = config.pageName
// extensionConfig sets up variables used to add the scripts and stylesheets to each page.
app.locals.extensionConfig = extensions.getAppConfig()

// Session uses service name to avoid clashes with other prototypes
const sessionName = 'govuk-prototype-kit-' + (Buffer.from(config.serviceName, 'utf8')).toString('hex')
const sessionOptions = {
    secret: sessionName,
    cookie: {
        maxAge: 1000 * 60 * 60 * 4, // 4 hours
        secure: isSecure
    }
}

// Support session data in cookie or memory
if (useCookieSessionStore === 'true') {
    app.use(sessionInCookie(Object.assign(sessionOptions, {
        cookieName: sessionName,
        proxy: true,
        requestKey: 'session'
    })))
} else {
    app.use(sessionInMemory(Object.assign(sessionOptions, {
        name: sessionName,
        resave: false,
        saveUninitialized: false
    })))
}

// Automatically store all data users enter
if (useAutoStoreData === 'true') {
    app.use(utils.autoStoreData)
    utils.addCheckedFunction(nunjucksAppEnv)
    if (useDocumentation) {
        utils.addCheckedFunction(nunjucksDocumentationEnv)
    }
    if (useV6) {
        utils.addCheckedFunction(nunjucksV6Env)
    }
}

// Clear all data in session if you open /prototype-admin/clear-data
app.post('/prototype-admin/clear-data', function (req, res) {
    req.session.data = {}
    res.render('prototype-admin/clear-data-success')
})

// Redirect root to /docs when in promo mode.
if (promoMode === 'true') {
    console.log('Prototype Kit running in promo mode')

    app.get('/', function (req, res) {
        res.redirect('/docs')
    })

    // Allow search engines to index the Prototype Kit promo site
    app.get('/robots.txt', function (req, res) {
        res.type('text/plain')
        res.send('User-agent: *\nAllow: /')
    })
} else {
    // Prevent search indexing
    app.use(function (req, res, next) {
        // Setting headers stops pages being indexed even if indexed pages link to them.
        res.setHeader('X-Robots-Tag', 'noindex')
        next()
    })

    app.get('/robots.txt', function (req, res) {
        res.type('text/plain')
        res.send('User-agent: *\nDisallow: /')
    })
}

// Load routes (found in app/routes.js)
if (typeof (routes) !== 'function') {
    console.log(routes.bind)
    console.log('Warning: the use of bind in routes is deprecated - please check the Prototype Kit documentation for writing routes.')
    routes.bind(app)
} else {
    app.use('/', routes)
}

if (useDocumentation) {
    // Clone app locals to documentation app locals
    // Use Object.assign to ensure app.locals is cloned to prevent additions from
    // updating the original app.locals
    documentationApp.locals = Object.assign({}, app.locals)
    documentationApp.locals.serviceName = 'Prototype Kit'

    // Create separate router for docs
    app.use('/docs', documentationApp)

    // Docs under the /docs namespace
    documentationApp.use('/', documentationRoutes)
}

if (useV6) {
    // Clone app locals to v6 app locals
    v6App.locals = Object.assign({}, app.locals)
    v6App.locals.asset_path = '/public/v6/'

    // Create separate router for v6
    app.use('/', v6App)

    // Docs under the /docs namespace
    v6App.use('/', v6Routes)
}

// Strip .html and .htm if provided
app.get(/\.html?$/i, function (req, res) {
    var path = req.path
    var parts = path.split('.')
    parts.pop()
    path = parts.join('.')
    res.redirect(path)
})

// Auto render any view that exists

// App folder routes get priority
app.get(/^([^.]+)$/, function (req, res, next) {
    utils.matchRoutes(req, res, next)
})

if (useDocumentation) {
    // Documentation  routes
    documentationApp.get(/^([^.]+)$/, function (req, res, next) {
        if (!utils.matchMdRoutes(req, res)) {
            utils.matchRoutes(req, res, next)
        }
    })
}

if (useV6) {
    // App folder routes get priority
    v6App.get(/^([^.]+)$/, function (req, res, next) {
        utils.matchRoutes(req, res, next)
    })
}

// Redirect all POSTs to GETs - this allows users to use POST for autoStoreData
app.post(/^\/([^.]+)$/, function (req, res) {
    res.redirect(url.format({
        pathname: '/' + req.params[0],
        query: req.query
    })
    )
})

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error(`Page not found: ${req.path}`)
    err.status = 404
    next(err)
})

// Display error
app.use(function (err, req, res, next) {
    console.error(err.message)
    res.status(err.status || 500)
    res.send(err.message)
})

console.log('\nGOV.UK Prototype Kit v' + releaseVersion)
console.log('\nNOTICE: the kit is for building prototypes, do not use it for production services.')

module.exports = app
