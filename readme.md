## Music card

----        
This project can create spotify api music card 

you can show Playing or Recently played music on Github or Webpage

### Sample

--- 
Normal      
<img src="https://raw.githubusercontent.com/EndRollModel/Music-card/master/sample/sample.svg" alt="this is sample">
            
<!-- Small       
<img src="https://raw.githubusercontent.com/EndRollModel/Music-card/master/sample/smapleSmall.svg" alt="this is small sample">
---- -->
----

### project used
[Spotify api](https://developer.spotify.com/)

[Firebase Cloud Firestore](https://firebase.google.com/)

### How to build

1. clone or download this project   
2. open cmd cd this project (need install nodejs & npm)     
3. install module      
``` shell
npm i 
```
4. create .env file & write params      
``` text
projectID= // spotify project ID
redirect_uri= // spotify redirect_uri
firebase= // firebase admin.json info to base64 or admin.json path (Ex: key/admin.json) 
basicToken= // spotify (client_id:client_secret) to base64
```
5. start server     
```shell
npm start 
```
