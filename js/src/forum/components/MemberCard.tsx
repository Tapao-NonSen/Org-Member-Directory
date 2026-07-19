import Component from 'flarum/common/Component';
import app from 'flarum/forum/app';
import Link from 'flarum/common/components/Link';
// @ts-expect-error - flarum/common/components/Avatar doesn't have type definitions in current flarum-tsconfig
import Avatar from 'flarum/common/components/Avatar';

export interface MemberCardAttrs {
  member: any;
  muted?: boolean;
}

export default class MemberCard extends Component<MemberCardAttrs> {
  view() {
    const { member, muted = false } = this.attrs;
    let userModel = member.user;
    
    // If the user is a raw JSON object (from our API) instead of a Flarum model,
    // push it into the Flarum store so avatar() and app.route.user() can use their getters.
    if (userModel && typeof userModel.slug !== 'function') {
      userModel = app.store.pushObject({ type: 'users', id: String(userModel.id), attributes: userModel });
      member.user = userModel;
    }
    
    // Use custom name if provided, otherwise fallback to Flarum display name
    const displayName = member.name || (userModel ? userModel.displayName() : 'Unknown');
    
    // Avatar
    const avatarEl = userModel ? (
      <Link href={app.route.user(userModel)}>
        <Avatar user={userModel} className="MemberCard-avatar" />
      </Link>
    ) : (
      <span className="Avatar MemberCard-avatar" />
    );

    const nameEl = userModel ? (
      <Link href={app.route.user(userModel)} className="MemberCard-name">
        {displayName}
      </Link>
    ) : (
      <span className="MemberCard-name">{displayName}</span>
    );

    const positionEl = member.position ? (
      <span 
        className="MemberCard-positionBadge" 
        style={member.position.color ? { backgroundColor: member.position.color } : {}}
      >
        {member.position.name}
      </span>
    ) : null;

    const cohortEl = member.cohort ? (
      <span className="MemberCard-cohortBadge">{member.cohort}</span>
    ) : null;

    const tenureEl = <div className="MemberCard-tenure">{this.formatTenure(member)}</div>;

    return (
      <div className={`MemberCard ${muted ? 'MemberCard--muted' : ''}`}>
        <div className="MemberCard-header">
          {avatarEl}
        </div>
        <div className="MemberCard-body">
          {nameEl}
          <div className="MemberCard-badges">
            {positionEl}
            {cohortEl}
          </div>
          {tenureEl}
        </div>
      </div>
    );
  }

  formatTenure(member: any): string {
    const granularity = app.forum.attribute('member-directory.date_granularity') || 'year';
    
    const formatStr = (dateStr: string | null): string => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      
      const bYear = d.getFullYear() + 543;
      
      if (granularity === 'year') {
        return `${bYear}`;
      } else if (granularity === 'month') {
        const month = d.toLocaleString('th-TH', { month: 'short' });
        return `${month} ${bYear}`;
      } else {
        const day = d.getDate();
        const month = d.toLocaleString('th-TH', { month: 'short' });
        return `${day} ${month} ${bYear}`;
      }
    };

    const start = formatStr(member.startedAt);
    const end = formatStr(member.endedAt);

    if (start && end) {
      return `${start} – ${end}`;
    } else if (start && !end) {
      const startedText = app.translator.trans('tapao-org-member-directory.forum.page.tenure_started');
      // If it's a current member, use 'Present'
      if (!this.attrs.muted) {
         const presentText = app.translator.trans('tapao-org-member-directory.forum.page.tenure_present');
         return `${start} – ${presentText}`;
      }
      return `${startedText} ${start}`;
    } else if (!start && end) {
      return `– ${end}`;
    }
    
    return '';
  }
}
