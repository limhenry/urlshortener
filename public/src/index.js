import { h, Component } from "preact";
import Toolbar from "preact-material-components/Toolbar";
import "preact-material-components/Toolbar/style.css";
import Button from "preact-material-components/Button";
import "preact-material-components/Button/style.css";
import style from "./style";
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import Worker from "worker-loader!./Worker.js";

// TODO: Update the Firebase config below
const config = {
  apiKey: "AIzaSyAPRc8yYpsq7TSuzh5zUO3-q7FPoCJjNzo",
  authDomain: "preact-firestore.firebaseapp.com",
  databaseURL: "https://preact-firestore.firebaseio.com",
  projectId: "preact-firestore",
  storageBucket: "preact-firestore.appspot.com",
  messagingSenderId: "8281769863",
};

firebase.initializeApp(config);

let auth = firebase.auth();
export default class App extends Component {
  state = {
    // TODO: Update your url, without slash (ie: goo.gl)
    url: "preact-firebase.web.app",
    data: [],
  };

  constructor() {
    super();
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUser = user;
        document.getElementById("loading").style.display = "none";
        document.getElementById("home").style.display = "block";
        this.showToast("Loading ...", 0);
        this.getData();
      } else {
        let provider = new auth.GoogleAuthProvider();
        auth.signInWithRedirect(provider);
      }
    });
    this.db = firebase.firestore();
  }

  getData = () => {
    let worker = new Worker();
    worker.addEventListener("message", (d) => {
      this.setState({ data: d.data });
      document.getElementById("originalurl").value = "";
      document.getElementById("shorturl").value = "";
      this._toastClosed();
    });

    let data = [];
    this.db
      .collection("url")
      .where("user", "==", this.currentUser.uid)
      .orderBy("timestamp", "desc")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          data.push(doc.data());
        });
        worker.postMessage(data);
      })
      .catch((error) => {
        console.log(error.message);
        this.showToast(error.message);
      });
  };

  generateShortUrl = () => {
    let shorturl = "";
    let length = 6;
    let string = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ";
    for (let i = 0; i < length; i++) {
      shorturl += string.charAt(Math.floor(Math.random() * string.length));
    }
    return shorturl;
  };

  shortenUrl = () => {
    let originalurl = document.getElementById("originalurl").value;
    let customShorturl = document
      .getElementById("shorturl")
      .value.replace(this.state.url + "", "");
    let shorturl;
    if (originalurl) {
      this.showToast("Loading ...", 0);
      if (document.getElementById("shorturl").value) {
        shorturl = customShorturl;
      } else {
        shorturl = this.generateShortUrl();
      }
      let urlRef = this.db.collection("url").doc(shorturl);
      urlRef
        .get()
        .then((doc) => {
          if (!doc.exists) {
            this.db
              .collection("url")
              .doc(shorturl)
              .set({
                shorturl,
                fullurl: originalurl,
                count: 0,
                timestamp: new Date(),
                user: this.currentUser.uid,
              })
              .then(() => {
                this.getData();
              })
              .catch((error) => {
                this._toastClosed();
                this.showToast("Something went wrong. Please try again.");
              });
          } else if (customShorturl) {
            this.showToast("Error. Please enter another custom short URL.");
          } else {
            this.shortenUrl();
          }
        })
        .catch((err) => {
          this.showToast("Something went wrong. Please try again.");
        });
    } else {
      this.showToast("Please enter a valid URL.");
    }
  };

  showToast = (msg, duration) => {
    clearTimeout(this.toast_timeout);
    document.getElementById("toast").innerHTML = msg;
    duration = duration || 3000;
    this._toastOpened();
    if (duration >= 0) {
      this.toast_timeout = setTimeout(() => {
        this._toastClosed();
      }, duration);
    }
  };

  _toastOpened = () => {
    document
      .getElementById("toast")
      .animate(
        [
          { transform: "translateY(100px)", opacity: 0 },
          { transform: "translateY(0px)", opacity: 1 },
        ],
        {
          fill: "forwards",
          duration: 300,
        }
      )
      .play();
  };

  _toastClosed = () => {
    clearTimeout(this.toast_timeout);
    document
      .getElementById("toast")
      .animate(
        [
          { transform: "translateY(0px)", opacity: 1 },
          { transform: "translateY(100px)", opacity: 0 },
        ],
        {
          fill: "forwards",
          duration: 300,
        }
      )
      .play();
  };

  shortUrlInput = (event) => {
    let url = this.state.url + "/";
    let oldVal = event.target.value;
    switch (event.type) {
      case "focusout":
        if (event.target.value === url) {
          event.target.value = "";
        }
        break;
      case "focus":
        if (!event.target.value) {
          setTimeout(() => {
            event.target.value = url;
          }, 1);
        }
        break;
      case "keydown":
        setTimeout(() => {
          if (event.target.value.indexOf(url) !== 0) {
            if (event.target.value === "") {
              event.target.value = url;
            } else {
              event.target.value = oldVal;
            }
          }
        }, 1);
        break;
    }
  };

  render({}, { data, url }) {
    return (
      <div>
        <Toolbar class={style.toolbar}>
          <Toolbar.Row>
            <Toolbar.Section align-start>
              <Toolbar.Title>URL Shortener</Toolbar.Title>
            </Toolbar.Section>
          </Toolbar.Row>
        </Toolbar>
        <div id="toast" class="toast">
          Loading ...
        </div>
        <div id="loading" class="loading">
          Loading ...
        </div>
        <div id="home" class="home">
          <div class="header">
            <div class="container">
              <h1>Simplify your links</h1>
              <div class="input_container">
                <input id="originalurl" placeholder="Your original URL here" />
              </div>
              <div class="input_container">
                <input
                  type="url"
                  id="shorturl"
                  onkeydown={this.shortUrlInput}
                  onfocus={this.shortUrlInput}
                  onfocusout={this.shortUrlInput}
                  placeholder="Your custom short URL here (Optional)"
                />
                <Button ripple raised id="button" onClick={this.shortenUrl}>
                  Shorten URL
                </Button>
              </div>
              <p>All {url} URLs are public and can be accessed by anyone</p>
            </div>
          </div>
          <div class="content">
            <table>
              <thead>
                <tr>
                  <th class="original">Original URL</th>
                  <th class="created">Created</th>
                  <th class="short">Short URL</th>
                  <th class="clicks">All Clicks</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr>
                    <td class="original">
                      <a target="_blank" href={item.fullurl}>
                        {item.fullurl}
                      </a>
                    </td>
                    <td class="created">{item.created}</td>
                    <td class="short">
                      <a
                        target="_blank"
                        href={"http://" + url + "/" + item.shorturl}
                      >
                        {url}/{item.shorturl}
                      </a>
                    </td>
                    <td class="clicks">{item.count}</td>
                  </tr>
                ))}
              </tbody>
              <thead>
                <tr>
                  <th class="original">Original URL</th>
                  <th class="created">Created</th>
                  <th class="short">Short URL</th>
                  <th class="clicks">All Clicks</th>
                </tr>
              </thead>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
