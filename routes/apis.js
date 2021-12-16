let express = require('express');
let router = express.Router();
let dbModel = require('../model/firebase_data');
let spotifyController = require('../controller/spotify_apis');

router.get('/', async function (req, res) {
    if (req.query.id === undefined && req.query.ids === undefined) return res.status(404).send().end(); // 沒有任何id或是ids請求
    switch (true) {
        case req.query.id !== undefined:
        case req.query.ids !== undefined:
            const id = req.query.id !== undefined ? req.query.id : req.query.ids;
            const userdata = await dbModel.searchUser(id);
            if (userdata !== undefined) {
                const musicCard = await spotifyController.getMusicInfo(userdata);
                if (req.query.id !== undefined) {
                    res.setHeader('content-type', 'image/svg+xml')
                    res.setHeader('Cache-Control', 'public,max-age=5,must-revalidate')
                    return res.render('smallCard', {package: musicCard});
                } else {
                    res.setHeader('content-type', 'text/json')
                    return res.send(JSON.stringify(musicCard))
                }
            } else {
                console.log(`id or ids: "${req.query.id}" try `)
                return res.status(404).send().end();
            }
        default:
            break;
    }
});

router.get('/small/', async function (req, res) {
    if (req.query.id === undefined && req.query.ids === undefined) return res.status(404).send().end(); // 沒有任何id或是ids請求
    switch (true) {
        case req.query.id !== undefined:
        case req.query.ids !== undefined:
            const id = req.query.id !== undefined ? req.query.id : req.query.ids;
            const userdata = await dbModel.searchUser(id);
            if (userdata !== undefined) {
                const musicCard = await spotifyController.getMusicInfo(userdata);
                if (req.query.id !== undefined) {
                    res.setHeader('content-type', 'image/svg+xml')
                    res.setHeader('Cache-Control', 'public,max-age=5,must-revalidate')
                    return res.render('smallCardPlay', {package: musicCard});
                } else {
                    res.setHeader('content-type', 'text/json')
                    return res.send(JSON.stringify(musicCard))
                }
            } else {
                console.log(`id or ids: "${req.query.id}" try `)
                return res.status(404).send().end();
            }
        default:
            break;
    }
});

module.exports = router;
