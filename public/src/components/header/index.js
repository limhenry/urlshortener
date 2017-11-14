import { h, Component } from 'preact';
import { route } from 'preact-router';
import Toolbar from 'preact-material-components/Toolbar';
import 'preact-material-components/Toolbar/style.css';
import style from './style';

export default class Header extends Component {

	render() {
		return (
			<div>
				<Toolbar class={style.toolbar}>
					<Toolbar.Row>
						<Toolbar.Section align-start>
							<Toolbar.Title>URL Shortener</Toolbar.Title>
						</Toolbar.Section>
					</Toolbar.Row>
				</Toolbar>
			</div>
		);
	}
}
