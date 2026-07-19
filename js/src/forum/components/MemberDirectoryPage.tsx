import Page from 'flarum/common/components/Page';
import app from 'flarum/forum/app';

export default class MemberDirectoryPage extends Page {
  oninit(vnode: any): void {
    super.oninit(vnode);
  }

  oncreate(vnode: any): void {
    super.oncreate(vnode);
    app.setTitle('Member Directory');
  }

  view(): any {
    return (
      <div className="MemberDirectoryPage">
        <div className="container">
          <h2>Member Directory</h2>
          <p>Coming soon — full member directory will be implemented in Phase 4.</p>
        </div>
      </div>
    );
  }
}
