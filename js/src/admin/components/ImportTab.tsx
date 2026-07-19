import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Select from 'flarum/common/components/Select';
import Stream from 'flarum/common/utils/Stream';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';

export interface GroupData {
  id: string;
  nameSingular: string;
  namePlural: string;
  color?: string;
  icon?: string;
}

export interface ImportTabAttrs {
  onRefresh: () => void;
}

export default class ImportTab extends Component<ImportTabAttrs> {
  selectedGroupId!: Stream<string>;
  groups: GroupData[] = [];
  loadingGroups: boolean = true;
  isImporting: boolean = false;
  resultMessage: string | null = null;

  oninit(vnode: any) {
    super.oninit(vnode);

    this.selectedGroupId = Stream('');
    this.fetchGroups();
  }

  fetchGroups() {
    this.loadingGroups = true;
    app.store
      .find('groups')
      .then((groups: any[]) => {
        this.groups = groups.map((g: any) => ({
          id: String(g.id()),
          nameSingular: g.nameSingular(),
          namePlural: g.namePlural(),
          color: g.color(),
          icon: g.icon(),
        }));
        this.loadingGroups = false;
        m.redraw();
      })
      .catch(() => {
        this.loadingGroups = false;
        m.redraw();
      });
  }

  view(): any {
    const groupOptions: Record<string, string> = {
      '': app.translator.trans('tapao-org-member-directory.admin.import.group_select_placeholder') as string,
    };

    this.groups.forEach((g) => {
      groupOptions[g.id] = `${g.namePlural} (ID: ${g.id})`;
    });

    return (
      <div className="ImportTab">
        <h2>{app.translator.trans('tapao-org-member-directory.admin.import.title')}</h2>
        <p className="helpText">{app.translator.trans('tapao-org-member-directory.admin.import.description')}</p>

        {this.resultMessage && (
          <div className="Alert Alert--success OrgMemberDirectory-importResult">
            {this.resultMessage}
          </div>
        )}

        {this.loadingGroups ? (
          <LoadingIndicator />
        ) : (
          <form onsubmit={(e: SubmitEvent) => this.submitImport(e)}>
            <div className="Form-group">
              <label>{app.translator.trans('tapao-org-member-directory.admin.import.group_label')}</label>
              <Select
                options={groupOptions}
                value={this.selectedGroupId()}
                onchange={(val: string) => this.selectedGroupId(val)}
              />
            </div>

            <div className="Form-group">
              <Button
                type="submit"
                className="Button Button--primary"
                loading={this.isImporting}
                disabled={!this.selectedGroupId()}
                icon="fas fa-file-import"
              >
                {app.translator.trans('tapao-org-member-directory.admin.import.submit_button')}
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  submitImport(e: SubmitEvent) {
    e.preventDefault();
    const groupId = this.selectedGroupId();
    if (!groupId) return;

    this.isImporting = true;
    this.resultMessage = null;

    app
      .request({
        method: 'POST',
        url: `${app.forum.attribute('apiUrl')}/member-directory/import`,
        body: {
          groupId: Number(groupId),
        },
      })
      .then((res: any) => {
        this.isImporting = false;
        this.resultMessage = app.translator.trans('tapao-org-member-directory.admin.import.success_result', {
          created: res.created,
          skipped: res.skipped,
        }) as string;
        this.attrs.onRefresh();
        m.redraw();
      })
      .catch((err: any) => {
        this.isImporting = false;
        m.redraw();
        throw err;
      });
  }
}
