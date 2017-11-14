import { h, Component } from 'preact';
import Header from './header';
import Button from 'preact-material-components/Button';
import 'preact-material-components/Button/style.css';
import style from './style';
import firebase from 'firebase/app';
import firebaseFirestore from 'firebase/firestore';
import firebaseAuth from 'firebase/auth';

export default class Home extends Component {

	state = {
		// TODO: Update your url, without slash (ie: goo.gl)
		url: 'go.limhenry.xyz',
		data: [],
	}

	constructor() {
		super();

		// TODO: Update the Firebase config below 
		const config = {
			apiKey: "AIzaSyDu9g3xIJ5Z46nQrRCYCeOIutx3ZUpxrRo",
			authDomain: "url-shortener-d5b38.firebaseapp.com",
			databaseURL: "https://url-shortener-d5b38.firebaseio.com",
			projectId: "url-shortener-d5b38",
			storageBucket: "url-shortener-d5b38.appspot.com",
			messagingSenderId: "349795577578"		
		};

		firebase.initializeApp(config);
		firebase.auth().onAuthStateChanged((user) => {
			if (user) {
				document.getElementById('loading').style.display = 'none';
				document.getElementById('home').style.display = 'block';
				this.showToast("Loading ...", 0);
				this.getData();
			}
			else {
				var provider = new firebase.auth.GoogleAuthProvider();
				firebase.auth().signInWithRedirect(provider);
			}
		});
		this.db = firebase.firestore();
	}

	getData = () => {
		var worker = new Worker('webworker.js');
		worker.addEventListener('message', (d) => {
			this.setState({ data: d.data });
			document.getElementById('originalurl').value = '';
			document.getElementById('shorturl').value = '';
			this._toastClosed();
		})		
		
		var data = [];
		this.db.collection('url').orderBy('timestamp', 'desc').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				data.push(doc.data())
			});
			worker.postMessage(data);
		}).catch(error => {
			this.showToast("Something went wrong. Please refresh the page.");
		});
	}

	generateShortUrl = () => {
		var shorturl = '';
		var length = 6;
		var string = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ';
		for (var i = 0; i < length; i++) {
			shorturl += string.charAt(Math.floor(Math.random() * string.length));
		}
		return shorturl;
	}

	shortenUrl = () => {
		var originalurl = document.getElementById('originalurl').value;
		var custom_shorturl = document.getElementById('shorturl').value.replace(this.state.url + '/', '');
		if (originalurl) {
			this.showToast("Loading ...", 0);
			if (document.getElementById('shorturl').value) {
				var shorturl = custom_shorturl;
			}
			else {
				var shorturl = this.generateShortUrl();
			}
			var urlRef = this.db.collection('url').doc(shorturl);
			urlRef.get().then(doc => {
				if (!doc.exists) {
					this.db.collection("url").doc(shorturl).set({
						shorturl: shorturl,
						fullurl: originalurl,
						count: 0,
						timestamp: new Date()
					}).then(() => {
						this.getData();
					}).catch(error => {
						this._toastClosed();
						this.showToast("Something went wrong. Please try again.");
					});

				} else {
					if (custom_shorturl) {
						this.showToast("Error. Please enter another custom short URL.");
					}
					else {
						this.shortenUrl();
					}
				}
			}).catch(err => {
				this.showToast("Something went wrong. Please try again.");
			});
		}
		else {
			this.showToast("Please enter a valid URL.");
		}
	}

	showToast = (msg, duration) => {
		clearTimeout(this.toast_timeout);
		document.getElementById('toast').innerHTML = msg;
		duration = duration || 3000;
		this._toastOpened();
		if (duration >= 0) {
			this.toast_timeout = setTimeout(() => {
				this._toastClosed();
			}, duration);
		}
	}

	_toastOpened = () => {
		document.getElementById('toast').animate(
			[
				{ transform: 'translateY(100px)', opacity: 0 },
				{ transform: 'translateY(0px)', opacity: 1 }
			], {
				fill: 'forwards',
				duration: 300
			}).play();
	}

	_toastClosed = () => {
		clearTimeout(this.toast_timeout);
		document.getElementById('toast').animate(
			[
				{ transform: 'translateY(0px)', opacity: 1 },
				{ transform: 'translateY(100px)', opacity: 0 }
			], {
				fill: 'forwards',
				duration: 300
			}).play();
	}

	shortUrlInput = (event) => {
		var url = this.state.url + '/';
		switch (event.type) {
			case 'focusout':
				if (event.target.value == url) {
					event.target.value = ''
				}
				break;
			case 'focus':
				if (!event.target.value) {
					setTimeout(() => {
						event.target.value = url
					}, 1);
				}
				break;
			case 'keydown':
				var oldVal = event.target.value;
				setTimeout(() => {
					if (event.target.value.indexOf(url) !== 0) {
						if (event.target.value == '') {
							event.target.value = url;
						}
						else {
							event.target.value = oldVal;
						}
					}
				}, 1);
				break;
		}
	}

	render({ }, { data, url }) {
		return (
			<div id="app">
				<Header />
				<div id="toast" class={style.toast}>Loading ...</div>
				<div id="loading" class={style.loading}>
					Loading ...
				</div>
				<div id="home" class={style.home}>
					<div class={style.header}>
						<div class={style.container}>
							<h1>Simplify your links</h1>
							<div class={style.input_container}>
								<input id="originalurl" placeholder="Your original URL here" />
							</div>
							<div class={style.input_container}>
								<input type="url" id="shorturl" onkeydown={this.shortUrlInput} onfocus={this.shortUrlInput} onfocusout={this.shortUrlInput} placeholder="Your custom short URL here (Optional)" />
								<Button ripple raised id="button" onClick={this.shortenUrl}>Shorten URL</Button>
							</div>
							<p>All {url} URLs are public and can be accessed by anyone</p>
						</div>
					</div>
					<div class={style.content}>
						<table>
							<thead>
								<tr>
									<th class={style.original}>Original URL</th>
									<th class={style.created}>Created</th>
									<th class={style.short}>Short URL</th>
									<th class={style.clicks}>All Clicks</th>
								</tr>
							</thead>
							<tbody>
								{data.map((item, i) => (
									<tr>
										<td class={style.original}><a target="_blank" href={item.fullurl}>{item.fullurl}</a></td>
										<td class={style.created}>{item.created}</td>
										<td class={style.short}><a target="_blank" href={'http://' + url + '/' + item.shorturl}>{url}/{item.shorturl}</a></td>
										<td class={style.clicks}>{item.count}</td>
									</tr>
								))}
							</tbody>
							<thead>
								<tr>
									<th class={style.original}>Original URL</th>
									<th class={style.created}>Created</th>
									<th class={style.short}>Short URL</th>
									<th class={style.clicks}>All Clicks</th>
								</tr>
							</thead>
						</table>
					</div>
				</div>
			</div>
		);
	}
}
