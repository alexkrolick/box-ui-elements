import 'core-js/es6/map';
import 'core-js/es6/set';
import 'raf/polyfill';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import 'jest-dom/extend-expect';
import { cleanup } from 'react-testing-library';

afterEach(() => {
    cleanup();
});

Enzyme.configure({ adapter: new Adapter() });
