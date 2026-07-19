import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import Button from 'flarum/common/components/Button';
import PositionsTab from './PositionsTab';
import MembersTab from './MembersTab';
import SettingsTab from './SettingsTab';
import ImportTab from './ImportTab';

export default class OrgMemberDirectoryPage extends ExtensionPage {
  activeTab: 'positions' | 'members' | 'settings' | 'import' = 'positions';
  loadingData: boolean = true;
  directoryData: {
    positions: any[];
    positionless: any[];
    past: any[];
  } = {
    positions: [],
    positionless: [],
    past: [],
  };

  oninit(vnode: any) {
    super.oninit(vnode);

    this.refreshData();
  }

  refreshData() {
    this.loadingData = true;
    m.redraw();

    app
      .request({
        method: 'GET',
        url: `${app.forum.attribute('apiUrl')}/member-directory`,
      })
      .then((res: any) => {
        this.directoryData = res;
        this.loadingData = false;
        m.redraw();
      })
      .catch(() => {
        this.loadingData = false;
        m.redraw();
      });
  }

  content(): any {
    return (
      <div className="OrgMemberDirectoryPage ExtensionPage-settings">
        <div className="container">
          <div className="OrgMemberDirectory-tabs nav nav-pills mb-4">
            <Button
              className={`Button ${this.activeTab === 'positions' ? 'Button--primary' : ''}`}
              icon="fas fa-sitemap"
              onclick={() => {
                this.activeTab = 'positions';
              }}
            >
              {app.translator.trans('tapao-org-member-directory.admin.nav.positions_button')}
            </Button>
            <Button
              className={`Button ${this.activeTab === 'members' ? 'Button--primary' : ''}`}
              icon="fas fa-users"
              onclick={() => {
                this.activeTab = 'members';
              }}
            >
              {app.translator.trans('tapao-org-member-directory.admin.nav.members_button')}
            </Button>
            <Button
              className={`Button ${this.activeTab === 'settings' ? 'Button--primary' : ''}`}
              icon="fas fa-cog"
              onclick={() => {
                this.activeTab = 'settings';
              }}
            >
              {app.translator.trans('tapao-org-member-directory.admin.nav.settings_button')}
            </Button>
            <Button
              className={`Button ${this.activeTab === 'import' ? 'Button--primary' : ''}`}
              icon="fas fa-file-import"
              onclick={() => {
                this.activeTab = 'import';
              }}
            >
              {app.translator.trans('tapao-org-member-directory.admin.nav.import_button')}
            </Button>
          </div>

          <div className="OrgMemberDirectory-tabContent">
            {this.activeTab === 'positions' && (
              <PositionsTab
                positions={this.directoryData.positions}
                loading={this.loadingData}
                onRefresh={() => this.refreshData()}
              />
            )}
            {this.activeTab === 'members' && (
              <MembersTab
                positions={this.directoryData.positions}
                positionless={this.directoryData.positionless}
                past={this.directoryData.past}
                loading={this.loadingData}
                onRefresh={() => this.refreshData()}
              />
            )}
            {this.activeTab === 'settings' && <SettingsTab />}
            {this.activeTab === 'import' && (
              <ImportTab onRefresh={() => this.refreshData()} />
            )}
          </div>
        </div>
      </div>
    );
  }
}
