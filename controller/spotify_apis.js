const axios = require('axios');
const sharp = require('sharp');
/** -----spotify api url----- */
let userInfo_url = 'https://api.spotify.com/v1/me';
let token_url = 'https://accounts.spotify.com/api/token';
let nowPlay_url = 'https://api.spotify.com/v1/me/player/currently-playing';
let recently_url = 'https://api.spotify.com/v1/me/player/recently-played';
// scopes option
// 根據需求可以要求使用範圍 詳細可查 : https://developer.spotify.com/documentation/general/guides/scopes/
// 此項目獲取以下權限: 讀取歷史播放, 讀取現在播放
const scopes = [
    'user-read-recently-played',
    'user-read-currently-playing',
]

/**
 * from authCode get user token
 * @param code
 * @return {object} { access_token, token_type, expires_in, refresh_token, scope }
 */
async function getAuthToken(code) {
    const requestOption = {
        url: token_url,
        method: 'POST',
        headers: {
            Authorization: `Basic ${process.env.basicToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: new URLSearchParams({
            'grant_type': 'authorization_code',
            code: code,
            redirect_uri: (process.env.redirect_uri),
        }),
    }
    const res = await axios(requestOption)
    return res.data;
}

/**
 * 製作oauth2的授權網址
 * @return {string}
 */
function createUrl() {
    let authUrl = 'https://accounts.spotify.com/authorize'
    let param = {
        client_id: process.env.projectID,
        response_type: 'code',
        redirect_uri: process.env.redirect_uri,
        scope: scopes.toString(),
    }
    const params = new URLSearchParams(param)
    return `${authUrl}?${params.toString()}`;
    // Logger.log(authUrl.addQuery(param));
    // return authUrl.addQuery(param)
}

/**
 * get userId
 * @param tokenObject
 * @return {any}
 */
async function getUserID(tokenObject) {
    if (tokenObject !== undefined) {
        const requestOption = {
            url: userInfo_url,
            method: 'GET',
            headers: {
                Authorization: `${tokenObject['token_type']} ${tokenObject['access_token']}`
            }
        }
        const res = await axios(userInfo_url, requestOption);
        return res.data;
    } else {
        return '';
    }
}

/**
 * 取得可用 token
 * @param token
 * @return {Promise<any>}
 */
async function getToken(token) {
    const requestOption = {
        url: token_url,
        method: 'POST',
        headers: {
            Authorization: `Basic ${process.env.basicToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: new URLSearchParams({
            'grant_type': 'refresh_token',
            refresh_token: token
        }),
    }
    const res = await axios(requestOption);
    return res.data;
}

/**
 * 取得現在播放
 * @param tokenBody
 * @return {Promise<{}>}
 */
async function getNowPlay(tokenBody) {
    let returnObj = {}
    const requestOption = {
        url: nowPlay_url ,
        method: 'GET',
        headers: {
            Authorization: `${tokenBody['token_type']} ${tokenBody['access_token']}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    const res = await axios(requestOption)
    if (res.data !== '') {
        const resNowPlay = res.data;
        if (resNowPlay.hasOwnProperty('item')) {
            try {
                returnObj.type = 'Now Playing'
                returnObj.singer = resNowPlay.item.album.artists[0].name;
                returnObj.name = resNowPlay.item.name;
                returnObj.pic = await imageCompression(resNowPlay.item.album.images[1].url);
                returnObj.openurl = resNowPlay.item.album.artists[0].external_urls.spotify;
                returnObj.uri = resNowPlay.item.album.artists[0].uri;
            } catch (e) {
                returnObj = {};
            }
        }
    }
    return returnObj
}

/**
 * 取得曾經播放
 * @param tokenBody
 * @return {Promise<{}>}
 */
async function getRecentlyPlay(tokenBody) {
    const returnObj = {}
    let limitCount = 5; // 一次讀取
    const requestOption = {
        url: recently_url + '?limit=' + limitCount,
        method: 'GET',
        headers: {
            Authorization: `${tokenBody['token_type']} ${tokenBody['access_token']}`,
        }
    }
    const res = await axios(requestOption);
    if (res.data !== '') {
        try {
            const recentlyPlay = res.data;
            const itemCount = recentlyPlay.items.length;
            const randomTrack = (itemCount >= limitCount) ? Math.floor(Math.random() * limitCount) : Math.floor(Math.random() * itemCount);
            if (recentlyPlay.hasOwnProperty('items')) {
                returnObj.type = 'Recently Played';
                returnObj.singer = recentlyPlay.items[randomTrack].track.album.artists[0].name;
                returnObj.name = recentlyPlay.items[randomTrack].track.name;
                returnObj.pic = await imageCompression(recentlyPlay.items[randomTrack].track.album.images[1].url);
                returnObj.openurl = recentlyPlay.items[randomTrack].track.album.artists[0].external_urls.spotify;
                returnObj.uri = recentlyPlay.items[randomTrack].track.album.artists[0].uri;
            }
        } catch (e) {
            console.log(`getRecentlyPlay : ${e.toString()}`);
        }
    }
    return returnObj
}

/**
 * 壓縮圖片 壓縮比:70 並且進行mozjpeg處理
 * 註：此做法有爭議 spotify要求圖片必須完整
 * 若需關閉此功能 兩種做法
 * 1. 註解壓縮該行且解除註解下方行 不做處理
 * 2. 將壓縮比改為80 (幾乎無損 且超過85時圖片容量會比原本還大且畫質不會更好)
 * @param url
 * @return {Promise<string>}
 */
async function imageCompression (url){
    const requestOption = {
        url: url,
        method: 'GET',
        responseType: 'arraybuffer',
    }
    const image = await axios(requestOption);
    const buffer = await sharp(image.data)
        .jpeg({quality: 70, mozjpeg: true})
        // .jpeg()
        .toBuffer()
    return Buffer.from(buffer).toString('base64');
}

/**
 * 最終取得卡片資訊
 * @param userData
 * @return {Promise<unknown>}
 */
function getMusicInfo(userData){
    return new Promise(async (resolve, reject) => {
        const tokenBody = await getToken(userData.data.token);
        Promise.all([getNowPlay(tokenBody), getRecentlyPlay(tokenBody)])
            .then((value)=>{
                if(Object.keys(value[0]).length === 0){
                    resolve(value[1]);
                } else {
                    resolve(value[0]);
                }
            })
    })
}

module.exports = {
    getAuthToken,
    getUserID,
    getToken,
    getNowPlay,
    getRecentlyPlay,
    getMusicInfo,
    createUrl,
}
