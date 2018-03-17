
![](https://i.imgur.com/xAp8Xwr.jpg)

# URL Shortener

> A URL Shortener built with Firebase and Preact

## Features
 - Material Design Dashboard
 - Custom short URL
 - View click counts
 - Easy to deploy (Firebase Hosting and Cloud Functions)

## Deploy
run `npm i` in both folders **functions** and **public**

create a new project in firebase.google.com
Enable **Google Authentication** in firebase console
get config for web app from **firebase console**



insert your config and update URL with your URL in public/src/index.js

  
```
    Update your url, without slash (ie: goo.gl)
    state = {        
        url:  'go.limhenry.xyz',  Your url here
        data: []
    }
    
    Update the Firebase config below
    
    config = {
        apiKey: 'AIzaSyDu9g3xIJ5Z46nQrRCYCeOIutx3ZUpxrRo',
        authDomain: 'url-shortener-d5b38.firebaseapp.com',
        databaseURL: 'https://url-shortener-d5b38.firebaseio.com',
        projectId: 'url-shortener-d5b38',
        storageBucket: 'url-shortener-d5b38.appspot.com',
        messagingSenderId: '349795577578'
	};

```

## Techs
 - [Preact](https://preactjs.com/)  
 - [Firebase](https://firebase.google.com) (Cloud Firestore, Cloud Functions and Authentication)  

## License
This project is published under the [MIT License](LICENSE).