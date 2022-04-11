const express = require('express')
const router = express.Router()

//router.post('/email-address-page', function (req, res)
//{
//    notify.sendEmail(
//        '6a5b377e-4763-4618-bd7b-7b31ac823849',
//        req.body.emailAddress,
//        {
//            personalisation:
//            {
//                firstName: req.body.firstName
//            }
//        }
//    );
//    res.redirect('/');
//});

//router.post("/review", function (req, res) {
//    resetFormFields();
//    notify.sendEmail(
//        '3d7b74db-98aa-4dab-8638-3af09c58f046',
//        req.body.emailAddress,
//        {
//            personalisation:
//            {
//                fullName: req.body.visited.signatoryName
//            }
//        }
//    );
//    res.redirect("/thankyou");
//});

module.exports = router