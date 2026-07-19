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
  isImportingCsv: boolean = false;
  csvFile: File | null = null;
  resultMessage: string | null = null;
  csvResultMessage: string | null = null;

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

        <hr style={{ margin: '30px 0' }} />

        <h2>{app.translator.trans('tapao-org-member-directory.admin.import.csv_title', {}, 'Import from CSV')}</h2>
        <p className="helpText">{app.translator.trans('tapao-org-member-directory.admin.import.csv_description', {}, 'Upload a CSV file with headers: username, name, position_id, cohort, started_at, ended_at, sort_order')}</p>

        {this.csvResultMessage && (
          <div className="Alert Alert--success OrgMemberDirectory-importResult">
            {this.csvResultMessage}
          </div>
        )}

        <form onsubmit={(e: SubmitEvent) => this.submitCsvImport(e)}>
          <div className="Form-group">
            <input
              type="file"
              accept=".csv"
              className="FormControl"
              onchange={(e: Event) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files.length > 0) {
                  this.csvFile = target.files[0];
                } else {
                  this.csvFile = null;
                }
              }}
            />
          </div>

          <div className="Form-group">
            <Button
              type="submit"
              className="Button Button--primary"
              loading={this.isImportingCsv}
              disabled={!this.csvFile}
              icon="fas fa-file-csv"
            >
              {app.translator.trans('tapao-org-member-directory.admin.import.csv_submit_button', {}, 'Import CSV')}
            </Button>
          </div>
        </form>
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

  submitCsvImport(e: SubmitEvent) {
    e.preventDefault();
    if (!this.csvFile) return;

    this.isImportingCsv = true;
    this.csvResultMessage = null;

    const data = new FormData();
    data.append('csv', this.csvFile);

    app
      .request({
        method: 'POST',
        url: `${app.forum.attribute('apiUrl')}/member-directory/import-csv`,
        body: data,
        serialize: (obj: any) => obj, // Prevent Flarum from converting FormData to JSON
      })
      .then((res: any) => {
        this.isImportingCsv = false;
        this.csvResultMessage = app.translator.trans('tapao-org-member-directory.admin.import.csv_success_result', {
          created: res.created,
          updated: res.updated,
        }, `Successfully imported! Created ${res.created} records and updated ${res.updated}.`) as string;
        
        if (res.errors && res.errors.length > 0) {
          this.csvResultMessage += ` However, there were some errors: \n${res.errors.join('\n')}`;
        }
        
        this.csvFile = null;
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        this.attrs.onRefresh();
        m.redraw();
      })
      .catch((err: any) => {
        this.isImportingCsv = false;
        m.redraw();
        
        if (err.response && err.response.errors && err.response.errors.length > 0) {
           this.csvResultMessage = `Error: ${err.response.errors[0].detail}`;
        } else {
           throw err;
        }
      });
  }
}
