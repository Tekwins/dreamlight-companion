import { render } from 'preact';
import { App } from './app.jsx';
import { initStore } from './lib/store.js';
import './styles.css';

render(<App />, document.getElementById('app'));
initStore();
