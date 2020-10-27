import { Component } from 'preact';
import { TopAppBar, Button } from 'preact-material-components';
import 'preact-material-components/TopAppBar/style.css';
import 'preact-material-components/Button/style.css';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import Worker from 'worker-loader!./Worker.js';
import config from './config.js';
import './style';

export default class App extends Component {

	state = {
		baseUrl: config.baseUrl,
		data: [],
		user: false
	}

	constructor() {
		super();

		firebase.initializeApp(config.firebase);
		firebase.auth().onAuthStateChanged((user) => {
			if (user) {
				this.setState({ user });
				document.getElementById('loading').style.display = 'none';
				document.getElementById('home').style.display = 'block';
				this.showToast('Loading ...', 0);
				this.getData();
			}
			else {
				let provider = new firebase.auth.GoogleAuthProvider();
				firebase.auth().signInWithRedirect(provider);
			}
		});
		this.db = firebase.firestore();
	}

	getData = () => {
		let worker = new Worker();
		worker.addEventListener('message', (d) => {
			this.setState({ data: d.data });
			document.getElementById('originalurl').value = '';
			document.getElementById('shorturl').value = '';
			this._toastClosed();
		});

		let data = [];
		this.db.collection('url').orderBy('timestamp', 'desc').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				const d = doc.data();
				d.id = doc.id;
				d.timestamp = d.timestamp.toDate();
				data.push(d);
			});
			worker.postMessage(data);
		}).catch(() => {
			this.showToast('Something went wrong. Please refresh the page.');
		});
	}

	generateShortUrl = () => {
		let shorturl = '';
		let length = 6;
		let string = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ';
		for (let i = 0; i < length; i++) {
			shorturl += string.charAt(Math.floor(Math.random() * string.length));
		}
		return shorturl;
	}

	shortenUrl = () => {
		let originalurl = document.getElementById('originalurl').value;
		let customShorturl = document.getElementById('shorturl').value.replace(this.state.baseUrl + '/', '');
		if (originalurl) {
			this.showToast('Loading ...', 0);
			const shorturlValue = document.getElementById('shorturl').value;
			const shorturl = shorturlValue ? customShorturl : this.generateShortUrl();
			let urlRef = this.db.collection('url').doc(shorturl);
			urlRef.get().then(doc => {
				if (!doc.exists) {
					this.db.collection('url').doc(shorturl).set({
						shorturl,
						fullurl: originalurl,
						count: 0,
						timestamp: new Date()
					}).then(() => {
						this.getData();
						this.showToast('Added successfully.');
					}).catch(error => {
						this._toastClosed();
						this.showToast('Something went wrong. Please try again.');
					});

				}
				else if (customShorturl) {
					this.showToast('Error. Please enter another custom short URL.');
				}
				else {
					this.shortenUrl();
				}
			}).catch(err => {
				this.showToast('Something went wrong. Please try again.');
			});
		}
		else {
			this.showToast('Please enter a valid URL.');
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
		let url = this.state.baseUrl + '/';
		switch (event.type) {
			case 'focusout':
				if (event.target.value === url) {
					event.target.value = '';
				}
				break;
			case 'focus':
				if (!event.target.value) {
					setTimeout(() => {
						event.target.value = url;
					}, 1);
				}
				break;
			case 'keydown': {
				const oldVal = event.target.value;
				setTimeout(() => {
					if (event.target.value.indexOf(url) !== 0) {
						if (event.target.value === '') {
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
	}

	deleteUrl = (e) => () => {
		const msg = `This action cannot be undone. Are you sure you want to delete ${this.state.baseUrl}/${e.shorturl}?`;
		if (!window.confirm(msg)) return;
		this.db.collection('url').doc(e.id).delete()
			.then(() => {
				this.showToast('Delete successful.');
				this.getData();
			})
			.catch((e) => {
				this.showToast('Unable to delete URL. Please try again.');
			});
	}

	render({ }, { data, baseUrl, user }) {
		return (
			<div class="app">
				<TopAppBar className="toolbar mdc-top-app-bar--fixed">
					<TopAppBar.Row>
						<TopAppBar.Section align-start>
							<TopAppBar.Title>URL Shortener</TopAppBar.Title>
						</TopAppBar.Section>
						{ user && (
							<TopAppBar.Section align-end>
								<div class="profile">
									<img src={user.photoURL} title={`${user.displayName} · ${user.email}`} />
								</div>
							</TopAppBar.Section>
						)}
					</TopAppBar.Row>
				</TopAppBar>
				<div id="toast" class="toast">Loading ...</div>
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
								<input type="url" id="shorturl" onkeydown={this.shortUrlInput} onfocus={this.shortUrlInput} onfocusout={this.shortUrlInput} placeholder="Your custom short URL here (Optional)" />
								<Button ripple raised id="button" onClick={this.shortenUrl}>Shorten URL</Button>
							</div>
							<p>All <b>{baseUrl}</b> URLs are public and can be accessed by anyone.</p>
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
									<th class="manage">Manage</th>
								</tr>
							</thead>
							<tbody>
								{data.map((item) => (
									<tr>
										<td class="original">
											<a target="_blank" rel="noreferrer"  href={item.fullurl} title={item.fullurl}>{item.fullurl}</a>
										</td>
										<td class="created">{item.timestamp.toDateString()}</td>
										<td class="short">
											<a target="_blank" rel="noreferrer" href={'https://' + baseUrl + '/' + item.shorturl}>{baseUrl}/{item.shorturl}</a>
										</td>
										<td class="clicks">{item.count}</td>
										<td class="manage">
											<div class="delete" onClick={this.deleteUrl(item)}>
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
													<path d="M0 0h24v24H0V0z" fill="none" />
													<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v10zM9 9h6c.55 0 1 .45 1 1v8c0 .55-.45 1-1 1H9c-.55 0-1-.45-1-1v-8c0-.55.45-1 1-1zm6.5-5l-.71-.71c-.18-.18-.44-.29-.7-.29H9.91c-.26 0-.52.11-.7.29L8.5 4H6c-.55 0-1 .45-1 1s.45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1h-2.5z" />
												</svg>
											</div>
										</td>
									</tr>
								))}
							</tbody>
							<thead>
								<tr>
									<th class="original">Original URL</th>
									<th class="created">Created</th>
									<th class="short">Short URL</th>
									<th class="clicks">All Clicks</th>
									<th class="manage">Manage</th>
								</tr>
							</thead>
						</table>
					</div>
				</div>
			</div>
		);
	}
}
