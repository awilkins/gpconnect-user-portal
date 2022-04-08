var NotifyClient = require('notifications-node-client').NotifyClient,
    notify = new NotifyClient(process.env.NOTIFYAPIKEY);

const express = require('express')
const router = express.Router()

router.post('/email-address-page', function (req, res)
{
    notify.sendEmail(
        '6a5b377e-4763-4618-bd7b-7b31ac823849',
        req.body.emailAddress,
        { personalisation: { firstName: req.body.firstName } }
    );
    res.redirect('/');
});

module.exports = router