import Extend from 'flarum/common/extenders';
import MemberDirectoryPage from './components/MemberDirectoryPage';

export default [
  new Extend.Routes()
    .add('members', '/members', MemberDirectoryPage),
];
