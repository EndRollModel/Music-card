let express = require('express');
let router = express.Router();
let dbModel = require('../model/firebase_data');
let spotifyController = require('../controller/spotify_apis');
(async () => {
    // getFirebaseData
    await dbModel.onListenDataBase();
})();

// test vercel function
router.get('/developer', async function (req, res) {
    res.setHeader('cache-control', 'public, s-maxage=2, must-revalidate')
    res.send('welcome use music card');
});

router.get('/callback', async function (req, res) {
    if (req.query.code === undefined) return res.status(404).send().end();
    const userToken = await spotifyController.getAuthToken(req.query.code);
    if (!userToken.hasOwnProperty('error')) {
        const userInfo = await spotifyController.getUserID(userToken);
        try {
            if (dbModel.userIsExists(userInfo.id)) {
                res.send(`users is exists Url : \n${req.protocol + '://' + req.get('host') + `?id=${userInfo.id}`}`);
            } else {
                await dbModel.addUserData(userInfo['id'], userToken['refresh_token'], userInfo['display_name']);
                res.send(`users add success Url : \n${req.protocol + '://' + req.get('host') + `?id=${userInfo.id}`}`);
            }
        } catch (e) {
            res.status(404).send().end(); // userInfo.id undefined
        }
    } else {
        res.status(404).send().end();
    }
});

router.get('/', async function (req, res) {
    if (req.query.id === undefined && req.query.ids === undefined) return res.status(404).send().end(); // 沒有任何id或是ids請求
    switch (true) {
        case req.query.id !== undefined:
        case req.query.ids !== undefined:
            const id = req.query.id !== undefined ? req.query.id : req.query.ids;
            if (dbModel.userIsExists(id)) {
                const userdata = dbModel.getUserInfo(id);
                const musicCard = await spotifyController.getMusicInfo(userdata);
                if (req.query.id !== undefined) {
                    res.setHeader('content-type', 'image/svg+xml')
                    // res.setHeader('Cache-Control', 'public,s-maxage=1,must-revalidate')
                    // res.setHeader('Cache-Control', 's-maxage=1')
                    // res.setHeader('Cache-Control', 'max-age=1')
                    res.setHeader('Cache-Control', 'public,max-age=10,must-revalidate')
                    return res.render('card', {package: musicCard});
                } else {
                    res.setHeader('content-type', 'text/json')
                    return res.send(JSON.stringify(musicCard))
                    // return res.render('card', {package: musicCard});
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
