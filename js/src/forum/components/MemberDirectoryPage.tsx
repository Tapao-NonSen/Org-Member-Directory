import Page from 'flarum/common/components/Page';
import app from 'flarum/forum/app';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
// @ts-expect-error - flarum/common/utils/extractText doesn't have type definitions in current flarum-tsconfig
import extractText from 'flarum/common/utils/extractText';
import PositionSection from './PositionSection';
import PastMembersSection from './PastMembersSection';
import MemberCard from './MemberCard';

export default class MemberDirectoryPage extends Page {
  loading: boolean = true;
  positions: any[] = [];
  positionless: any[] = [];
  past: any[] = [];

  oninit(vnode: any): void {
    super.oninit(vnode);
    this.loadData();
  }

  oncreate(vnode: any): void {
    super.oncreate(vnode);
    app.setTitle(extractText(app.translator.trans('tapao-org-member-directory.forum.page.title')));
  }

  loadData(): void {
    app
      .request({
        method: 'GET',
        url: app.forum.attribute('apiUrl') + '/member-directory',
      })
      .then((response: any) => {
        this.positions = response.positions || [];
        this.positionless = response.positionless || [];
        this.past = response.past || [];
        this.loading = false;
        m.redraw();
      })
      .catch(() => {
        this.loading = false;
        m.redraw();
      });
  }

  view(): any {
    return (
      <div className="MemberDirectoryPage">
        <div className="container">
          <h2 className="MemberDirectoryPage-title">
            {app.translator.trans('tapao-org-member-directory.forum.page.title')}
          </h2>
          {this.loading ? (
            <LoadingIndicator />
          ) : (
            this.content()
          )}
        </div>
      </div>
    );
  }

  content(): any {
    const hasCurrent = this.positions.length > 0 || this.positionless.length > 0;
    const hasPast = this.past.length > 0;

    return (
      <div className="MemberDirectoryPage-content">
        {!hasCurrent && !hasPast ? (
          <div className="MemberDirectoryPage-empty">
            {app.translator.trans('tapao-org-member-directory.forum.page.empty_text')}
          </div>
        ) : (
          <>
            {this.currentMembersView(hasCurrent)}
            {this.pastMembersView(hasPast)}
          </>
        )}
      </div>
    );
  }

  currentMembersView(hasCurrent: boolean): any {
    if (!hasCurrent) return null;

    return (
      <div className="MemberDirectoryPage-current">
        {this.positions.map((position) => (
          <PositionSection position={position} />
        ))}
        {this.positionless.length > 0 && (
          <div className="PositionSection PositionSection--positionless">
            <div className="MemberGrid">
              {this.positionless.map((member) => (
                <MemberCard member={member} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  pastMembersView(hasPast: boolean): any {
    if (!hasPast) return null;

    return (
      <div className="MemberDirectoryPage-past">
        <h3 className="MemberDirectoryPage-pastTitle">
          {app.translator.trans('tapao-org-member-directory.forum.page.past_members_heading')}
        </h3>
        {this.past.map((group) => (
          <PastMembersSection cohort={group.cohort} members={group.members} />
        ))}
      </div>
    );
  }
}
