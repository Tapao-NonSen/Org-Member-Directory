import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import Select from 'flarum/common/components/Select';
import Stream from 'flarum/common/utils/Stream';

export default class SettingsTab extends Component {
  dateGranularity!: Stream<string>;
  cardsPerRow!: Stream<string>;
  yearFormat!: Stream<string>;
  isSaving: boolean = false;

  oninit(vnode: any) {
    super.oninit(vnode);

    this.dateGranularity = Stream(
      app.data.settings['member-directory.date_granularity'] || 'year'
    );
    this.cardsPerRow = Stream(
      app.data.settings['member-directory.cards_per_row'] || '4'
    );
    this.yearFormat = Stream(
      app.data.settings['member-directory.year_format'] || 'be'
    );
  }

  view(): any {
    const granularityOptions = {
      year: app.translator.trans('tapao-org-member-directory.admin.settings.granularity_year') as string,
      month: app.translator.trans('tapao-org-member-directory.admin.settings.granularity_month') as string,
      full: app.translator.trans('tapao-org-member-directory.admin.settings.granularity_full') as string,
    };

    const cardsPerRowOptions = {
      '2': '2',
      '3': '3',
      '4': '4',
      '6': '6',
    };

    const yearFormatOptions = {
      be: app.translator.trans('tapao-org-member-directory.admin.settings.year_format_be') as string,
      ce: app.translator.trans('tapao-org-member-directory.admin.settings.year_format_ce') as string,
    };

    return (
      <div className="SettingsTab">
        <h2>{app.translator.trans('tapao-org-member-directory.admin.settings.title')}</h2>

        <form onsubmit={(e: SubmitEvent) => this.save(e)}>
          <div className="Form-group">
            <label>{app.translator.trans('tapao-org-member-directory.admin.settings.date_granularity_label')}</label>
            <div className="helpText">
              {app.translator.trans('tapao-org-member-directory.admin.settings.date_granularity_help')}
            </div>
            <Select
              options={granularityOptions}
              value={this.dateGranularity()}
              onchange={(val: string) => this.dateGranularity(val)}
            />
          </div>

          <div className="Form-group">
            <label>{app.translator.trans('tapao-org-member-directory.admin.settings.cards_per_row_label')}</label>
            <div className="helpText">
              {app.translator.trans('tapao-org-member-directory.admin.settings.cards_per_row_help')}
            </div>
            <Select
              options={cardsPerRowOptions}
              value={this.cardsPerRow()}
              onchange={(val: string) => this.cardsPerRow(val)}
            />
          </div>

          <div className="Form-group">
            <label>{app.translator.trans('tapao-org-member-directory.admin.settings.year_format_label')}</label>
            <div className="helpText">
              {app.translator.trans('tapao-org-member-directory.admin.settings.year_format_help')}
            </div>
            <Select
              options={yearFormatOptions}
              value={this.yearFormat()}
              onchange={(val: string) => this.yearFormat(val)}
            />
          </div>

          <div className="Form-group">
            <Button
              type="submit"
              className="Button Button--primary"
              loading={this.isSaving}
            >
              {app.translator.trans('core.admin.settings.submit_button')}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  save(e: SubmitEvent) {
    e.preventDefault();
    this.isSaving = true;

    app
      .request({
        method: 'POST',
        url: `${app.forum.attribute('apiUrl')}/settings`,
        body: {
          'member-directory.date_granularity': this.dateGranularity(),
          'member-directory.cards_per_row': this.cardsPerRow(),
          'member-directory.year_format': this.yearFormat(),
        },
      })
      .then(() => {
        app.data.settings['member-directory.date_granularity'] = this.dateGranularity();
        app.data.settings['member-directory.cards_per_row'] = this.cardsPerRow();
        app.data.settings['member-directory.year_format'] = this.yearFormat();
        this.isSaving = false;
        app.alerts.show({ type: 'success' }, app.translator.trans('core.admin.settings.saved_message'));
        m.redraw();
      })
      .catch((err: any) => {
        this.isSaving = false;
        m.redraw();
        throw err;
      });
  }
}
