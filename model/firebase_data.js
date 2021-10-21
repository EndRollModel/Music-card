let admin = require("firebase-admin");
const key = function () {
    try {
        return JSON.parse(Buffer.from(process.env.firebase, "base64").toString('utf-8'));
    } catch (e) {
        if (process.env.firebase === undefined) {
            throw new Error('not set env firebase params or admin.json');
        } else {
            return require(`../${process.env.firebase}`);
        }
    }
}
admin.initializeApp({
    credential: admin.credential.cert(key())
});
const db = admin.firestore();
let userData = [];

/**
 * @return {Promise<void>}
 * @description
 * collection - user
 * doc - userName : { id : (String), token : (String), name : (String), lang : (String), option : (String, Array) }
 */
async function getDataBaseFirst() {
    const user = db.collection('user')
    const users = await user.get();
    const usersInfo = [];
    users.forEach((elem) => {
        usersInfo.push({id: elem.id, data: elem.data()})
    })
    userData = usersInfo;
}

/** 監聽狀態 **/
async function onListenDataBase() {
    console.log(`::::: server data onListen start :::::`)
    db.collection('user').onSnapshot((dataStatus) => {
        dataStatus.docChanges().forEach((change,index) => {
            const userDataIndex = userData.findIndex(elem => elem.id === change.doc.id);
            switch (change.type) {
                case "added":
                    console.log(`add data : ${JSON.stringify({id: change.doc.id, data: change.doc.data()})}`);
                    if (userDataIndex === -1) {
                        userData.push({id: change.doc.id, data: change.doc.data()})
                    }
                    break;
                case "modified":
                    console.log(`modified data : ${JSON.stringify({id: change.doc.id, data: change.doc.data()})}`)
                    if (userDataIndex !== -1) {
                        userData[userDataIndex] = {id: change.doc.id, data: change.doc.data()}
                    }
                    break;
                case "removed":
                    console.log(`removed data : ${JSON.stringify({id: change.doc.id, data: change.doc.data()})}`)
                    if (userDataIndex !== -1) {
                        console.log(`add data : ${{id: change.doc.id, data: change.doc.data()}}`)
                        userData.splice(userDataIndex, 1)
                    }
                    break;
                default:
                    console.log(`change ? ${change.type}`)
                break;
            }
        })
    });
}

function userIsExists(id){
    return userData.findIndex(elem => elem.id === id) !== -1;
}

function getUserInfo(id){
    const index = userData.findIndex(elem => elem.id === id);
    if (index > -1) {
        return userData[index];
    }else {
        return {};
    }
}

/**
 * first time get user code & user data
 * @return {Promise<void>}
 */
async function addUserData(id, token, displayName) {
    await db.collection('user').doc(id).set({
        token: token,
        displayName: displayName,
    })
    return id;
}

/**
 * update user option
 * @return {Promise<void>}
 */
async function updateUserData() {

}

module.exports = {
    getUserInfo,
    userIsExists,
    addUserData,
    onListenDataBase,
}
