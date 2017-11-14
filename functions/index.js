'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

var notFound = `
    <html lang="en">
        <head>
            <title>404 - URL Shortener</title>
            <meta name="viewport" content="initial-scale=1.0, width=device-width">
            <meta http-equiv="content-type" content="text/html; charset=utf-8">
            <meta name="robots" content="noindex">
            <style>
                html, body{
                    margin: 0;
                    line-height: 1.8em;
                    font-family: system-ui, sans-serif;
                    font-size: 0.95em;
                    padding: 24px 12px;
                    text-align: center;
                    display: -webkit-box;
                    display: -ms-flexbox;
                    display: flex;
                    -webkit-box-pack: center;
                        -ms-flex-pack: center;
                            justify-content: center;
                    -webkit-box-align: center;
                        -ms-flex-align: center;
                            align-items: center;
                    -webkit-box-orient: vertical;
                    -webkit-box-direction: normal;
                        -ms-flex-direction: column;
                            flex-direction: column;
                    color: #3e3e3e;
                }
                h2 {
                    font-size: 3em;
                    color: #232323;
                }
            </style>
        </head>
        <body>
            <h2>404</h2>
            <p>Page not found – the page <b id="url"></b> does not exist.</p>
            <p>If you typed in or copied/pasted this URL, make sure you included all the characters, with no extra punctuation.</p>
            <script>
                document.getElementById('url').innerHTML = document.location.href;
            </script>
        </body>
    </html>
`

exports.shortenUrl = functions.https.onRequest((req, res) => {
    if (req.url != '/') {
        var db = admin.firestore();
        var urlRef = db.collection('url').doc(req.url.split('/')[1]);
        urlRef.get()
        .then(doc => {
            if (!doc.exists && !doc.data().fullurl) {
                res.status(404).send(notFound)
            } else {
                urlRef.update({count: doc.data().count + 1});
                var fullurl = doc.data().fullurl;
                if (!fullurl.includes('http://') && !fullurl.includes('https://')) {
                    fullurl = 'http://' + fullurl;
                }
                res.redirect(fullurl);
            }
        })
        .catch(err => {
            res.status(404).send(notFound)
        });
    }
    else {
        res.status(404).send(notFound)
    }
})